# Plano de Implementacao por Etapas

O desenvolvimento do Liturgix segue o modelo de **half-loops**: ciclos curtos com objetivo claro, entregaveis verificaveis e criterios de teste definidos. Cada half-loop produz codigo funcional e testado que se integra ao que ja existe.

O plano esta dividido em **6 fases sequenciais** com **19 half-loops** no total.

---

## Indice de Fases

| Fase | Nome | Half-loops | Descricao |
|------|------|------------|-----------|
| 1 | Fundacao | 1-3 | Banco de dados, autenticacao, layout base |
| 2 | Dominio Central | 4-7 | CRUDs de funcoes, acolitos, disponibilidade, celebracoes |
| 3 | Motor de Escala | 8-11 | Algoritmo, integracao, UI de geracao, conflitos |
| 4 | Distribuicao | 12-14 | Publicacao, pagina publica, visualizacoes |
| 5 | Responsaveis e Administracao | 15-17 | Vinculos, painel admin, auditoria |
| 6 | Polimento | 18-19 | Mobile, acessibilidade, testes E2E |

---

## Convencoes

- **Dependencias**: cada half-loop lista quais half-loops anteriores devem estar completos antes de iniciar.
- **Arquivos**: caminhos relativos a raiz do projeto (`/home/rian/Projects/Liturgix/`).
- **Teste**: cada half-loop termina com criterios de teste que devem passar para considerar o half-loop completo.
- **CLAUDE.md**: atualizado ao final de cada half-loop com as mudancas relevantes.

---

## Fase 1 — Fundacao

Estabelece a infraestrutura de dados, autenticacao e interface base sobre a qual todo o restante sera construido.

---

### Half-loop 1: Setup do Prisma + Schema + Migracao + Dados Iniciais

**Objetivo**: Configurar o ORM Prisma com o schema completo do banco de dados, executar a migracao inicial e popular as 9 funcoes liturgicas.

**Dependencias**: Nenhuma (primeiro half-loop).

**Entregaveis**:
1. Prisma instalado e configurado no backend
2. Schema completo com todas as entidades (conforme `docs/07-modelagem-dados.md`)
3. Migracao inicial executada com sucesso no PostgreSQL
4. Script de seed com as 9 funcoes liturgicas
5. Plugin Fastify para o Prisma client (singleton)

**Arquivos criados**:
- `backend/prisma/schema.prisma` — schema completo (User, GuardianLink, LiturgicalFunction, UserFunction, Unavailability, Celebration, CelebrationFunctionRequirement, Schedule, ScheduleAssignment, ServiceRecord, ScheduleAuditLog)
- `backend/prisma/seed.ts` — dados iniciais das 9 funcoes liturgicas (Cruciferario, Ceroferario 1, Ceroferario 2, Turiferario, Naveteiro, Librario, Ceremaneiro, Acolito de Credencia, Acolito de Microfone)
- `backend/prisma/migrations/` — migracao inicial gerada
- `backend/src/plugins/prisma.ts` — plugin Fastify que registra o Prisma client como decorador
- `backend/src/lib/db.ts` — singleton do Prisma client

**Arquivos modificados**:
- `backend/package.json` — adicionar `prisma` e `@prisma/client`
- `backend/tsconfig.json` — ajustar se necessario para resolucao de modulos
- `backend/src/server.ts` — registrar o plugin do Prisma
- `docker-compose.yml` — verificar que `DATABASE_URL` esta acessivel ao container `app`
- `CLAUDE.md` — documentar setup do Prisma

**Criterios de teste**:
- [ ] `npx prisma migrate dev` executa sem erros
- [ ] `npx prisma db seed` popula a tabela `liturgical_functions` com 9 registros
- [ ] `npx prisma studio` abre e mostra todas as tabelas vazias (exceto funcoes)
- [ ] O servidor Fastify inicia sem erros com o plugin do Prisma registrado
- [ ] `GET /api/health` retorna status do banco via Prisma (substituindo query SQL direta)

---

### Half-loop 2: Autenticacao

**Objetivo**: Implementar o sistema completo de autenticacao com JWT, incluindo registro, login, logout com blacklist no Redis, e middlewares de protecao por papel.

**Dependencias**: Half-loop 1 (Prisma configurado e tabela User disponivel).

**Entregaveis**:
1. Plugin `@fastify/jwt` configurado
2. Rotas de autenticacao: register, login, logout, me
3. Middleware de autenticacao (verifica JWT + blacklist Redis)
4. Middleware de autorizacao por papel (role guard)
5. Validacao de entrada com Zod em todas as rotas

**Arquivos criados**:
- `backend/src/plugins/auth.ts` — plugin Fastify para `@fastify/jwt` (configura secret, decoradores `authenticate` e `authorize`)
- `backend/src/routes/auth.routes.ts` — 4 endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `backend/src/services/auth.service.ts` — logica de negocio: hash de senha, verificacao, geracao de token, blacklist
- `backend/src/middleware/auth.guard.ts` — preHandler que verifica JWT e consulta blacklist no Redis
- `backend/src/middleware/role.guard.ts` — preHandler factory que aceita lista de papeis permitidos
- `backend/src/validators/auth.schema.ts` — schemas Zod: `registerSchema`, `loginSchema`

**Arquivos modificados**:
- `backend/package.json` — adicionar `@fastify/jwt`, `bcrypt`, `@types/bcrypt`, `zod`
- `backend/src/server.ts` — registrar plugin de auth e rotas de autenticacao
- `backend/src/lib/redis.ts` — adicionar funcoes `blacklistToken` e `isTokenBlacklisted`
- `.env` — adicionar `JWT_SECRET`
- `.env.example` — documentar `JWT_SECRET`
- `CLAUDE.md` — documentar fluxo de autenticacao

**Criterios de teste**:
- [ ] `POST /api/auth/register` cria usuario com senha hasheada no banco
- [ ] `POST /api/auth/register` rejeita email duplicado (409)
- [ ] `POST /api/auth/register` rejeita payload invalido (400) via Zod
- [ ] `POST /api/auth/register` permite apenas papeis ACOLYTE e GUARDIAN
- [ ] `POST /api/auth/login` retorna JWT valido para credenciais corretas
- [ ] `POST /api/auth/login` retorna 401 para credenciais invalidas
- [ ] `GET /api/auth/me` retorna perfil do usuario autenticado
- [ ] `GET /api/auth/me` retorna 401 sem token
- [ ] `POST /api/auth/logout` adiciona token a blacklist no Redis
- [ ] Apos logout, o mesmo token e rejeitado pelo auth guard
- [ ] Role guard bloqueia acesso quando papel nao esta na lista permitida
- [ ] Fluxo completo: register → login → acesso protegido → logout → token invalidado

---

### Half-loop 3: Layout Base

**Objetivo**: Configurar o frontend com Tailwind CSS, shadcn/ui adaptado para Vite, tema eclesiastico, layout com sidebar/topbar, e roteamento protegido por papel.

**Dependencias**: Half-loop 2 (API de autenticacao disponivel para login/logout).

**Entregaveis**:
1. Tailwind CSS configurado com tema eclesiastico (cores, fontes, espacamentos)
2. shadcn/ui inicializado e adaptado para Vite (sem Next.js)
3. Layout principal com sidebar (navegacao por papel) e topbar
4. Sistema de roteamento com React Router e protecao por papel
5. Paginas de login e cadastro funcionais
6. AuthProvider com gerenciamento de JWT no frontend

**Arquivos criados**:
- `frontend/tailwind.config.ts` — tema eclesiastico completo (bordô, dourado, pergaminho, Crimson Pro, Inter)
- `frontend/components.json` — configuracao do shadcn/ui para Vite
- `frontend/src/lib/cn.ts` — utilitario de classname (`clsx` + `tailwind-merge`)
- `frontend/src/lib/api.ts` — cliente de API tipado com headers de autenticacao
- `frontend/src/lib/auth.tsx` — AuthProvider (contexto React), hook `useAuth`, componente `ProtectedRoute`
- `frontend/src/hooks/use-auth.ts` — hook de conveniencia para acessar o contexto de auth
- `frontend/src/hooks/use-api.ts` — hook wrapper de fetch com token automatico
- `frontend/src/components/ui/` — componentes base do shadcn/ui: Button, Card, Input, Label, Dialog, Toast
- `frontend/src/components/layout/sidebar.tsx` — sidebar com navegacao por papel (ACOLYTE ve itens diferentes de COORDINATOR e ADMIN)
- `frontend/src/components/layout/topbar.tsx` — barra superior com nome do usuario e logout
- `frontend/src/components/layout/page-container.tsx` — container padrao para paginas
- `frontend/src/components/layout/app-layout.tsx` — layout que combina sidebar + topbar + container
- `frontend/src/pages/login.tsx` — pagina de login
- `frontend/src/pages/cadastro.tsx` — pagina de cadastro
- `frontend/src/pages/painel.tsx` — dashboard inicial (placeholder por papel)

**Arquivos modificados**:
- `frontend/package.json` — adicionar `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`
- `frontend/src/main.tsx` — envolver app com `BrowserRouter` e `AuthProvider`
- `frontend/src/App.tsx` — reescrever com rotas protegidas e layout
- `frontend/index.html` — adicionar fontes Crimson Pro e Inter (Google Fonts)
- `frontend/vite.config.ts` — ajustar alias de importacao (`@/` → `src/`)
- `CLAUDE.md` — documentar configuracao do frontend

**Criterios de teste**:
- [ ] `npm run dev` no frontend inicia sem erros
- [ ] Pagina de login renderiza com tema eclesiastico (cores bordô, fonte Crimson Pro nos titulos)
- [ ] Login com credenciais validas redireciona para `/painel`
- [ ] Cadastro cria conta e redireciona para login
- [ ] Sidebar mostra itens corretos para papel ACOLYTE (Painel, Disponibilidade, Minhas Funcoes, Meu Historico)
- [ ] Sidebar mostra itens corretos para papel COORDINATOR (Painel, Acolitos, Celebracoes, Escalas, Coordenacao)
- [ ] Sidebar mostra itens corretos para papel ADMIN (todos + Admin)
- [ ] Acesso a rota protegida sem login redireciona para `/login`
- [ ] Acesso a rota de admin por ACOLYTE redireciona para `/painel`
- [ ] Logout limpa token e redireciona para `/login`
- [ ] Layout responsivo basico funciona (sidebar colapsa em mobile)

---

## Fase 2 — Dominio Central

Implementa os CRUDs essenciais do dominio: funcoes liturgicas, perfis de acolitos, disponibilidade e celebracoes.

---

### Half-loop 4: CRUD de Funcoes Liturgicas (Admin)

**Objetivo**: Implementar o gerenciamento de funcoes liturgicas pelo administrador, incluindo listagem, criacao, edicao e desativacao.

**Dependencias**: Half-loops 1, 2 e 3 (Prisma, autenticacao, layout base).

**Entregaveis**:
1. Endpoints de administracao de funcoes liturgicas
2. Pagina administrativa de funcoes no frontend
3. Protecao por papel ADMIN

**Arquivos criados**:
- `backend/src/routes/admin.routes.ts` — endpoints: `GET /api/admin/functions`, `POST /api/admin/functions`, `PATCH /api/admin/functions/:id`
- `backend/src/validators/function.schema.ts` — schemas Zod para criacao e edicao de funcao
- `frontend/src/pages/admin-funcoes.tsx` — pagina com tabela de funcoes, botao de criar, edicao inline ou dialog

**Arquivos modificados**:
- `backend/src/server.ts` — registrar rotas admin
- `frontend/src/App.tsx` — adicionar rota `/admin/funcoes`
- `CLAUDE.md` — documentar endpoints admin

**Criterios de teste**:
- [ ] `GET /api/admin/functions` retorna lista com as 9 funcoes do seed (incluindo inativas)
- [ ] `POST /api/admin/functions` cria nova funcao (ADMIN apenas)
- [ ] `POST /api/admin/functions` rejeita nome duplicado (409)
- [ ] `PATCH /api/admin/functions/:id` edita nome e descricao
- [ ] `PATCH /api/admin/functions/:id` desativa funcao (soft delete via campo `isActive`)
- [ ] Funcao desativada nao aparece em listagens publicas (apenas no admin)
- [ ] Pagina `/admin/funcoes` exibe tabela com todas as funcoes
- [ ] ACOLYTE e COORDINATOR nao conseguem acessar os endpoints (403)

---

### Half-loop 5: Perfil de Acolito + Qualificacoes

**Objetivo**: Implementar a listagem de acolitos, visualizacao de perfil e atribuicao de funcoes habilitadas (qualificacoes).

**Dependencias**: Half-loops 1-4 (especialmente 4, pois funcoes liturgicas devem existir).

**Entregaveis**:
1. Endpoints de listagem e detalhe de acolitos (servers)
2. Endpoints de funcoes habilitadas por acolito
3. Paginas de listagem, detalhe e "minhas funcoes" no frontend

**Arquivos criados**:
- `backend/src/routes/server.routes.ts` — endpoints: `GET /api/servers`, `GET /api/servers/:id`, `GET /api/servers/:id/functions`, `PUT /api/servers/:id/functions`
- `backend/src/services/user.service.ts` — logica de listagem, filtragem, atribuicao de funcoes
- `backend/src/validators/server.schema.ts` — schemas Zod para funcoes do acolito
- `frontend/src/pages/acolitos.tsx` — listagem de acolitos com busca e filtro
- `frontend/src/pages/acolito-detalhe.tsx` — perfil do acolito com funcoes, historico resumido
- `frontend/src/pages/minhas-funcoes.tsx` — visualizacao propria (ACOLYTE)
- `frontend/src/components/acolyte/card-acolito.tsx` — card reutilizavel para exibir acolito
- `frontend/src/components/acolyte/lista-funcoes.tsx` — componente de selecao/exibicao de funcoes

**Arquivos modificados**:
- `backend/src/server.ts` — registrar rotas de servers
- `frontend/src/App.tsx` — adicionar rotas `/acolitos`, `/acolito/:id`, `/minhas-funcoes`
- `CLAUDE.md` — documentar endpoints de acolitos

**Criterios de teste**:
- [ ] `GET /api/servers` retorna lista paginada de acolitos (COORDINATOR+)
- [ ] `GET /api/servers/:id` retorna detalhe com funcoes habilitadas
- [ ] `PUT /api/servers/:id/functions` atribui funcoes ao acolito (COORDINATOR+)
- [ ] ACOLYTE so acessa `/minhas-funcoes` (seus proprios dados)
- [ ] ACOLYTE nao consegue editar funcoes proprias (apenas visualizar)
- [ ] COORDINATOR ve lista completa de acolitos e pode atribuir funcoes
- [ ] Pagina `/acolitos` exibe lista com busca funcional
- [ ] Pagina `/acolito/:id` exibe perfil com funcoes atribuidas
- [ ] Pagina `/minhas-funcoes` exibe funcoes do acolito logado

---

### Half-loop 6: Calendario de Disponibilidade

**Objetivo**: Implementar o sistema de marcacao de indisponibilidade por periodo, com interface de calendario visual.

**Dependencias**: Half-loops 1-3 (Prisma, autenticacao, layout).

**Entregaveis**:
1. Endpoints de leitura e escrita de indisponibilidade por periodo
2. Componente de calendario interativo no frontend
3. Pagina de disponibilidade para o acolito

**Arquivos criados**:
- `backend/src/validators/availability.schema.ts` — schemas Zod para periodo e datas
- `frontend/src/pages/disponibilidade.tsx` — pagina com calendario mensal interativo
- `frontend/src/components/acolyte/calendario-disponibilidade.tsx` — componente de calendario que permite clicar em datas para marcar/desmarcar indisponibilidade

**Arquivos modificados**:
- `backend/src/routes/server.routes.ts` — adicionar endpoints: `GET /api/servers/:id/availability`, `PUT /api/servers/:id/availability`
- `frontend/src/App.tsx` — adicionar rota `/disponibilidade`
- `CLAUDE.md` — documentar fluxo de disponibilidade

**Criterios de teste**:
- [ ] `GET /api/servers/:id/availability?from=2026-04-01&to=2026-04-30` retorna datas marcadas como indisponiveis
- [ ] `PUT /api/servers/:id/availability` com corpo `{ period: { from, to }, dates: [...] }` substitui indisponibilidades no periodo
- [ ] ACOLYTE so pode editar a propria disponibilidade
- [ ] COORDINATOR pode visualizar disponibilidade de qualquer acolito
- [ ] Calendario exibe mes atual com datas indisponiveis destacadas
- [ ] Clicar em data alterna entre disponivel/indisponivel
- [ ] Salvar persiste corretamente (recarregar pagina mantem marcacoes)
- [ ] Navegacao entre meses funciona corretamente

---

### Half-loop 7: CRUD de Celebracoes + Requisitos

**Objetivo**: Implementar o gerenciamento de celebracoes (missas, adoracoes, etc.) e seus requisitos de funcoes liturgicas.

**Dependencias**: Half-loops 1-4 (Prisma, autenticacao, layout, funcoes liturgicas existem).

**Entregaveis**:
1. Endpoints completos de celebracoes (CRUD + requisitos)
2. Paginas de listagem, criacao e detalhe de celebracoes
3. Interface para definir quantas vagas de cada funcao uma celebracao precisa

**Arquivos criados**:
- `backend/src/routes/celebration.routes.ts` — endpoints: `GET /api/celebrations`, `POST /api/celebrations`, `GET /api/celebrations/:id`, `PATCH /api/celebrations/:id`, `DELETE /api/celebrations/:id`, `PUT /api/celebrations/:id/requirements`
- `backend/src/services/celebration.service.ts` — logica de negocio de celebracoes
- `backend/src/validators/celebration.schema.ts` — schemas Zod para celebracao e requisitos
- `frontend/src/pages/celebracoes.tsx` — listagem de celebracoes com filtros
- `frontend/src/pages/celebracao-form.tsx` — formulario de criacao/edicao (reutilizado para `/celebracao/nova` e `/celebracao/:id/editar`)
- `frontend/src/components/celebration/card-celebracao.tsx` — card reutilizavel
- `frontend/src/components/celebration/formulario-requisitos.tsx` — componente para definir funcoes e quantidades necessarias

**Arquivos modificados**:
- `backend/src/server.ts` — registrar rotas de celebracoes
- `frontend/src/App.tsx` — adicionar rotas `/celebracoes`, `/celebracao/nova`, `/celebracao/:id`
- `CLAUDE.md` — documentar endpoints de celebracoes

**Criterios de teste**:
- [ ] `POST /api/celebrations` cria celebracao com tipo (SUNDAY_MASS, WEEKDAY_MASS, HOLY_DAY, SPECIAL) e data/hora
- [ ] `GET /api/celebrations` retorna lista paginada com filtro por tipo e periodo
- [ ] `PUT /api/celebrations/:id/requirements` define funcoes necessarias (ex: Cruciferario x1, Ceroferario x2)
- [ ] `DELETE /api/celebrations/:id` faz exclusao logica
- [ ] COORDINATOR pode criar, editar e excluir celebracoes
- [ ] ACOLYTE pode visualizar celebracoes mas nao editar
- [ ] Formulario de criacao permite selecionar tipo, data, hora, local
- [ ] Interface de requisitos mostra funcoes disponiveis com campo de quantidade
- [ ] Validacao impede criar celebracao no passado
- [ ] Celebracao com escala publicada nao pode ser excluida

---

## Fase 3 — Motor de Escala

Implementa o algoritmo de geracao automatica de escalas, sua integracao com a API e o worker Celery, a interface de geracao e a resolucao de conflitos.

---

### Half-loop 8: Algoritmo de Geracao (TypeScript Puro, Zero I/O)

**Objetivo**: Implementar o algoritmo de geracao de escalas como modulo TypeScript puro, sem dependencias de I/O, totalmente testavel com dados mock.

**Dependencias**: Nenhuma tecnica (modulo isolado), mas o design depende de `docs/08-algoritmo-escala.md`.

**Entregaveis**:
1. Funcoes de pontuacao (contagem, rotacao, intervalo)
2. Loop principal de geracao
3. Deteccao de conflitos (5 tipos)
4. Testes unitarios com cobertura ampla

**Arquivos criados**:
- `backend/src/scheduling/types.ts` — interfaces do algoritmo: `GenerationInput`, `GenerationOutput`, `CandidateScore`, `Conflict`, `AuditEntry`
- `backend/src/scheduling/scoring.ts` — 3 funcoes de pontuacao + combinacao ponderada:
  - `scoreByCount(totalServices, maxServices)` — inverso linear (0-100)
  - `scoreByRotation(daysSinceLastInFunction, cap=28)` — proporcional (0-100)
  - `scoreByInterval(daysSinceLastService, cap=14)` — proporcional (0-100)
  - `combinedScore(count, rotation, interval, weights)` — media ponderada (50/30/20 default)
- `backend/src/scheduling/conflicts.ts` — deteccao dos 5 tipos de conflito: `NO_CANDIDATES`, `INSUFFICIENT_CANDIDATES`, `SINGLE_CANDIDATE_OVERLOAD`, `ALL_UNAVAILABLE`, `QUALIFICATION_GAP`
- `backend/src/scheduling/state.ts` — estado mutavel durante geracao: atribuicoes feitas, contagens, datas de ultimo servico
- `backend/src/scheduling/generator.ts` — loop principal:
  1. Ordenar celebracoes cronologicamente
  2. Para cada celebracao, ordenar vagas por restricao (mais restrita primeiro)
  3. Para cada vaga, pontuar candidatos elegiveis
  4. Atribuir melhor candidato (desempate: menos servicos → mais dias → alfabetico)
  5. Registrar auditoria de cada decisao
  6. Detectar conflitos para vagas nao resolvidas
- `backend/src/scheduling/__tests__/scoring.test.ts` — testes unitarios das funcoes de pontuacao
- `backend/src/scheduling/__tests__/generator.test.ts` — testes do loop principal com cenarios:
  - Cenario basico: 2 celebracoes, 5 acolitos, sem conflitos
  - Cenario de rotacao: mesmo acolito nao repetido em sequencia
  - Cenario de conflito: funcao sem candidatos habilitados
  - Cenario de travamento: atribuicoes travadas preservadas
  - Cenario de inicio frio: acolito novo recebe pontuacao 100

**Arquivos modificados**:
- `backend/package.json` — adicionar dependencias de teste se necessario (vitest ou jest)
- `backend/tsconfig.json` — garantir que testes sao compilados corretamente
- `CLAUDE.md` — documentar modulo de scheduling

**Criterios de teste**:
- [ ] `scoreByCount` retorna 100 para 0 servicos e 0 para max servicos
- [ ] `scoreByRotation` retorna 100 para >= 28 dias e 0 para 0 dias
- [ ] `scoreByInterval` retorna 100 para >= 14 dias e 0 para 0 dias
- [ ] `combinedScore` aplica pesos corretamente (50/30/20)
- [ ] Gerador atribui corretamente acolitos a vagas sem conflitos
- [ ] Gerador favorece acolitos com menos servicos (equidade)
- [ ] Gerador detecta conflito `NO_CANDIDATES` quando nenhum acolito tem a funcao
- [ ] Gerador detecta conflito `ALL_UNAVAILABLE` quando todos estao indisponiveis
- [ ] Gerador preserva atribuicoes com `isLocked: true`
- [ ] Acolito novo (sem historico) recebe pontuacao maxima em todos os criterios
- [ ] Desempate e deterministico (mesmo input → mesmo output)
- [ ] Auditoria registra decisao para cada candidato de cada vaga
- [ ] Todos os testes unitarios passam

---

### Half-loop 9: Integracao API → Algoritmo → DB + Celery Worker

**Objetivo**: Conectar o endpoint de geracao de escala ao algoritmo via fila Redis e worker Celery, salvando o resultado no banco.

**Dependencias**: Half-loops 1, 2, 7, 8 (Prisma, autenticacao, celebracoes com requisitos, algoritmo).

**Entregaveis**:
1. Endpoint de geracao que enfileira tarefa no Redis
2. Worker Celery que executa o algoritmo e salva resultado
3. Endpoint de polling para acompanhar status da geracao
4. Escala salva no banco com atribuicoes e auditoria

**Arquivos criados**:
- `backend/src/routes/schedule.routes.ts` — endpoints: `POST /api/schedules/generate`, `GET /api/schedules`, `GET /api/schedules/:id`
- `backend/src/services/schedule.service.ts` — logica de negocio: preparar input para o algoritmo, salvar output no banco
- `backend/src/validators/schedule.schema.ts` — schemas Zod para geracao (periodo, celebracoes selecionadas)
- `worker/scheduling.py` — port do algoritmo para Python OU chamada HTTP para o backend TypeScript
- `worker/tasks.py` (reescrever) — tarefa `generate_schedule` que: busca dados do banco → executa algoritmo → salva resultado → atualiza status

**Arquivos modificados**:
- `backend/src/server.ts` — registrar rotas de schedule
- `backend/src/lib/redis.ts` — adicionar funcoes para publicar/consumir tarefas na fila
- `worker/requirements.txt` — adicionar `psycopg2-binary` se nao estiver
- `docker-compose.yml` — verificar que worker tem acesso ao banco e Redis
- `CLAUDE.md` — documentar fluxo assincrono de geracao

**Criterios de teste**:
- [ ] `POST /api/schedules/generate` com periodo e celebracoes retorna `{ scheduleId, status: "GENERATING" }`
- [ ] Worker Celery recebe a tarefa e executa o algoritmo
- [ ] `GET /api/schedules/:id` retorna status atualizado (GENERATING → DRAFT)
- [ ] Escala DRAFT contem atribuicoes com pontuacoes e dados de auditoria
- [ ] Vagas nao resolvidas tem `userId: null` e conflito associado
- [ ] Apenas COORDINATOR+ pode gerar escalas
- [ ] Erro no worker nao deixa escala em estado inconsistente (rollback)
- [ ] Health check do worker via `docker compose logs worker` mostra tarefa processada

---

### Half-loop 10: UI de Geracao de Escala

**Objetivo**: Implementar a interface de geracao de escalas como um assistente de 3 passos e a visualizacao da grade de escala gerada.

**Dependencias**: Half-loops 3, 7, 9 (layout, celebracoes, integracao funcional).

**Entregaveis**:
1. Wizard de geracao em 3 passos (selecao de periodo, selecao de celebracoes, confirmacao e geracao)
2. Pagina de detalhe da escala com grade visual
3. Indicadores de status e progresso

**Arquivos criados**:
- `frontend/src/pages/escala-nova.tsx` — wizard de 3 passos:
  - Passo 1: selecionar periodo (data inicio e fim)
  - Passo 2: selecionar celebracoes do periodo (com preview de requisitos)
  - Passo 3: resumo e botao "Gerar Escala"
- `frontend/src/pages/escala-detalhe.tsx` — grade de escala: linhas = celebracoes (cronologicas), colunas = funcoes, celulas = acolito atribuido
- `frontend/src/pages/escalas.tsx` — listagem de escalas com filtro por status (DRAFT, PUBLISHED, ARCHIVED)
- `frontend/src/components/schedule/grade-escala.tsx` — componente de grade reutilizavel
- `frontend/src/components/schedule/badge-atribuicao.tsx` — badge que mostra nome do acolito com cor por status (atribuido, conflito, travado)
- `frontend/src/components/schedule/indicador-progresso.tsx` — barra de progresso durante geracao

**Arquivos modificados**:
- `frontend/src/App.tsx` — adicionar rotas `/escalas`, `/escala/nova`, `/escala/:id`
- `CLAUDE.md` — documentar paginas de escala

**Criterios de teste**:
- [ ] Wizard avanca e retrocede entre passos sem perder dados
- [ ] Passo 2 carrega celebracoes do periodo selecionado
- [ ] Botao "Gerar Escala" dispara POST e exibe progresso
- [ ] Apos geracao, redireciona para detalhe da escala
- [ ] Grade exibe celebracoes nas linhas e funcoes nas colunas
- [ ] Celulas com atribuicao mostram nome do acolito
- [ ] Celulas com conflito mostram indicador vermelho
- [ ] Celulas sem atribuicao mostram estado vazio
- [ ] Listagem exibe escalas com filtro por status funcional

---

### Half-loop 11: Resolucao de Conflitos + Substituicao Manual

**Objetivo**: Implementar a interface e API para resolver conflitos manualmente, atribuir/trocar acolitos e travar atribuicoes para re-geracao.

**Dependencias**: Half-loops 9, 10 (escala gerada com possíveis conflitos, UI de visualizacao).

**Entregaveis**:
1. Endpoints de CRUD de atribuicoes (adicionar, editar, remover, travar/destravar)
2. Interface de resolucao de conflitos no detalhe da escala
3. Mecanismo de travamento que preserva atribuicoes manuais em re-geracao
4. Dialog de atribuicao manual com lista de candidatos elegiveis

**Arquivos criados**:
- `frontend/src/components/schedule/indicador-conflito.tsx` — tooltip/popover que mostra tipo de conflito e sugestoes
- `frontend/src/components/schedule/dialog-atribuicao.tsx` — dialog para selecionar acolito manualmente (mostra candidatos elegiveis com pontuacao)
- `frontend/src/components/schedule/dialog-troca.tsx` — dialog para trocar dois acolitos entre vagas

**Arquivos modificados**:
- `backend/src/routes/schedule.routes.ts` — adicionar endpoints: `POST /api/schedules/:id/assignments`, `PATCH /api/schedules/:id/assignments/:assignmentId`, `DELETE /api/schedules/:id/assignments/:assignmentId`
- `backend/src/services/schedule.service.ts` — logica de atribuicao manual, travamento, validacao de conflitos
- `frontend/src/pages/escala-detalhe.tsx` — integrar indicadores de conflito, acoes de atribuicao manual
- `frontend/src/components/schedule/grade-escala.tsx` — adicionar interatividade (clique em celula abre dialog)
- `frontend/src/components/schedule/badge-atribuicao.tsx` — adicionar icone de cadeado para travadas
- `CLAUDE.md` — documentar resolucao de conflitos

**Criterios de teste**:
- [ ] `POST /api/schedules/:id/assignments` adiciona atribuicao manual a vaga vazia
- [ ] `PATCH /api/schedules/:id/assignments/:id` edita atribuicao (troca acolito)
- [ ] `PATCH /api/schedules/:id/assignments/:id` com `{ isLocked: true }` trava atribuicao
- [ ] `DELETE /api/schedules/:id/assignments/:id` remove atribuicao
- [ ] Atribuicao manual valida qualificacao do acolito para a funcao
- [ ] Atribuicao manual valida disponibilidade do acolito na data
- [ ] Clicar em celula com conflito abre dialog com lista de candidatos
- [ ] Candidatos no dialog mostram pontuacao e motivo de ranking
- [ ] Travar atribuicao mostra icone de cadeado na grade
- [ ] Re-gerar escala preserva atribuicoes travadas
- [ ] Re-gerar escala substitui atribuicoes nao travadas
- [ ] Nao e possivel editar atribuicoes de escala PUBLISHED

---

## Fase 4 — Distribuicao

Implementa publicacao, compartilhamento publico e visualizacoes filtradas das escalas.

---

### Half-loop 12: Publicacao + Tokens

**Objetivo**: Implementar o fluxo de publicacao de escalas e geracao de tokens para compartilhamento publico.

**Dependencias**: Half-loops 9-11 (escala gerada, com ou sem conflitos resolvidos).

**Entregaveis**:
1. Endpoint de publicacao que muda status para PUBLISHED e gera token publico
2. Botao de publicar na UI com confirmacao
3. Link de compartilhamento copiavel

**Arquivos criados**:
- `backend/src/lib/tokens.ts` — funcao `generatePublicToken()` usando `nanoid` (12 caracteres, URL-safe)

**Arquivos modificados**:
- `backend/src/routes/schedule.routes.ts` — adicionar endpoint: `POST /api/schedules/:id/publish`
- `backend/src/services/schedule.service.ts` — logica de publicacao: validar que nao ha conflitos criticos, gerar token, atualizar status
- `backend/package.json` — adicionar `nanoid`
- `frontend/src/pages/escala-detalhe.tsx` — adicionar botao "Publicar", dialog de confirmacao, exibicao do link de compartilhamento com botao de copiar
- `CLAUDE.md` — documentar fluxo de publicacao

**Criterios de teste**:
- [ ] `POST /api/schedules/:id/publish` muda status para PUBLISHED e retorna `publicToken`
- [ ] Publicacao falha se escala tem vagas sem atribuicao (conflitos nao resolvidos)
- [ ] Token gerado e unico e URL-safe (12 caracteres)
- [ ] Escala PUBLISHED nao pode ser editada (atribuicoes read-only)
- [ ] Botao "Publicar" mostra dialog de confirmacao
- [ ] Apos publicar, link de compartilhamento aparece com botao de copiar
- [ ] Copiar link funciona (clipboard API)
- [ ] Apenas COORDINATOR+ pode publicar

---

### Half-loop 13: Pagina Publica

**Objetivo**: Implementar a pagina publica de escalas acessivel sem autenticacao, mostrando apenas primeiro nome dos acolitos.

**Dependencias**: Half-loop 12 (token publico gerado).

**Entregaveis**:
1. Endpoints publicos (sem autenticacao)
2. Pagina publica com layout limpo e acessivel
3. Exibicao com primeiro nome apenas (privacidade)

**Arquivos criados**:
- `backend/src/routes/public.routes.ts` — endpoints: `GET /api/public/schedules/:token`, `GET /api/public/schedules/:token/period`
- `frontend/src/pages/escala-publica.tsx` — pagina publica: layout limpo (sem sidebar), grade de escala simplificada, primeiro nome dos acolitos

**Arquivos modificados**:
- `backend/src/server.ts` — registrar rotas publicas (sem middleware de autenticacao)
- `frontend/src/App.tsx` — adicionar rota `/p/:token` (fora do layout autenticado)
- `CLAUDE.md` — documentar acesso publico

**Criterios de teste**:
- [ ] `GET /api/public/schedules/:token` retorna escala sem exigir autenticacao
- [ ] Resposta contem apenas primeiro nome dos acolitos (nao nome completo, nao email)
- [ ] Token invalido retorna 404
- [ ] Escala nao publicada (DRAFT) nao e acessivel por token
- [ ] Pagina `/p/:token` renderiza sem sidebar, sem login
- [ ] Layout publico e limpo, com identidade visual do Liturgix
- [ ] Pagina funciona em dispositivos moveis
- [ ] `GET /api/public/schedules/:token/period` retorna escalas do periodo filtradas

---

### Half-loop 14: Visualizacoes

**Objetivo**: Implementar filtros e visualizacoes alternativas da escala: por data, por pessoa e por funcao.

**Dependencias**: Half-loops 10, 13 (UI de escala e pagina publica existem).

**Entregaveis**:
1. Filtro por data (calendario com seletor de periodo)
2. Filtro por pessoa (selecionar acolito e ver todas as atribuicoes)
3. Filtro por funcao (selecionar funcao e ver todos os acolitos atribuidos)

**Arquivos criados**:
- `frontend/src/components/schedule/filtro-escala.tsx` — componente de filtros combinaveis (data, pessoa, funcao)
- `frontend/src/components/schedule/visao-por-pessoa.tsx` — visualizacao centrada em um acolito: lista de datas e funcoes atribuidas
- `frontend/src/components/schedule/visao-por-funcao.tsx` — visualizacao centrada em uma funcao: lista de datas e acolitos atribuidos

**Arquivos modificados**:
- `frontend/src/pages/escala-detalhe.tsx` — integrar componente de filtros e visualizacoes alternativas
- `frontend/src/pages/escala-publica.tsx` — adicionar filtros basicos na pagina publica
- `backend/src/routes/schedule.routes.ts` — adicionar query params de filtro ao endpoint `GET /api/schedules/:id`
- `CLAUDE.md` — documentar visualizacoes

**Criterios de teste**:
- [ ] Filtro por data mostra apenas celebracoes no periodo selecionado
- [ ] Filtro por pessoa mostra todas as atribuicoes de um acolito especifico
- [ ] Filtro por funcao mostra todos os acolitos atribuidos a uma funcao especifica
- [ ] Filtros sao combinaveis (ex: pessoa + periodo)
- [ ] Filtros funcionam tanto na pagina autenticada quanto na publica
- [ ] Limpar filtros restaura visualizacao completa
- [ ] URL reflete filtros aplicados (query params, permitindo compartilhamento)

---

## Fase 5 — Responsaveis e Administracao

Implementa vinculos de responsaveis, painel administrativo completo e auditoria.

---

### Half-loop 15: Vinculo Responsavel↔Acolito

**Objetivo**: Implementar o sistema de vinculacao de responsaveis a acolitos menores, permitindo que responsaveis visualizem dados dos acolitos vinculados.

**Dependencias**: Half-loops 1-3, 5 (Prisma, autenticacao, layout, perfis de acolitos).

**Entregaveis**:
1. Endpoints de gerenciamento de vinculos responsavel-acolito
2. Paginas de responsaveis no frontend
3. Scoping: responsavel ve apenas dados dos acolitos vinculados

**Arquivos criados**:
- `backend/src/routes/guardian.routes.ts` — endpoints: `GET /api/guardians`, `GET /api/guardians/:id/acolytes`, `POST /api/guardians/:id/link`
- `frontend/src/pages/responsaveis.tsx` — listagem de responsaveis com acolitos vinculados
- `frontend/src/components/shared/dialog-vinculacao.tsx` — dialog para vincular acolito a responsavel

**Arquivos modificados**:
- `backend/src/server.ts` — registrar rotas de guardians
- `backend/src/middleware/role.guard.ts` — ajustar para suportar scoping de GUARDIAN (ve apenas vinculados)
- `frontend/src/App.tsx` — adicionar rota `/responsaveis`
- `frontend/src/components/layout/sidebar.tsx` — adicionar item para GUARDIAN
- `CLAUDE.md` — documentar vinculos

**Criterios de teste**:
- [ ] `GET /api/guardians` retorna lista de responsaveis (COORDINATOR+)
- [ ] `GET /api/guardians/:id/acolytes` retorna acolitos vinculados
- [ ] `POST /api/guardians/:id/link` vincula acolito (COORDINATOR+)
- [ ] GUARDIAN logado ve apenas dados dos acolitos vinculados a ele
- [ ] GUARDIAN nao ve dados de acolitos nao vinculados
- [ ] GUARDIAN pode ver escalas PUBLISHED (filtradas para seus acolitos)
- [ ] COORDINATOR pode criar e remover vinculos
- [ ] Pagina `/responsaveis` mostra lista e permite gestao de vinculos

---

### Half-loop 16: Painel Administrativo

**Objetivo**: Implementar o painel de administracao com gestao completa de usuarios e papeis.

**Dependencias**: Half-loops 1-3, 4 (Prisma, autenticacao, layout, admin de funcoes).

**Entregaveis**:
1. Endpoints de gestao de usuarios (listagem, edicao de papeis)
2. Paginas administrativas no frontend
3. Protecao do ultimo ADMIN

**Arquivos criados**:
- `backend/src/routes/user.routes.ts` — endpoints: `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id`, `DELETE /api/users/:id`
- `frontend/src/pages/admin.tsx` — dashboard administrativo com metricas resumidas
- `frontend/src/pages/admin-usuarios.tsx` — listagem de usuarios com edicao de papeis

**Arquivos modificados**:
- `backend/src/routes/admin.routes.ts` — adicionar endpoints: `GET /api/admin/users`, `PATCH /api/admin/users/:id/role`
- `backend/src/services/user.service.ts` — logica de gestao de usuarios, protecao do ultimo ADMIN
- `backend/src/server.ts` — registrar rotas de users
- `frontend/src/App.tsx` — adicionar rotas `/admin`, `/admin/usuarios`
- `CLAUDE.md` — documentar painel admin

**Criterios de teste**:
- [ ] `GET /api/admin/users` retorna lista completa de usuarios (ADMIN apenas)
- [ ] `PATCH /api/admin/users/:id/role` muda papel do usuario
- [ ] Mudar papel do ultimo ADMIN e bloqueado (400 com mensagem explicativa)
- [ ] `DELETE /api/users/:id` faz exclusao logica (ADMIN apenas)
- [ ] Nao e possivel excluir o ultimo ADMIN
- [ ] COORDINATOR nao acessa endpoints admin (403)
- [ ] Pagina `/admin` mostra metricas: total de usuarios, escalas, celebracoes
- [ ] Pagina `/admin/usuarios` exibe tabela com edicao de papeis via dropdown

---

### Half-loop 17: Auditoria + Estatisticas

**Objetivo**: Implementar o log de auditoria de acoes e dashboard de estatisticas do sistema.

**Dependencias**: Half-loops 1-3, 9, 16 (Prisma, autenticacao, layout, escalas salvas, painel admin).

**Entregaveis**:
1. Registro automatico de acoes no log de auditoria
2. Endpoints de consulta de auditoria e estatisticas
3. Paginas de auditoria e dashboard de estatisticas

**Arquivos criados**:
- `backend/src/services/audit.service.ts` — servico de auditoria: registrar acoes (quem, o que, quando, dados anteriores e posteriores)
- `frontend/src/pages/admin-auditoria.tsx` — pagina com log de auditoria filtrado (por usuario, tipo de acao, periodo)
- `frontend/src/components/shared/dashboard-stats.tsx` — componente de estatisticas com cards e graficos simples

**Arquivos modificados**:
- `backend/src/routes/admin.routes.ts` — adicionar endpoints: `GET /api/admin/audit-log`, `GET /api/admin/stats`
- `backend/src/services/schedule.service.ts` — integrar log de auditoria nas acoes de escala
- `backend/src/services/auth.service.ts` — integrar log de auditoria em registro e login
- `backend/src/services/celebration.service.ts` — integrar log de auditoria nas acoes de celebracao
- `frontend/src/pages/admin.tsx` — integrar dashboard de estatisticas
- `CLAUDE.md` — documentar auditoria

**Criterios de teste**:
- [ ] Acoes registradas automaticamente: criar/editar/excluir celebracao, gerar/publicar escala, mudar papel, atribuir funcao
- [ ] `GET /api/admin/audit-log` retorna log paginado com filtros
- [ ] `GET /api/admin/stats` retorna: total de usuarios por papel, celebracoes por tipo, escalas por status, acolitos por funcao
- [ ] Log de auditoria contem: usuario, acao, timestamp, dados antes e depois (JSON)
- [ ] Pagina `/admin/auditoria` exibe log filtrado
- [ ] Dashboard mostra metricas atualizadas
- [ ] Apenas ADMIN acessa auditoria e estatisticas

---

## Fase 6 — Polimento

Ajustes finais de responsividade, acessibilidade e testes de ponta a ponta.

---

### Half-loop 18: Responsividade Mobile + Acessibilidade

**Objetivo**: Garantir que todas as telas funcionam em dispositivos moveis e atendem criterios basicos de acessibilidade.

**Dependencias**: Half-loops 1-17 (todas as telas implementadas).

**Entregaveis**:
1. Todas as telas testadas e ajustadas para viewport mobile (320px-768px)
2. Sidebar colapsavel em mobile (hamburger menu)
3. Grade de escala com scroll horizontal em telas pequenas
4. ARIA labels em todos os componentes interativos
5. Navegacao por teclado funcional
6. Score Lighthouse de acessibilidade > 90

**Arquivos criados**:
- Nenhum arquivo novo significativo; ajustes em arquivos existentes.

**Arquivos modificados**:
- `frontend/src/components/layout/sidebar.tsx` — menu hamburger para mobile
- `frontend/src/components/layout/app-layout.tsx` — layout responsivo
- `frontend/src/components/schedule/grade-escala.tsx` — scroll horizontal em mobile
- `frontend/src/components/ui/*.tsx` — ARIA labels e roles em todos os componentes
- `frontend/src/pages/*.tsx` — ajustes de layout para telas pequenas
- `frontend/tailwind.config.ts` — breakpoints, se necessario
- `CLAUDE.md` — documentar padrao de acessibilidade

**Criterios de teste**:
- [ ] Todas as paginas renderizam corretamente em 320px de largura
- [ ] Sidebar transforma em menu hamburger em telas < 768px
- [ ] Grade de escala permite scroll horizontal em mobile
- [ ] Formularios sao utilizaveis em mobile (inputs nao cortados, botoes alcancaveis)
- [ ] Todos os botoes e links tem `aria-label` ou texto acessivel
- [ ] Navegacao por tab funciona em ordem logica
- [ ] Dialogs capturam foco e permitem fechar com Escape
- [ ] Contraste de cores atende WCAG AA (ratio >= 4.5:1 para texto)
- [ ] Lighthouse Accessibility score > 90 em todas as paginas principais

---

### Half-loop 19: Testes E2E + Documentacao Final

**Objetivo**: Implementar suite de testes E2E para fluxos criticos e atualizar toda a documentacao do projeto.

**Dependencias**: Half-loops 1-18 (sistema completo e polido).

**Entregaveis**:
1. Testes E2E com Playwright para fluxos criticos
2. CLAUDE.md atualizado com arquitetura final
3. Documentacao de comandos e fluxos atualizada

**Arquivos criados**:
- `e2e/playwright.config.ts` — configuracao do Playwright para o ambiente Docker
- `e2e/tests/auth.spec.ts` — fluxo: cadastro → login → acesso protegido → logout
- `e2e/tests/availability.spec.ts` — fluxo: login como ACOLYTE → marcar disponibilidade → salvar → verificar persistencia
- `e2e/tests/schedule-generation.spec.ts` — fluxo: login como COORDINATOR → criar celebracao → gerar escala → verificar resultado
- `e2e/tests/schedule-publish.spec.ts` — fluxo: resolver conflitos → publicar escala → acessar link publico
- `e2e/tests/admin.spec.ts` — fluxo: login como ADMIN → gerenciar usuarios → gerenciar funcoes → verificar auditoria
- `e2e/fixtures/seed.ts` — dados de teste para E2E (usuarios, celebracoes, funcoes)
- `e2e/package.json` — dependencias do Playwright

**Arquivos modificados**:
- `CLAUDE.md` — reescrever com:
  - Arquitetura final completa
  - Todos os endpoints documentados
  - Comandos de desenvolvimento, teste e deploy
  - Estrutura de pastas atualizada
  - Convencoes de codigo
- `docker-compose.yml` — adicionar profile de teste (se necessario para E2E)
- `package.json` (raiz, se existir) — adicionar script de teste E2E

**Criterios de teste**:
- [ ] `npx playwright test` executa todos os testes sem falha
- [ ] Fluxo de autenticacao E2E passa (cadastro → login → protecao → logout)
- [ ] Fluxo de disponibilidade E2E passa (marcar → salvar → verificar)
- [ ] Fluxo de geracao de escala E2E passa (criar celebracao → gerar → visualizar)
- [ ] Fluxo de publicacao E2E passa (publicar → link publico acessivel)
- [ ] Fluxo de administracao E2E passa (gerenciar usuarios → auditoria)
- [ ] CLAUDE.md reflete a arquitetura e estrutura final do projeto
- [ ] Toda documentacao em `docs/` esta consistente com a implementacao final

---

## Resumo de Dependencias entre Half-loops

```
Half-loop 1 (Prisma)
  └─→ Half-loop 2 (Auth)
       └─→ Half-loop 3 (Layout)
            ├─→ Half-loop 4 (Funcoes Admin)
            │    └─→ Half-loop 5 (Acolitos)
            ├─→ Half-loop 6 (Disponibilidade)
            ├─→ Half-loop 7 (Celebracoes)
            │    └─→ Half-loop 9 (Integracao)
            └─→ Half-loop 16 (Painel Admin)

Half-loop 8 (Algoritmo) ← independente (TypeScript puro)
  └─→ Half-loop 9 (Integracao)
       └─→ Half-loop 10 (UI Escala)
            └─→ Half-loop 11 (Conflitos)
                 └─→ Half-loop 12 (Publicacao)
                      └─→ Half-loop 13 (Pagina Publica)
                      └─→ Half-loop 14 (Visualizacoes)

Half-loop 5 (Acolitos)
  └─→ Half-loop 15 (Responsaveis)

Half-loop 9, 16
  └─→ Half-loop 17 (Auditoria)

Half-loops 1-17
  └─→ Half-loop 18 (Mobile + A11y)
       └─→ Half-loop 19 (E2E + Docs)
```

---

## Estimativa de Esforco

| Fase | Half-loops | Complexidade Relativa | Observacao |
|------|------------|-----------------------|-----------|
| 1 — Fundacao | 1-3 | Media | Infraestrutura critica, base para tudo |
| 2 — Dominio Central | 4-7 | Media-Baixa | CRUDs padrao, maior volume de codigo |
| 3 — Motor de Escala | 8-11 | Alta | Algoritmo e mais complexo, integracao Celery |
| 4 — Distribuicao | 12-14 | Baixa | Fluxos simples sobre base existente |
| 5 — Responsaveis e Admin | 15-17 | Media | Scoping e auditoria exigem cuidado |
| 6 — Polimento | 18-19 | Media | Ajustes amplos em todas as telas |

---

## Notas Importantes

1. **Half-loop 8 pode ser paralelizado**: como o algoritmo e TypeScript puro sem I/O, pode ser desenvolvido em paralelo com half-loops 4-7 (dominio central).

2. **Worker Celery (half-loop 9)**: a decisao entre portar o algoritmo para Python ou chamar o TypeScript via HTTP sera tomada durante a implementacao. A opcao mais simples e implementar em Python reaproveitando a logica do TypeScript.

3. **shadcn/ui sem Next.js (half-loop 3)**: requer adaptacao manual da CLI do shadcn para funcionar com Vite. A configuracao de aliases e resolucao de modulos precisa ser ajustada.

4. **Testes incrementais**: cada half-loop tem criterios de teste que devem passar antes de avancar. Nao e necessario esperar a fase 6 para comecar a testar.

5. **CLAUDE.md como fonte de verdade**: atualizado ao final de cada half-loop para que o contexto de desenvolvimento esteja sempre correto.
