# Estrutura de Pastas

## Visao Geral

Este documento descreve a organizacao completa de diretorios e arquivos do projeto Liturgix, explicando o proposito de cada pasta, as convencoes de nomenclatura adotadas e a logica por tras de cada decisao organizacional.

A estrutura segue o principio de **separacao por responsabilidade**: cada diretorio agrupa arquivos que mudam pelos mesmos motivos e sao mantidos pelas mesmas pessoas.

---

## Arvore Completa

```
Liturgix/
├── docs/                              # Documentacao completa (20 documentos)
│   ├── 00-plano-mestre.md
│   ├── 01-visao-geral.md
│   ├── 02-escopo-funcional.md
│   ├── 03-perfis-permissoes.md
│   ├── 04-regras-negocio.md
│   ├── 05-fluxos-usuario.md
│   ├── 06-arquitetura.md
│   ├── 07-modelagem-dados.md
│   ├── 08-api-endpoints.md
│   ├── 09-algoritmo-escalas.md
│   ├── 10-telas-navegacao.md
│   ├── 11-componentes-ui.md
│   ├── 12-autenticacao-seguranca.md
│   ├── 13-estrategia-testes.md
│   ├── 14-infraestrutura.md
│   ├── 15-seed-dados-iniciais.md
│   ├── 16-glossario.md
│   ├── 17-decisoes-tecnicas.md
│   ├── 18-estrutura-pastas.md
│   ├── 19-checklist-validacao.md
│   └── 20-plano-half-loops.md
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Schema completo com todas as entidades
│   │   ├── migrations/                # Historico de migracoes do Prisma
│   │   └── seed.ts                    # Dados iniciais (9 funcoes liturgicas)
│   ├── src/
│   │   ├── server.ts                  # Ponto de entrada Fastify (registra plugins e rotas)
│   │   ├── plugins/
│   │   │   ├── auth.ts                # @fastify/jwt configuracao + decoradores
│   │   │   ├── prisma.ts              # Plugin do Prisma client (singleton)
│   │   │   └── cors.ts                # Configuracao de CORS
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # POST register, login, logout; GET me
│   │   │   ├── user.routes.ts         # GET list, detail; PATCH edit; DELETE soft
│   │   │   ├── server.routes.ts       # Endpoints de acolitos (availability, functions, history)
│   │   │   ├── guardian.routes.ts     # GET list, linked acolytes; POST link
│   │   │   ├── celebration.routes.ts  # CRUD celebracoes + requirements
│   │   │   ├── schedule.routes.ts     # Generate, detail, publish, assignments, audit
│   │   │   ├── public.routes.ts       # GET schedule by token (no auth)
│   │   │   └── admin.routes.ts        # User mgmt, functions, audit log, stats
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Register, login, logout, verify logic
│   │   │   ├── user.service.ts        # User CRUD operations
│   │   │   ├── celebration.service.ts # Celebration + requirements logic
│   │   │   ├── schedule.service.ts    # Schedule generation orchestration, publish
│   │   │   └── audit.service.ts       # Audit log writing and querying
│   │   ├── scheduling/                # TypeScript puro, ZERO I/O
│   │   │   ├── generator.ts           # Loop principal do algoritmo de geracao
│   │   │   ├── scoring.ts             # 3 funcoes: countScore, rotationScore, intervalScore + combine
│   │   │   ├── conflicts.ts           # Deteccao e classificacao dos 5 tipos de conflito
│   │   │   ├── state.ts               # Estado mutavel durante geracao (contadores, ultimas datas)
│   │   │   └── types.ts               # Interfaces do algoritmo (input, output, candidate, conflict)
│   │   ├── validators/                # Schemas Zod para validacao de input
│   │   │   ├── auth.schema.ts
│   │   │   ├── celebration.schema.ts
│   │   │   ├── schedule.schema.ts
│   │   │   └── availability.schema.ts
│   │   ├── middleware/
│   │   │   ├── auth.guard.ts          # Verifica JWT valido + nao esta na blacklist Redis
│   │   │   └── role.guard.ts          # Verifica se papel do usuario esta na lista permitida
│   │   ├── lib/
│   │   │   ├── db.ts                  # Singleton do Prisma client
│   │   │   ├── redis.ts              # Cliente Redis (ioredis, named import)
│   │   │   └── tokens.ts             # nanoid para geracao de tokens publicos
│   │   └── types/
│   │       └── index.ts               # Tipos compartilhados (enums, interfaces de resposta)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # Ponto de entrada React
│   │   ├── App.tsx                    # Router + AuthProvider + ThemeProvider
│   │   ├── pages/                     # 1 arquivo por rota (23 telas)
│   │   │   ├── login.tsx
│   │   │   ├── cadastro.tsx
│   │   │   ├── painel.tsx             # Dashboard por papel
│   │   │   ├── escalas.tsx
│   │   │   ├── escala-detalhe.tsx
│   │   │   ├── escala-nova.tsx        # Wizard 3 passos
│   │   │   ├── celebracoes.tsx
│   │   │   ├── celebracao-form.tsx    # Criar/editar
│   │   │   ├── acolitos.tsx
│   │   │   ├── acolito-detalhe.tsx
│   │   │   ├── disponibilidade.tsx    # Calendario de disponibilidade
│   │   │   ├── minhas-funcoes.tsx
│   │   │   ├── meu-historico.tsx
│   │   │   ├── responsaveis.tsx
│   │   │   ├── coordenacao.tsx
│   │   │   ├── admin.tsx
│   │   │   ├── admin-usuarios.tsx
│   │   │   ├── admin-funcoes.tsx
│   │   │   ├── admin-auditoria.tsx
│   │   │   └── escala-publica.tsx     # /p/:token
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components (owned code)
│   │   │   ├── layout/               # Sidebar, Topbar, PageHeader, PageContainer
│   │   │   ├── schedule/             # ScheduleGrid, AssignmentBadge, ConflictIndicator
│   │   │   ├── celebration/          # CelebrationForm, CelebrationCard
│   │   │   ├── acolyte/              # AvailabilityCalendar, AcolyteCard
│   │   │   ├── auth/                 # LoginForm, RegisterForm
│   │   │   └── shared/               # DataTable, EmptyState, LoadingSkeleton, ConfirmDialog
│   │   ├── hooks/
│   │   │   ├── use-auth.ts           # Auth context + JWT management
│   │   │   ├── use-api.ts            # Fetch wrapper with auth headers + error handling
│   │   │   └── use-confirm.ts        # Confirmation dialog hook
│   │   ├── lib/
│   │   │   ├── api.ts                # Typed API client (base URL, interceptors)
│   │   │   ├── auth.tsx              # AuthProvider + ProtectedRoute component
│   │   │   └── cn.ts                 # clsx + tailwind-merge utility
│   │   └── types/
│   │       └── index.ts              # Shared types (mirroring backend)
│   ├── index.html
│   ├── vite.config.ts                 # Proxy /api -> localhost:3000
│   ├── tailwind.config.ts            # Tema eclesiastico
│   ├── components.json               # Configuracao shadcn/ui
│   └── package.json
│
├── worker/
│   ├── tasks.py                       # Celery tasks (schedule generation)
│   ├── scheduling.py                  # Port do algoritmo ou chamada HTTP ao backend
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
├── Dockerfile                         # Multi-stage: frontend -> backend -> production
├── .env
├── .env.example
└── CLAUDE.md
```

---

## Raiz do Projeto

| Arquivo | Proposito |
|---------|-----------|
| `docker-compose.yml` | Orquestra os 4 servicos (app, db, redis, worker) com healthchecks, volumes e rede bridge. Ponto de entrada para subir todo o ambiente. |
| `Dockerfile` | Build multi-stage: primeiro compila o frontend (Vite), depois compila o backend (TypeScript), por fim copia tudo para uma imagem de producao enxuta. |
| `.env` | Variaveis de ambiente locais (credenciais do PostgreSQL, URLs de conexao). Nunca commitado. |
| `.env.example` | Template do `.env` com valores de exemplo. Commitado para que novos desenvolvedores saibam quais variaveis configurar. |
| `CLAUDE.md` | Instrucoes de contexto para assistentes de IA. Descreve a arquitetura, comandos e decisoes tecnicas relevantes para quem for trabalhar no codigo. |

**Por que na raiz?** Esses arquivos sao transversais a todos os servicos. O `docker-compose.yml` referencia tanto o `Dockerfile` da raiz (servico app) quanto o `worker/Dockerfile` (servico worker). O `.env` e injetado em todos os containers.

---

## docs/

```
docs/
├── 00-plano-mestre.md          # Indice e roadmap de toda a documentacao
├── 01-visao-geral.md           # Proposito, publico-alvo, premissas
├── 02-escopo-funcional.md      # Features por modulo, criterios de aceite
├── 03-perfis-permissoes.md     # 4 papeis, matriz RBAC, regras de escopo
├── 04-regras-negocio.md        # Regras rigidas e flexiveis do dominio
├── 05-fluxos-usuario.md        # Jornadas passo-a-passo por papel
├── 06-arquitetura.md           # Diagrama de servicos, fluxos de requisicao
├── 07-modelagem-dados.md       # Schema Prisma, relacionamentos, indices
├── 08-api-endpoints.md         # Contrato de cada endpoint REST
├── 09-algoritmo-escalas.md     # Logica de geracao, scoring, conflitos
├── 10-telas-navegacao.md       # Wireframes textuais, mapa de navegacao
├── 11-componentes-ui.md        # Catalogo de componentes React
├── 12-autenticacao-seguranca.md # JWT, RBAC, blacklist, CORS
├── 13-estrategia-testes.md     # Piramide de testes, o que testar
├── 14-infraestrutura.md        # Docker, volumes, healthchecks, deploy
├── 15-seed-dados-iniciais.md   # 9 funcoes liturgicas, dados de teste
├── 16-glossario.md             # Termos do dominio liturgico e tecnico
├── 17-decisoes-tecnicas.md     # ADRs (Architecture Decision Records)
├── 18-estrutura-pastas.md      # Este documento
├── 19-checklist-validacao.md   # Checklist para validar antes de implementar
└── 20-plano-half-loops.md      # Plano de execucao em half-loops
```

### Convencoes da pasta docs/

- **Prefixo numerico** (`00-` a `20-`): garante ordenacao logica no explorador de arquivos. Documentos sao lidos na sequencia, do mais geral ao mais especifico.
- **Nomes em portugues, sem acentos, kebab-case**: evita problemas de encoding em diferentes sistemas operacionais e terminais.
- **Um documento por assunto**: facilita referencia cruzada (ex: "ver `07-modelagem-dados.md`") e permite que cada documento seja validado independentemente.

**Por que uma pasta separada?** Documentacao nao e codigo. Separar em `docs/` evita poluir a raiz e deixa claro que esses arquivos nao sao processados pelo build.

---

## backend/

O backend e uma API REST construida com Fastify 5 e TypeScript. A organizacao segue o padrao **routes → services → domain**, onde cada camada tem responsabilidade bem definida.

### backend/prisma/

```
prisma/
├── schema.prisma       # Definicao de todas as tabelas, enums e relacionamentos
├── migrations/         # Migracoes SQL geradas automaticamente pelo Prisma
└── seed.ts             # Script de seed (9 funcoes liturgicas iniciais)
```

**Por que na raiz do backend?** E a convencao padrao do Prisma. O CLI do Prisma espera encontrar `prisma/schema.prisma` na raiz do projeto Node.js. Mover para outro lugar exigiria configuracao extra sem beneficio.

**Por que seed.ts aqui e nao em src/?** O seed e executado via `prisma db seed`, que espera o arquivo na pasta `prisma/`. Alem disso, o seed e um script standalone que roda uma vez, nao faz parte do runtime da API.

### backend/src/server.ts

Ponto de entrada da aplicacao. Responsabilidades:
- Cria a instancia do Fastify
- Registra plugins (auth, prisma, cors)
- Registra rotas (cada modulo como plugin separado)
- Inicia o servidor na porta configurada

**Por que um unico arquivo de entrada?** O Fastify usa o padrao de plugins encadeados. O `server.ts` e apenas o orquestrador que conecta as pecas. Toda logica real vive nos plugins e rotas.

### backend/src/plugins/

```
plugins/
├── auth.ts         # Configura @fastify/jwt, decora request com user
├── prisma.ts       # Instancia PrismaClient e decora no Fastify
└── cors.ts         # Configura origens permitidas
```

**Por que plugins separados?** Cada plugin encapsula uma preocupacao transversal. O Fastify carrega plugins em ordem, respeitando dependencias. Separar em arquivos permite:
- Testar cada configuracao isoladamente
- Reutilizar entre diferentes instancias (ex: testes)
- Manter o `server.ts` limpo

### backend/src/routes/

```
routes/
├── auth.routes.ts          # Autenticacao (register, login, logout, me)
├── user.routes.ts          # Gestao de usuarios
├── server.routes.ts        # Acolitos (disponibilidade, funcoes, historico)
├── guardian.routes.ts      # Responsaveis (listagem, vinculacao)
├── celebration.routes.ts   # Celebracoes (CRUD + requisitos)
├── schedule.routes.ts      # Escalas (gerar, detalhar, publicar, atribuicoes)
├── public.routes.ts        # Acesso publico por token (sem autenticacao)
└── admin.routes.ts         # Administracao (usuarios, funcoes, auditoria, stats)
```

**Convencao de nome**: `<dominio>.routes.ts`. O sufixo `.routes` deixa explicito que o arquivo define endpoints HTTP e nao contem logica de negocio.

**Por que um arquivo por dominio?** Cada arquivo de rotas e registrado como um plugin Fastify com seu proprio prefixo. Isso permite:
- Aplicar middleware por grupo (ex: `auth.guard` em todas as rotas exceto `public`)
- Encontrar rapidamente onde um endpoint esta definido
- Evitar arquivos com centenas de linhas

**Por que `server.routes.ts` e nao `acolyte.routes.ts`?** O nome `server` se refere ao conceito de "servidor" no contexto liturgico — quem serve na celebracao. E o termo usado no dominio.

### backend/src/services/

```
services/
├── auth.service.ts         # Logica de cadastro, login, validacao de token
├── user.service.ts         # CRUD de usuarios com regras de negocio
├── celebration.service.ts  # Logica de celebracoes e requisitos de funcao
├── schedule.service.ts     # Orquestracao da geracao de escalas, publicacao
└── audit.service.ts        # Gravacao e consulta do log de auditoria
```

**Convencao de nome**: `<dominio>.service.ts`. Services contem a logica de negocio que as rotas delegam.

**Por que separar de routes?** Rotas cuidam de HTTP (parse de body, status codes, headers). Services cuidam de negocio (validar regras, orquestrar operacoes, interagir com banco). Essa separacao permite:
- Testar logica de negocio sem subir um servidor HTTP
- Reutilizar services entre rotas (ex: `audit.service` usado por varias rotas)
- Trocar o framework HTTP sem reescrever a logica

### backend/src/scheduling/

```
scheduling/
├── generator.ts    # Loop principal: itera celebracoes, atribui candidatos
├── scoring.ts      # Funcoes de pontuacao: countScore, rotationScore, intervalScore
├── conflicts.ts    # Detecta os 5 tipos de conflito possivel
├── state.ts        # Estado mutavel durante uma geracao (contadores, datas)
└── types.ts        # Interfaces puras: input, output, candidate, conflict
```

**Esta e a pasta mais importante do projeto.** Contem o algoritmo de geracao de escalas em TypeScript puro, sem nenhuma dependencia de I/O (sem banco, sem Redis, sem HTTP).

**Por que isolado?** O algoritmo e o coracao do dominio. Isolar em uma pasta sem dependencias externas garante:
- **Testabilidade**: testes unitarios rodam em milissegundos, sem mocks de banco
- **Portabilidade**: o mesmo algoritmo pode ser chamado pelo Celery worker (via HTTP ou port direto)
- **Legibilidade**: cada aspecto do algoritmo tem seu arquivo (geracao, pontuacao, conflitos, estado)

**Por que nao em services/?** Services orquestram: buscam dados no banco, chamam o algoritmo, salvam resultados. O algoritmo em si e funcao pura: recebe dados, retorna escala. Essa distincao e fundamental.

### backend/src/validators/

```
validators/
├── auth.schema.ts          # Schemas para register, login
├── celebration.schema.ts   # Schemas para criar/editar celebracao
├── schedule.schema.ts      # Schemas para gerar/editar escala
└── availability.schema.ts  # Schemas para marcar indisponibilidade
```

**Convencao de nome**: `<dominio>.schema.ts`. Usam Zod para definir a forma esperada dos dados de entrada.

**Por que separar de routes?** Schemas de validacao sao declarativos e tendem a crescer. Misturar com a logica das rotas tornaria os arquivos longos e dificeis de ler. Separar permite:
- Reutilizar schemas (ex: o mesmo schema de celebracao no frontend)
- Ver todas as validacoes do dominio em um so lugar
- Gerar tipos TypeScript automaticamente a partir dos schemas

### backend/src/middleware/

```
middleware/
├── auth.guard.ts    # Verifica JWT valido + ausente da blacklist Redis
└── role.guard.ts    # Verifica se o papel do usuario esta na lista permitida
```

**Por que apenas dois arquivos?** O sistema tem exatamente duas preocupacoes de middleware:
1. **Autenticacao**: o usuario e quem diz ser?
2. **Autorizacao**: o usuario pode fazer o que quer fazer?

Cada guard e um hook `onRequest` do Fastify, aplicado declarativamente nas rotas.

### backend/src/lib/

```
lib/
├── db.ts        # Singleton do PrismaClient (evita multiplas conexoes)
├── redis.ts     # Cliente Redis via ioredis (named import: { Redis })
└── tokens.ts    # Geracao de tokens publicos via nanoid
```

**Por que lib/?** Sao utilitarios de infraestrutura que nao pertencem a nenhum dominio especifico. Qualquer parte do backend pode importar de `lib/`. A convencao e: se nao e rota, service, validator ou middleware, e lib.

**Nota tecnica**: o Redis usa named import (`{ Redis }` de ioredis), nao default import. Essa decisao esta documentada para evitar erro recorrente.

### backend/src/types/

```
types/
└── index.ts    # Enums, interfaces de resposta, tipos compartilhados
```

**Por que um unico arquivo?** Para o v1.0, os tipos compartilhados sao poucos (enums de papel, status de escala, formato de resposta da API). Um arquivo unico e suficiente. Se crescer, pode ser dividido em `types/user.ts`, `types/schedule.ts`, etc.

---

## frontend/

O frontend e uma SPA (Single Page Application) com React 19, Vite 6, Tailwind CSS e shadcn/ui. A organizacao segue o padrao **pages + components + hooks + lib**.

### frontend/src/pages/

```
pages/
├── login.tsx               # Tela de login
├── cadastro.tsx            # Tela de cadastro
├── painel.tsx              # Dashboard adaptativo por papel
├── escalas.tsx             # Lista de escalas
├── escala-detalhe.tsx      # Visualizacao detalhada de uma escala
├── escala-nova.tsx         # Wizard de 3 passos para gerar escala
├── celebracoes.tsx         # Lista de celebracoes
├── celebracao-form.tsx     # Formulario de criar/editar celebracao
├── acolitos.tsx            # Lista de acolitos
├── acolito-detalhe.tsx     # Perfil detalhado do acolito
├── disponibilidade.tsx     # Calendario de disponibilidade
├── minhas-funcoes.tsx      # Funcoes liturgicas do acolito
├── meu-historico.tsx       # Historico de servicos do acolito
├── responsaveis.tsx        # Lista de responsaveis
├── coordenacao.tsx         # Painel da coordenadora
├── admin.tsx               # Painel administrativo
├── admin-usuarios.tsx      # Gestao de usuarios (admin)
├── admin-funcoes.tsx       # Gestao de funcoes liturgicas (admin)
├── admin-auditoria.tsx     # Log de auditoria (admin)
└── escala-publica.tsx      # Visualizacao publica via /p/:token
```

**Convencao de nome**: kebab-case em portugues, sem acentos. Exemplos: `escala-detalhe.tsx`, `admin-usuarios.tsx`.

**Por que kebab-case e nao PascalCase?** Pages correspondem diretamente a URLs. Usar kebab-case (o mesmo padrao das rotas) cria uma correspondencia imediata:
- Arquivo `escala-detalhe.tsx` → rota `/escalas/:id`
- Arquivo `admin-usuarios.tsx` → rota `/admin/usuarios`

**Por que portugues?** As telas sao conceitos do dominio liturgico brasileiro. Nomes como `schedule-detail.tsx` exigiriam traducao mental constante. Como o dominio e inerentemente em portugues, os nomes dos arquivos refletem isso.

**Por que um arquivo por pagina?** Cada pagina e uma unidade independente que compoe componentes. Ter 23 arquivos pequenos e mais navegavel do que 5 arquivos grandes.

### frontend/src/components/

```
components/
├── ui/              # Componentes shadcn/ui (Button, Input, Card, Dialog, etc.)
├── layout/          # Sidebar, Topbar, PageHeader, PageContainer
├── schedule/        # ScheduleGrid, AssignmentBadge, ConflictIndicator
├── celebration/     # CelebrationForm, CelebrationCard
├── acolyte/         # AvailabilityCalendar, AcolyteCard
├── auth/            # LoginForm, RegisterForm
└── shared/          # DataTable, EmptyState, LoadingSkeleton, ConfirmDialog
```

**Convencao**: diretorios em kebab-case, arquivos de componente em PascalCase (ex: `components/schedule/ScheduleGrid.tsx`).

**Por que agrupar por dominio e nao por tipo?** Agrupar por tipo (todos os forms juntos, todos os cards juntos) obriga a abrir pastas diferentes para trabalhar em uma feature. Agrupar por dominio mantem todos os componentes de "escala" na mesma pasta. Quando voce trabalha na feature de escalas, tudo que precisa esta em `components/schedule/`.

**Excecao: `ui/` e `shared/`**. Componentes genericos que nao pertencem a nenhum dominio ficam em `shared/`. Componentes do shadcn/ui ficam em `ui/` porque sao gerados pelo CLI e nao devem ser misturados com codigo do projeto.

**Excecao: `layout/`**. Componentes de layout sao transversais — usados em todas as paginas. Merecem pasta propria porque formam a "casca" da aplicacao.

### frontend/src/hooks/

```
hooks/
├── use-auth.ts       # Context de autenticacao + gestao de JWT
├── use-api.ts        # Wrapper de fetch com headers de auth e tratamento de erros
└── use-confirm.ts    # Hook para dialogo de confirmacao
```

**Convencao de nome**: `use-<nome>.ts`, seguindo a convencao do React para hooks customizados (prefixo `use`), com kebab-case no arquivo.

**Por que poucos hooks?** Hooks customizados so fazem sentido quando encapsulam logica reutilizavel. Criar um hook para cada operacao trivial adiciona indirection sem beneficio. Tres hooks cobrem as necessidades transversais: autenticacao, comunicacao com API e confirmacao de acoes destrutivas.

### frontend/src/lib/

```
lib/
├── api.ts       # Cliente API tipado (base URL, interceptors de erro)
├── auth.tsx     # AuthProvider + componente ProtectedRoute
└── cn.ts        # Utilitario clsx + tailwind-merge
```

**Por que lib/ e nao utils/?** Convencao do shadcn/ui e do ecossistema Next.js/Vite moderno. `lib/` contem codigo de infraestrutura que nao e componente, hook nem pagina.

**Por que auth.tsx em lib/ e nao em components/?** O `AuthProvider` e um provider de contexto que envolve toda a aplicacao. Nao e um componente visual — e infraestrutura de autenticacao. O `ProtectedRoute` e um wrapper de roteamento. Ambos vivem em `lib/` porque sao mecanismos, nao interface.

### frontend/src/types/

```
types/
└── index.ts    # Tipos espelhando o backend (User, Schedule, etc.)
```

**Por que espelhar?** O frontend precisa dos mesmos tipos que o backend para tipar as respostas da API. Manter uma copia explicita (em vez de importar do backend) evita acoplamento de build entre os dois projetos. No futuro, se o backend gerar tipos automaticamente (ex: via OpenAPI), essa pasta sera o ponto de integracao.

### Arquivos de configuracao do frontend

| Arquivo | Proposito |
|---------|-----------|
| `index.html` | Template HTML do Vite. Contem a div `#root` e o script de entrada. |
| `vite.config.ts` | Configura o Vite: proxy de `/api` para `localhost:3000` em desenvolvimento, plugins do React. |
| `tailwind.config.ts` | Tema eclesiastico: paleta de cores (dourado, vinho, bege), tipografia serif para titulos. |
| `components.json` | Configuracao do shadcn/ui: paths de importacao, estilo dos componentes. |
| `package.json` | Dependencias do frontend (React 19, Vite 6, Tailwind, shadcn/ui). |

---

## worker/

```
worker/
├── tasks.py          # Definicao das tasks Celery (geracao de escala)
├── scheduling.py     # Port do algoritmo ou chamada HTTP ao backend
├── Dockerfile        # Imagem Python 3.12 com Celery
└── requirements.txt  # celery[redis]==5.4.0, psycopg2-binary
```

**Por que Python e nao TypeScript?** O Celery e a solucao mais madura para filas de tarefas, e ele e nativo em Python. Alternativas em Node.js (BullMQ) exigiriam mais configuracao para o mesmo resultado. Como o worker executa poucas tarefas (principalmente geracao de escalas), a complexidade de manter dois runtimes e baixa.

**Por que `scheduling.py`?** O algoritmo de geracao vive no backend em TypeScript. O worker tem duas opcoes para invoca-lo:
1. **Port**: reimplementar a logica em Python (duplicacao)
2. **HTTP**: chamar o endpoint do backend que executa o algoritmo

A decisao entre as duas estrategias sera tomada durante a implementacao, mas o arquivo ja existe como ponto de integracao.

**Por que Dockerfile proprio?** O worker usa Python, enquanto o app principal usa Node.js. Sao imagens base diferentes que nao podem compartilhar o mesmo Dockerfile.

---

## Convencoes de Nomenclatura — Resumo

| Contexto | Convencao | Exemplo |
|----------|-----------|---------|
| Arquivos do backend | camelCase com sufixo de tipo | `auth.routes.ts`, `user.service.ts` |
| Paginas do frontend | kebab-case em portugues | `escala-detalhe.tsx`, `admin-usuarios.tsx` |
| Componentes React (diretorios) | kebab-case | `components/schedule/` |
| Componentes React (arquivos) | PascalCase | `ScheduleGrid.tsx`, `AcolyteCard.tsx` |
| Hooks React | `use-` + kebab-case | `use-auth.ts`, `use-api.ts` |
| Types/Interfaces | PascalCase | `User`, `Schedule`, `CelebrationInput` |
| Variaveis e funcoes | camelCase | `countScore`, `getUserById` |
| Colunas no banco (Prisma) | snake_case via `@map` | `created_at`, `is_active`, `liturgical_function_id` |
| Endpoints da API | kebab-case ou lowercase | `/api/auth/register`, `/api/schedules/:id/publish` |
| Rotas do frontend | portugues, sem acentos, lowercase | `/escalas`, `/celebracoes`, `/admin/usuarios` |
| Documentacao | prefixo numerico + kebab-case | `07-modelagem-dados.md` |

### Justificativa para cada convencao

**Backend em ingles, frontend pages em portugues**: o backend e tecnico (HTTP, CRUD, JWT) — termos universais em ingles. As paginas representam conceitos do dominio liturgico brasileiro que perdem sentido traduzidos. A mistura e intencional: codigo tecnico em ingles, dominio em portugues.

**PascalCase para componentes**: convencao universal do React. JSX exige que componentes customizados comecem com maiuscula (`<ScheduleGrid />` vs `<div />`). O nome do arquivo espelha o export.

**kebab-case para diretorios de componentes**: evita problemas de case-sensitivity entre sistemas operacionais (macOS e case-insensitive por padrao, Linux nao). kebab-case e universalmente seguro.

**snake_case no banco com @map do Prisma**: PostgreSQL convenciona snake_case. O Prisma permite usar camelCase no codigo TypeScript e mapear para snake_case no banco via `@map`, respeitando as convencoes de ambos os mundos.

**Prefixo numerico nos docs**: documentos sao escritos e lidos em sequencia. Sem prefixo, o explorador de arquivos ordena alfabeticamente, quebrando a logica de leitura (ex: `algoritmo-escalas.md` viria antes de `visao-geral.md`).

---

## Principios Organizacionais

### 1. Separacao por responsabilidade, nao por tipo de arquivo

Errado: agrupar todos os `.ts` de validacao em uma pasta, todos os `.ts` de servico em outra, independente do dominio.

Certo: cada dominio (auth, schedule, celebration) tem seus arquivos de rota, servico e validacao agrupados por convencao de sufixo. Quando voce trabalha no modulo de escalas, sabe que precisa de `schedule.routes.ts`, `schedule.service.ts` e `schedule.schema.ts`.

### 2. Backend com camadas explicitas

```
Request → Route → Service → Domain (scheduling/) → Database
                     ↓
                  Validator (Zod)
```

Cada camada tem sua pasta. Nenhum arquivo de rota importa diretamente o Prisma. Nenhum arquivo de scheduling importa ioredis. As dependencias fluem em uma direcao.

### 3. Frontend com colocation por feature

Componentes de uma feature vivem juntos. O `ScheduleGrid` nao fica em `components/grids/` — fica em `components/schedule/`. Quando a feature de escalas muda, voce sabe exatamente quais pastas serao afetadas.

### 4. Algoritmo isolado do framework

A pasta `scheduling/` nao depende de Fastify, Prisma, Redis ou qualquer I/O. Recebe dados puros, retorna dados puros. Isso garante que o coracao do sistema possa ser testado, depurado e evoluido sem levantar infraestrutura.

### 5. Configuracao na raiz, codigo em src/

Tanto no backend quanto no frontend, arquivos de configuracao (`package.json`, `tsconfig.json`, `vite.config.ts`) ficam na raiz do servico. Codigo executavel fica em `src/`. Essa separacao e convencao padrao do ecossistema Node.js/TypeScript.

---

## Referencia Cruzada

- Modelagem de dados detalhada: `07-modelagem-dados.md`
- Contrato de cada endpoint: `08-api-endpoints.md`
- Logica do algoritmo de escalas: `09-algoritmo-escalas.md`
- Catalogo de componentes UI: `11-componentes-ui.md`
- Decisoes tecnicas (ADRs): `17-decisoes-tecnicas.md`
- Plano de execucao por half-loops: `20-plano-half-loops.md`
