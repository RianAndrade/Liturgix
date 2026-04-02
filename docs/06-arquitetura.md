# Arquitetura do Sistema

## 1. Diagrama de Servicos

```
                         +---------------------------+
                         |        Frontend           |
                         |   React 19 + Vite 6       |
                         |   (SPA - navegador)       |
                         +------------+--------------+
                                      |
                                      | HTTP (porta 3000)
                                      |
+-------------------------------------+--------------------------------------+
|                              liturgix-net (bridge)                          |
|                                                                            |
|  +---------------------------+        +------------------------------+     |
|  |         app               |        |          redis               |     |
|  |  Fastify 5 + TypeScript   |<------>|    Redis 7 Alpine            |     |
|  |  Porta: 3000              |        |    Porta: 6379               |     |
|  |                           |        |                              |     |
|  |  - API REST               |        |  - Broker do Celery          |     |
|  |  - Serve React estatico   |        |  - Blacklist JWT (logout)    |     |
|  |  - Autenticacao JWT       |        |  - Cache de sessoes          |     |
|  |  - Logica de negocio      |        |                              |     |
|  +------------+--------------+        +-------+----------------------+     |
|               |                               |                            |
|               | Prisma ORM                    | Redis Queue                |
|               |                               |                            |
|  +------------+--------------+        +-------+----------------------+     |
|  |         db                |        |          worker              |     |
|  |  PostgreSQL 16 Alpine     |<-------|    Celery (Python 3.12)      |     |
|  |  Porta: 5432              |        |    Porta: --                 |     |
|  |                           |        |                              |     |
|  |  - Armazenamento          |        |  - Geracao assincrona        |     |
|  |    persistente            |        |    de escalas                |     |
|  |  - Gerenciado via Prisma  |        |  - Escrita de resultados     |     |
|  +---------------------------+        +------------------------------+     |
|                                                                            |
+----------------------------------------------------------------------------+

Healthchecks:
  db    -> pg_isready (5s intervalo, 3s timeout, 5 retries)
  redis -> redis-cli ping (5s intervalo, 3s timeout, 5 retries)

Restart policy: unless-stopped (todos os servicos)

Volumes persistentes:
  pgdata       -> /var/lib/postgresql/data
  redisdata    -> /data
  app_uploads  -> /app/uploads
  worker_data  -> /app/data
```

---

## 2. Responsabilidades de Cada Servico

### 2.1 app (Fastify 5 + TypeScript)

Servico principal da aplicacao. Responsavel por toda a logica de negocio e comunicacao com o frontend.

| Responsabilidade | Descricao |
|-----------------|-----------|
| **API REST** | Expoe todos os endpoints da aplicacao (`/api/*`) |
| **Servir frontend** | Em producao, serve os arquivos estaticos do React via `@fastify/static` |
| **Autenticacao JWT** | Gerencia registro, login, logout e validacao de tokens via `@fastify/jwt` |
| **Logica de negocio** | Validacao de dados (Zod), regras de negocio, RBAC |
| **Acesso a dados** | Comunicacao com PostgreSQL via Prisma ORM |
| **Enfileiramento** | Envia tarefas assincronas para o Redis (fila do Celery) |
| **Cache** | Consulta Redis para blacklist de JWT e cache de sessoes |

### 2.2 db (PostgreSQL 16 Alpine)

Banco de dados relacional principal. Armazena todos os dados persistentes da aplicacao.

| Responsabilidade | Descricao |
|-----------------|-----------|
| **Armazenamento persistente** | Usuarios, celebracoes, escalas, atribuicoes, auditoria |
| **Gerenciado por Prisma** | Schema definido em `schema.prisma`, migracoes controladas |
| **Integridade referencial** | Foreign keys, constraints, indices |
| **Volume persistente** | Dados sobrevivem a restart do container (`pgdata`) |

### 2.3 redis (Redis 7 Alpine)

Servico de cache e fila de mensagens. Atua como intermediario entre a API e o worker.

| Responsabilidade | Descricao |
|-----------------|-----------|
| **Broker do Celery** | Fila de tarefas para processamento assincrono |
| **Blacklist de JWT** | Tokens invalidados por logout, com TTL igual a expiracao do token |
| **Cache de sessoes** | Dados frequentemente acessados para reduzir carga no PostgreSQL |
| **Volume persistente** | Dados sobrevivem a restart (`redisdata`) |

### 2.4 worker (Celery Python 3.12)

Worker assincrono para tarefas de longa duracao. Opera de forma independente da API.

| Responsabilidade | Descricao |
|-----------------|-----------|
| **Geracao de escalas** | Executa o algoritmo de geracao automatica de escalas liturgicas |
| **Consumo de fila** | Consome tarefas da fila Redis (broker do Celery) |
| **Escrita de resultados** | Grava os resultados da geracao diretamente no PostgreSQL |
| **Atualizacao de status** | Marca tarefas como completas/falhas para polling do frontend |

---

## 3. Fluxo de Requisicao

### 3.1 Requisicao sincrona (leitura/escrita simples)

```
+----------+     HTTP      +---------+    Prisma    +------------+
| Frontend | ------------> | Fastify | -----------> | PostgreSQL |
|  (React) |               |   API   |              |            |
|          | <------------ |         | <----------- |            |
+----------+   JSON resp   +---------+   Query res  +------------+
```

**Exemplo**: `GET /api/celebrations` (listar celebracoes)

1. Frontend envia requisicao HTTP com header `Authorization: Bearer <JWT>`
2. Fastify recebe a requisicao
3. Auth guard valida o JWT e verifica blacklist no Redis
4. Role guard verifica se o papel do usuario permite a acao
5. Validacao de query params com Zod
6. Service layer consulta PostgreSQL via Prisma
7. Resposta formatada retorna ao frontend

### 3.2 Requisicao com Redis (autenticacao/cache)

```
+----------+     HTTP      +---------+   ioredis    +-------+
| Frontend | ------------> | Fastify | -----------> | Redis |
|  (React) |               |   API   |              |       |
|          | <------------ |         | <----------- |       |
+----------+   JSON resp   +---------+    Result    +-------+
```

**Exemplo**: `POST /api/auth/logout` (invalidar token)

1. Frontend envia requisicao com o JWT no header
2. Fastify extrai o token e calcula o TTL restante
3. Token e adicionado a blacklist no Redis com `SET token:xxx BLACKLISTED EX <ttl>`
4. Resposta `200 OK` retorna ao frontend

---

## 4. Fluxo de Geracao Assincrona de Escalas

A geracao de escalas e o fluxo mais complexo da aplicacao. Utiliza processamento assincrono para nao bloquear a API durante a execucao do algoritmo.

```
+----------+  POST /api/   +---------+   LPUSH    +-------+   Consume    +--------+
| Frontend | schedules/ -> | Fastify | ---------> | Redis | -----------> | Celery |
|  (React) |  generate     |   API   |            | Queue |              | Worker |
+----+-----+               +----+----+            +-------+              +----+---+
     |                          |                                             |
     |    202 Accepted          |                                             |
     |    { taskId: "..." }     |                                             |
     | <------------------------+                                             |
     |                                                                        |
     |                                                              +---------+---------+
     |                                                              | Executa algoritmo |
     |                                                              | de geracao        |
     |                                                              +---------+---------+
     |                                                                        |
     |                                                                        | INSERT/UPDATE
     |                                                                        v
     |                                                              +------------------+
     |                                                              |   PostgreSQL     |
     |                                                              | (escalas,        |
     |    GET /api/schedules/:id     +---------+    Prisma          |  atribuicoes,    |
     | ----------------------------> | Fastify | -----------------> |  conflitos,      |
     |                               |   API   |                   |  auditoria)      |
     | <---------------------------- |         | <----------------- |                  |
     |    { status: "completed" }    +---------+                   +------------------+
```

### Passo a passo detalhado:

1. **Frontend envia `POST /api/schedules/generate`** com parametros (periodo, celebracoes selecionadas)
2. **Fastify valida** a requisicao (auth, role COORDINATOR+, payload Zod)
3. **Fastify cria registro** de Schedule no PostgreSQL com status `GENERATING`
4. **Fastify enfileira tarefa** no Redis via `LPUSH celery` com mensagem no formato Celery:
   ```json
   {
     "id": "uuid-da-tarefa",
     "task": "tasks.generate_schedule",
     "args": [{ "scheduleId": "...", "config": {...} }],
     "kwargs": {}
   }
   ```
5. **Fastify retorna `202 Accepted`** com `{ taskId, status: "queued" }`
6. **Celery worker consome** a mensagem da fila Redis
7. **Worker executa o algoritmo** de geracao (satisfacao de restricoes com pontuacao ponderada)
8. **Worker grava resultados** no PostgreSQL:
   - Atribuicoes (`ScheduleAssignment`)
   - Conflitos detectados (vagas nao preenchidas)
   - Trilha de auditoria (`ScheduleAuditLog`)
9. **Worker atualiza status** da Schedule para `DRAFT` (com ou sem conflitos)
10. **Frontend faz polling** via `GET /api/schedules/:id` ate o status mudar de `GENERATING`

---

## 5. Estrategia de Autenticacao JWT

### 5.1 Visao Geral

A autenticacao usa JSON Web Tokens (JWT) via o plugin `@fastify/jwt`. Tokens sao stateless, mas o logout e implementado com uma blacklist no Redis.

```
+------------------+
|   @fastify/jwt   |
|                  |
|  sign()          |  <-- Gera token no login/registro
|  verify()        |  <-- Valida token em cada requisicao
|  decode()        |  <-- Extrai payload sem validar
+------------------+

Payload do JWT:
{
  "userId": "uuid",
  "role": "ACOLYTE | GUARDIAN | COORDINATOR | ADMIN",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### 5.2 Fluxo de Registro

```
Cliente                         API                         PostgreSQL
  |                              |                              |
  |  POST /api/auth/register     |                              |
  |  { name, email, password,    |                              |
  |    role: ACOLYTE|GUARDIAN }   |                              |
  | ----------------------------> |                              |
  |                              |  Valida com Zod              |
  |                              |  Verifica email unico -----> |
  |                              |  bcrypt.hash(password) ----> |
  |                              |  INSERT user ------------->  |
  |                              |  jwt.sign(payload)           |
  |  <--------------------------- |                              |
  |  { token, user }             |                              |
```

1. Validacao do payload com schema Zod (nome, email, senha, papel)
2. Verificacao de email unico no banco
3. Hash da senha com `bcrypt` (salt rounds configuravel)
4. Criacao do usuario no PostgreSQL via Prisma
5. Geracao do JWT com `userId` e `role` no payload
6. Retorno do token e dados do usuario

### 5.3 Fluxo de Login

```
Cliente                         API                         PostgreSQL
  |                              |                              |
  |  POST /api/auth/login        |                              |
  |  { email, password }         |                              |
  | ----------------------------> |                              |
  |                              |  Busca user por email -----> |
  |                              |  bcrypt.compare(password)    |
  |                              |  jwt.sign(payload)           |
  |  <--------------------------- |                              |
  |  { token, user }             |                              |
```

1. Busca usuario por email no PostgreSQL
2. Compara senha fornecida com hash armazenado via `bcrypt.compare()`
3. Se valido, gera JWT com `userId` e `role`
4. Retorna token e dados do usuario

### 5.4 Fluxo de Logout (Blacklist no Redis)

```
Cliente                         API                         Redis
  |                              |                              |
  |  POST /api/auth/logout       |                              |
  |  Authorization: Bearer xxx   |                              |
  | ----------------------------> |                              |
  |                              |  Decodifica token            |
  |                              |  Calcula TTL restante        |
  |                              |  SET blacklist:xxx EX ttl -> |
  |  <--------------------------- |                              |
  |  { success: true }           |                              |
```

1. Extrai o token do header `Authorization`
2. Decodifica o token para obter o `exp` (expiracao)
3. Calcula o TTL restante (`exp - now`)
4. Adiciona o token a blacklist no Redis com `SET blacklist:<token> 1 EX <ttl>`
5. O TTL garante que a entrada expira automaticamente junto com o token

### 5.5 Auth Guard (Middleware de Autenticacao)

```
Requisicao                      Auth Guard                  Redis
  |                              |                              |
  |  Authorization: Bearer xxx   |                              |
  | ----------------------------> |                              |
  |                              |  jwt.verify(token)           |
  |                              |  GET blacklist:xxx --------> |
  |                              |  Se na blacklist: 401        |
  |                              |  Se valido: next()           |
  |                              |  request.user = payload      |
```

Executado em todas as rotas protegidas:

1. Extrai o token do header `Authorization: Bearer <token>`
2. Valida a assinatura e expiracao com `jwt.verify()`
3. Consulta Redis para verificar se o token esta na blacklist
4. Se blacklisted, retorna `401 Unauthorized`
5. Se valido, injeta `request.user` com `{ userId, role }` e prossegue

### 5.6 Role Guard (Middleware de Autorizacao)

```
Requisicao                      Role Guard
  |                              |
  |  request.user.role           |
  | ----------------------------> |
  |                              |  Compara com roles permitidos
  |                              |  Se autorizado: next()
  |                              |  Se nao: 403 Forbidden
```

Executado apos o auth guard em rotas que exigem papel especifico:

1. Le `request.user.role` (injetado pelo auth guard)
2. Compara com a lista de papeis permitidos para o endpoint
3. Hierarquia: `ADMIN > COORDINATOR > GUARDIAN > ACOLYTE`
4. Se o papel nao e suficiente, retorna `403 Forbidden`

---

## 6. CORS e Seguranca

### 6.1 CORS (`@fastify/cors`)

Configuracao do Cross-Origin Resource Sharing para permitir requisicoes do frontend:

```typescript
await app.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

- Em **desenvolvimento**: permite `http://localhost:5173` (Vite dev server)
- Em **producao**: permite apenas a origem configurada via variavel de ambiente
- `credentials: true` para envio de cookies e headers de autorizacao

### 6.2 Helmet (Headers de Seguranca)

Headers HTTP de seguranca via `@fastify/helmet`:

| Header | Valor | Proposito |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `X-XSS-Protection` | `0` | Desabilita filtro XSS legado do navegador |
| `Strict-Transport-Security` | `max-age=31536000` | Forca HTTPS |
| `Content-Security-Policy` | Configurado por rota | Previne injecao de scripts |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla informacao de referrer |

### 6.3 Rate Limiting

Limitacao de taxa nos endpoints de autenticacao para prevenir ataques de forca bruta:

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `POST /api/auth/login` | 5 tentativas | 15 minutos |
| `POST /api/auth/register` | 3 tentativas | 15 minutos |
| Demais endpoints | 100 requisicoes | 1 minuto |

Implementado via `@fastify/rate-limit` com armazenamento no Redis para consistencia entre restarts.

### 6.4 Validacao de Entrada (Zod)

Toda entrada de dados e validada com schemas Zod antes de atingir a logica de negocio:

```
Requisicao -> Zod Schema -> Validacao OK -> Handler
                         -> Validacao FALHA -> 400 Bad Request com detalhes
```

- **Body**: validado em todas as rotas POST/PATCH/PUT
- **Query params**: validado em rotas de listagem (paginacao, filtros)
- **Path params**: validado (UUID format, etc.)
- Mensagens de erro traduzidas para portugues quando possivel

---

## 7. Estrutura de Plugins Fastify

O Fastify usa uma arquitetura de plugins que permite modularizar a aplicacao. Cada plugin encapsula uma responsabilidade especifica.

```
server.ts (ponto de entrada)
  |
  |-- register(prismaPlugin)      # Singleton do Prisma Client
  |     |
  |     +-- app.prisma             # Decorador disponivel em toda a app
  |
  |-- register(authPlugin)         # Configuracao do @fastify/jwt
  |     |
  |     +-- app.jwt                # Decorador para sign/verify
  |     +-- app.authenticate       # Decorador preHandler (auth guard)
  |
  |-- register(corsPlugin)         # Configuracao do @fastify/cors
  |
  |-- register(helmetPlugin)       # Headers de seguranca
  |
  |-- register(rateLimitPlugin)    # Rate limiting global
  |
  |-- register(staticPlugin)       # Serve frontend em producao
  |
  |-- register(routes)             # Rotas organizadas por dominio
        |
        |-- /api/auth/*            # auth.routes.ts
        |-- /api/users/*           # user.routes.ts
        |-- /api/servers/*         # server.routes.ts (acolitos)
        |-- /api/guardians/*       # guardian.routes.ts
        |-- /api/celebrations/*    # celebration.routes.ts
        |-- /api/schedules/*       # schedule.routes.ts
        |-- /api/public/*          # public.routes.ts
        |-- /api/admin/*           # admin.routes.ts
```

### 7.1 Plugin Prisma (`plugins/prisma.ts`)

Responsavel por criar e gerenciar o ciclo de vida do Prisma Client:

- Cria instancia unica do `PrismaClient`
- Conecta ao banco na inicializacao do plugin
- Desconecta no shutdown graceful do Fastify (`onClose` hook)
- Expoe `app.prisma` como decorador para acesso em handlers

### 7.2 Plugin Auth (`plugins/auth.ts`)

Configura autenticacao JWT e expoe decoradores de verificacao:

- Registra `@fastify/jwt` com secret de variavel de ambiente
- Cria decorador `app.authenticate` (preHandler) que valida JWT + blacklist
- Cria funcao `roleGuard(roles[])` que retorna preHandler de autorizacao
- Expoe `request.user` tipado com `{ userId: string, role: Role }`

### 7.3 Plugin CORS (`plugins/cors.ts`)

Configuracao isolada do CORS com valores de ambiente:

- Origem permitida via `CORS_ORIGIN`
- Metodos e headers configurados
- Credenciais habilitadas

### 7.4 Rotas como Plugins

Cada dominio de rotas e registrado como um plugin Fastify:

```typescript
// Exemplo: celebration.routes.ts
export default async function celebrationRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, listCelebrations);
  app.post('/', {
    preHandler: [app.authenticate, roleGuard(['COORDINATOR', 'ADMIN'])]
  }, createCelebration);
  // ...
}

// Registro no server.ts
app.register(celebrationRoutes, { prefix: '/api/celebrations' });
```

Cada arquivo de rotas:
- Recebe a instancia do Fastify com todos os decoradores ja disponiveis
- Define os handlers com preHandlers de auth e role conforme necessario
- Usa o prefix para isolar o namespace da rota

---

## 8. Infraestrutura Docker

### 8.1 Dockerfile Multi-stage

O Dockerfile principal usa 3 estagios para otimizar o tamanho da imagem final:

```
Estagio 1: frontend-build (node:20-alpine)
  - Instala dependencias do frontend
  - Executa npm run build (Vite)
  - Produz: /app/frontend/dist (arquivos estaticos)

Estagio 2: backend-build (node:20-alpine)
  - Instala dependencias do backend
  - Executa npm run build (TypeScript -> JavaScript)
  - Produz: /app/backend/dist (JavaScript compilado)

Estagio 3: production (node:20-alpine)
  - Instala apenas dependencias de producao (--omit=dev)
  - Copia dist do backend (JavaScript compilado)
  - Copia dist do frontend (arquivos estaticos -> /app/public)
  - Cria diretorio /app/uploads
  - Expoe porta 3000
  - CMD: node dist/server.js
```

**Resultado**: imagem final contem apenas o necessario para execucao, sem codigo-fonte TypeScript, dependencias de desenvolvimento ou ferramentas de build.

### 8.2 docker-compose.yml

Orquestracao dos 4 servicos com dependencias e healthchecks:

```
                    +----------+
                    |   app    |
                    | (Fastify)|
                    +----+-----+
                         |
              depends_on |
           (service_healthy)
                  +------+------+
                  |             |
            +-----+----+  +----+-----+
            |    db    |  |  redis   |
            | (PG 16) |  | (Redis 7)|
            +----------+  +----------+
                  ^             ^
                  |             |
            +-----+----+-------+
            |       worker      |
            |     (Celery)      |
            +-------------------+
```

**Ordem de inicializacao**:
1. `db` e `redis` iniciam em paralelo
2. `db` passa healthcheck (`pg_isready`) e `redis` passa healthcheck (`redis-cli ping`)
3. `app` e `worker` iniciam apos ambos estarem saudaveis

### 8.3 Volumes

| Volume | Servico | Mount | Proposito |
|--------|---------|-------|-----------|
| `pgdata` | db | `/var/lib/postgresql/data` | Dados do PostgreSQL |
| `redisdata` | redis | `/data` | Dados do Redis (persistencia RDB/AOF) |
| `app_uploads` | app | `/app/uploads` | Arquivos enviados pelos usuarios |
| `worker_data` | worker | `/app/data` | Dados temporarios do worker |

Todos os volumes usam driver `local` e persistem entre restarts e rebuilds dos containers.

### 8.4 Variaveis de Ambiente

Definidas em `.env` e injetadas via `env_file` e `environment` no compose:

| Variavel | Servico | Valor Padrao | Descricao |
|----------|---------|--------------|-----------|
| `POSTGRES_USER` | db, app, worker | `liturgix` | Usuario do PostgreSQL |
| `POSTGRES_PASSWORD` | db, app, worker | `liturgix` | Senha do PostgreSQL |
| `POSTGRES_DB` | db, app, worker | `liturgix` | Nome do banco de dados |
| `DATABASE_URL` | app, worker | (montada no compose) | Connection string completa |
| `REDIS_URL` | app, worker | `redis://redis:6379/0` | URL de conexao com Redis |
| `NODE_ENV` | app | `production` | Ambiente de execucao |
| `JWT_SECRET` | app | (definir em .env) | Chave secreta para assinatura JWT |
| `CORS_ORIGIN` | app | (definir em .env) | Origem permitida para CORS |

### 8.5 Rede

Todos os servicos compartilham a rede `liturgix-net` (driver `bridge`). Dentro da rede, os servicos se comunicam pelo nome do container:

- `app` acessa `db` como `db:5432`
- `app` acessa `redis` como `redis:6379`
- `worker` acessa `db` como `db:5432`
- `worker` acessa `redis` como `redis:6379`

Portas expostas para acesso externo (host):
- `3000` -> app (API + frontend)
- `5432` -> db (acesso direto para desenvolvimento)
- `6379` -> redis (acesso direto para desenvolvimento)

---

## 9. Resumo das Dependencias entre Servicos

```
app     --[Prisma ORM]-->    db         (leitura/escrita de dados)
app     --[ioredis]-->       redis      (blacklist JWT, cache, enfileirar tasks)
worker  --[Celery broker]--> redis      (consumir fila de tarefas)
worker  --[psycopg2]-->      db         (gravar resultados das tarefas)
```

| Comunicacao | Protocolo | Biblioteca | Direcao |
|-------------|-----------|------------|---------|
| app -> db | TCP/PostgreSQL | Prisma Client | Bidirecional (queries) |
| app -> redis | TCP/Redis | ioredis | Bidirecional (get/set/lpush) |
| worker -> redis | TCP/Redis | celery[redis] | Consumo de fila |
| worker -> db | TCP/PostgreSQL | psycopg2-binary | Escrita de resultados |
| frontend -> app | HTTP | fetch / API client | Request/Response |
