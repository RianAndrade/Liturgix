# Plano de Half-Loops

## O que e um half-loop

Um half-loop e um ciclo de desenvolvimento focado que produz um incremento funcional e testavel. Comeca com um objetivo claro, segue o plano definido, e termina com documentacao atualizada. Cada half-loop deve ser completavel em uma unica sessao do Claude Code.

---

## Regras para cada half-loop

1. **Objetivo claro**: uma frase descrevendo o que o half-loop entrega
2. **Dependencias**: quais half-loops anteriores devem estar concluidos
3. **Entregaveis**: arquivos especificos criados ou modificados
4. **Teste**: como verificar que o half-loop esta completo
5. **Documentacao**: CLAUDE.md atualizado, documentos relevantes atualizados se o plano desviar

---

## Criterios de completude (aplicam-se a todos os half-loops)

- Todos os entregaveis existem e funcionam
- Testes passam (manuais ou automatizados)
- Sem regressoes nos half-loops anteriores
- CLAUDE.md reflete o estado atual
- Codigo compila e `docker compose up --build` funciona sem erros

---

## Mapa de fases

| Fase | Half-Loops | Tema |
|------|-----------|------|
| 1 - Fundacao | HL-01 a HL-03 | Prisma, autenticacao, layout base |
| 2 - Dominio Central | HL-04 a HL-07 | Funcoes, acolitos, disponibilidade, celebracoes |
| 3 - Motor de Escala | HL-08 a HL-11 | Algoritmo, integracao, UI, conflitos |
| 4 - Distribuicao | HL-12 a HL-14 | Publicacao, pagina publica, visualizacoes |
| 5 - Responsaveis e Admin | HL-15 a HL-17 | Vinculo responsavel, painel admin, auditoria |
| 6 - Polimento | HL-18 a HL-19 | Mobile, acessibilidade, testes E2E |

---

## Grafo de dependencias

```
HL-01 ──┬── HL-02 ──┬── HL-04 ── HL-05 ── HL-06
        │           │                       │
        │           ├── HL-03               │
        │           │                       │
        │           └── HL-07 ──────────────┘
        │                                   │
        │               HL-08 ──── HL-09 ───┤
        │                           │       │
        │                          HL-10 ── HL-11
        │                                   │
        │                          HL-12 ── HL-13
        │                           │
        │                          HL-14
        │
        ├── HL-15 (depende de HL-02, HL-05)
        │
        ├── HL-16 (depende de HL-02, HL-04)
        │    │
        │   HL-17
        │
        └── HL-18 (depende de HL-03 e todos os HL de UI)
             │
            HL-19 (depende de todos os anteriores)
```

---

## Template de referencia

```markdown
## Half-Loop [N]: [Titulo]

**Objetivo:** [Uma frase]

**Dependencias:** Half-loops [X, Y, Z]

**Entregaveis:**
- [ ] [Arquivo/feature 1]
- [ ] [Arquivo/feature 2]
- ...

**Teste:**
- [ ] [Criterio de teste 1]
- [ ] [Criterio de teste 2]
- ...

**Documentacao:**
- [ ] CLAUDE.md atualizado
- [ ] [Outros docs se necessario]

**Status:** Nao iniciado | Em progresso | Concluido
```

---

## Fase 1 -- Fundacao

---

## Half-Loop 01: Setup Prisma + schema + migracao + seed

**Objetivo:** Configurar o Prisma como ORM, criar o schema completo do banco de dados conforme `docs/07-modelagem-dados.md`, rodar a primeira migracao e popular as funcoes liturgicas iniciais.

**Dependencias:** Nenhuma (primeiro half-loop)

**Entregaveis:**
- [ ] `backend/prisma/schema.prisma` -- schema completo com todas as entidades: User, GuardianLink, LiturgicalFunction, UserFunction, Unavailability, Celebration, CelebrationFunctionRequirement, Schedule, ScheduleAssignment, ServiceRecord, ScheduleAuditLog
- [ ] `backend/prisma/seed.ts` -- seed com as 9 funcoes liturgicas iniciais e usuario admin padrao
- [ ] `backend/prisma/migrations/` -- primeira migracao gerada
- [ ] `backend/src/lib/db.ts` -- singleton do Prisma client
- [ ] `backend/package.json` atualizado com dependencias: `prisma`, `@prisma/client`
- [ ] `backend/tsconfig.json` ajustado se necessario para o Prisma

**Teste:**
- [ ] `npx prisma migrate dev` roda sem erros dentro do container
- [ ] `npx prisma db seed` popula funcoes liturgicas e admin
- [ ] `docker compose up --build` sobe sem erros
- [ ] `GET /api/health` continua funcionando (sem regressao)
- [ ] Conexao Prisma ao PostgreSQL validada via log ou endpoint de teste

**Documentacao:**
- [ ] CLAUDE.md atualizado com secao do Prisma, comando de migracao, estrutura de pastas
- [ ] `docs/07-modelagem-dados.md` referenciado como fonte do schema

**Status:** Nao iniciado

---

## Half-Loop 02: Autenticacao JWT (register, login, logout, me)

**Objetivo:** Implementar o sistema completo de autenticacao com JWT, incluindo registro de usuarios, login, logout com lista negra no Redis, e endpoint de perfil, alem do middleware de verificacao de papeis (RBAC).

**Dependencias:** Half-loop 01

**Entregaveis:**
- [ ] `backend/src/plugins/auth.ts` -- plugin Fastify com `@fastify/jwt`, decoradores `authenticate` e `authorize`
- [ ] `backend/src/routes/auth.routes.ts` -- rotas POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/me`
- [ ] `backend/src/services/auth.service.ts` -- logica de registro (hash bcrypt), login (verificacao + emissao JWT), logout (blacklist Redis)
- [ ] `backend/src/middleware/auth.guard.ts` -- verifica JWT valido e nao esta na blacklist
- [ ] `backend/src/middleware/role.guard.ts` -- verifica papel do usuario (ACOLYTE, GUARDIAN, COORDINATOR, ADMIN)
- [ ] `backend/src/validators/auth.schema.ts` -- schemas Zod para register e login
- [ ] `backend/src/lib/redis.ts` -- cliente Redis isolado (refatorado do server.ts)
- [ ] `backend/package.json` atualizado com: `@fastify/jwt`, `bcrypt`, `zod`
- [ ] `backend/src/server.ts` refatorado para registrar plugins de auth

**Teste:**
- [ ] POST `/api/auth/register` cria usuario com senha hasheada no banco
- [ ] POST `/api/auth/register` rejeita email duplicado com 409
- [ ] POST `/api/auth/register` rejeita payload invalido com 400
- [ ] POST `/api/auth/login` retorna JWT valido para credenciais corretas
- [ ] POST `/api/auth/login` retorna 401 para credenciais invalidas
- [ ] GET `/api/auth/me` retorna perfil do usuario autenticado
- [ ] GET `/api/auth/me` retorna 401 sem token
- [ ] POST `/api/auth/logout` invalida o token (chamada subsequente a `/me` retorna 401)
- [ ] Middleware de papeis bloqueia acesso de ACOLYTE a rotas de COORDINATOR
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de auth, estrategia JWT, variaveis de ambiente (JWT_SECRET)
- [ ] Referencia a `docs/03-perfis-permissoes.md` e `docs/09-especificacao-api.md`

**Status:** Nao iniciado

---

## Half-Loop 03: Layout base (Tailwind + shadcn/ui + tema + sidebar + routing)

**Objetivo:** Configurar o frontend com Tailwind CSS, shadcn/ui, o tema eclesiastico definido no design system, sidebar de navegacao responsiva por papel, e roteamento completo com React Router.

**Dependencias:** Half-loop 02

**Entregaveis:**
- [ ] `frontend/tailwind.config.ts` -- configuracao com paleta eclesiastica (bordô, dourado, pergaminho), fontes Crimson Pro e Inter
- [ ] `frontend/src/index.css` -- estilos globais com variaveis CSS do tema
- [ ] `frontend/components.json` -- configuracao do shadcn/ui para Vite
- [ ] `frontend/src/lib/cn.ts` -- utilitario de classname (clsx + tailwind-merge)
- [ ] `frontend/src/lib/api.ts` -- cliente HTTP tipado com headers de auth
- [ ] `frontend/src/lib/auth.tsx` -- AuthProvider com contexto React, armazenamento de JWT, ProtectedRoute
- [ ] `frontend/src/hooks/use-auth.ts` -- hook para acessar contexto de auth (login, logout, user, isAuthenticated)
- [ ] `frontend/src/hooks/use-api.ts` -- hook wrapper de fetch com token JWT automatico
- [ ] `frontend/src/components/layout/sidebar.tsx` -- sidebar de navegacao com itens filtrados por papel do usuario
- [ ] `frontend/src/components/layout/topbar.tsx` -- barra superior com nome do usuario e logout
- [ ] `frontend/src/components/layout/page-header.tsx` -- cabecalho padrao de pagina
- [ ] `frontend/src/components/ui/` -- componentes base do shadcn/ui: Button, Card, Input, Label, Dialog, Badge, Toast
- [ ] `frontend/src/App.tsx` -- reescrito com React Router, rotas protegidas, layout com sidebar
- [ ] `frontend/src/pages/login.tsx` -- tela de login funcional conectada a API
- [ ] `frontend/src/pages/cadastro.tsx` -- tela de cadastro funcional
- [ ] `frontend/src/pages/painel.tsx` -- dashboard placeholder (pagina inicial pos-login)
- [ ] `frontend/package.json` atualizado com: `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom`, `clsx`, `tailwind-merge`, `class-variance-authority`, dependencias do shadcn/ui
- [ ] `frontend/postcss.config.js` -- configuracao do PostCSS

**Teste:**
- [ ] `npm run build` no frontend compila sem erros
- [ ] Pagina de login renderiza com tema eclesiastico (bordô, fontes corretas)
- [ ] Login funcional: formulario envia credenciais, recebe JWT, redireciona para painel
- [ ] Cadastro funcional: cria conta e redireciona para login
- [ ] Sidebar exibe itens corretos para o papel do usuario logado
- [ ] Rotas protegidas redirecionam para login se nao autenticado
- [ ] Logout limpa o JWT e redireciona para login
- [ ] `docker compose up --build` funciona sem erros
- [ ] Navegacao entre paginas funciona via React Router (sem reload)

**Documentacao:**
- [ ] CLAUDE.md atualizado com estrutura do frontend, componentes shadcn/ui instalados, rotas configuradas
- [ ] Referencia a `docs/11-design-system.md` e `docs/10-convencao-rotas.md`

**Status:** Nao iniciado

---

## Fase 2 -- Dominio Central

---

## Half-Loop 04: CRUD funcoes liturgicas (admin)

**Objetivo:** Implementar a gestao completa de funcoes liturgicas (criar, listar, editar, ativar/desativar) no backend e frontend, acessivel apenas por ADMIN.

**Dependencias:** Half-loops 02, 03

**Entregaveis:**
- [ ] `backend/src/routes/admin.routes.ts` -- endpoints GET `/api/admin/functions`, POST `/api/admin/functions`, PATCH `/api/admin/functions/:id`
- [ ] `backend/src/services/function.service.ts` -- logica de CRUD de funcoes liturgicas
- [ ] `backend/src/validators/function.schema.ts` -- schemas Zod para criacao e edicao de funcao
- [ ] `frontend/src/pages/admin-funcoes.tsx` -- tela de listagem e edicao de funcoes
- [ ] `frontend/src/components/shared/data-table.tsx` -- componente de tabela reutilizavel

**Teste:**
- [ ] GET `/api/admin/functions` retorna lista de funcoes (incluindo inativas) para ADMIN
- [ ] GET `/api/admin/functions` retorna 403 para ACOLYTE
- [ ] POST `/api/admin/functions` cria nova funcao liturgica
- [ ] PATCH `/api/admin/functions/:id` edita nome ou desativa funcao
- [ ] Tela admin-funcoes lista, cria e edita funcoes com feedback visual
- [ ] Funcoes desativadas aparecem visualmente distintas na listagem
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de admin/funcoes
- [ ] Referencia a `docs/09-especificacao-api.md`

**Status:** Nao iniciado

---

## Half-Loop 05: Perfil de acolito + qualificacoes

**Objetivo:** Implementar a visualizacao e edicao do perfil de acolitos, incluindo a gestao de qualificacoes (funcoes habilitadas para cada acolito), controlada por COORDINATOR ou superior.

**Dependencias:** Half-loops 04, 02

**Entregaveis:**
- [ ] `backend/src/routes/server.routes.ts` -- endpoints GET `/api/servers`, GET `/api/servers/:id`, GET `/api/servers/:id/functions`, PUT `/api/servers/:id/functions`
- [ ] `backend/src/services/user.service.ts` -- logica de listagem e detalhe de acolitos, gestao de qualificacoes
- [ ] `backend/src/validators/user.schema.ts` -- schemas Zod para edicao de funcoes
- [ ] `frontend/src/pages/acolitos.tsx` -- listagem de acolitos com filtros
- [ ] `frontend/src/pages/acolito-detalhe.tsx` -- detalhe do acolito com funcoes habilitadas, historico resumido
- [ ] `frontend/src/components/acolyte/acolyte-card.tsx` -- card de acolito reutilizavel
- [ ] `frontend/src/pages/minhas-funcoes.tsx` -- tela para o proprio acolito ver suas funcoes (somente leitura)

**Teste:**
- [ ] GET `/api/servers` retorna lista de acolitos para COORDINATOR+
- [ ] GET `/api/servers/:id/functions` retorna funcoes habilitadas do acolito
- [ ] PUT `/api/servers/:id/functions` atualiza funcoes (somente COORDINATOR+)
- [ ] PUT `/api/servers/:id/functions` rejeita funcao inexistente ou inativa
- [ ] ACOLYTE consegue ver suas proprias funcoes mas nao editar
- [ ] Tela de listagem exibe acolitos com suas qualificacoes
- [ ] Tela de detalhe permite COORDINATOR editar funcoes habilitadas
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de acolitos
- [ ] Referencia a `docs/09-especificacao-api.md` e `docs/04-regras-negocio.md`

**Status:** Nao iniciado

---

## Half-Loop 06: Calendario de disponibilidade

**Objetivo:** Implementar o sistema de marcacao de indisponibilidade dos acolitos, com interface de calendario visual onde o acolito seleciona as datas em que NAO pode servir.

**Dependencias:** Half-loops 05, 03

**Entregaveis:**
- [ ] `backend/src/routes/server.routes.ts` (adicao) -- endpoints GET `/api/servers/:id/availability`, PUT `/api/servers/:id/availability`
- [ ] `backend/src/services/availability.service.ts` -- logica de leitura e substituicao de indisponibilidades por periodo
- [ ] `backend/src/validators/availability.schema.ts` -- schema Zod para array de datas + periodo
- [ ] `frontend/src/pages/disponibilidade.tsx` -- tela com calendario visual para marcar indisponibilidades
- [ ] `frontend/src/components/acolyte/availability-calendar.tsx` -- componente de calendario com selecao multipla de datas
- [ ] `frontend/src/components/ui/calendar.tsx` -- componente Calendar do shadcn/ui (se ainda nao instalado)

**Teste:**
- [ ] GET `/api/servers/:id/availability?start=2026-04-01&end=2026-04-30` retorna datas indisponiveis do mes
- [ ] PUT `/api/servers/:id/availability` substitui indisponibilidades no periodo informado
- [ ] ACOLYTE so pode editar sua propria disponibilidade
- [ ] COORDINATOR pode editar disponibilidade de qualquer acolito
- [ ] Calendario visual marca datas indisponiveis com destaque visual
- [ ] Selecao e desselecao de datas funciona por clique
- [ ] Salvar atualiza o banco e exibe feedback de sucesso
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de disponibilidade
- [ ] Referencia a `docs/05-fluxos-usuario.md` (fluxo de marcar indisponibilidade)

**Status:** Nao iniciado

---

## Half-Loop 07: CRUD celebracoes + requisitos

**Objetivo:** Implementar a gestao completa de celebracoes (missas, festas, etc.) incluindo a definicao de quais funcoes liturgicas e quantas vagas cada celebracao precisa.

**Dependencias:** Half-loops 04, 02

**Entregaveis:**
- [ ] `backend/src/routes/celebration.routes.ts` -- endpoints GET `/api/celebrations`, POST `/api/celebrations`, GET `/api/celebrations/:id`, PATCH `/api/celebrations/:id`, DELETE `/api/celebrations/:id`, PUT `/api/celebrations/:id/requirements`
- [ ] `backend/src/services/celebration.service.ts` -- logica de CRUD de celebracoes e gestao de requisitos
- [ ] `backend/src/validators/celebration.schema.ts` -- schemas Zod para celebracao e requisitos
- [ ] `frontend/src/pages/celebracoes.tsx` -- listagem de celebracoes com filtros por tipo e data
- [ ] `frontend/src/pages/celebracao-form.tsx` -- formulario de criacao/edicao com selecao de requisitos
- [ ] `frontend/src/components/celebration/celebration-card.tsx` -- card de celebracao reutilizavel
- [ ] `frontend/src/components/celebration/requirements-editor.tsx` -- editor de requisitos (funcao + quantidade)

**Teste:**
- [ ] POST `/api/celebrations` cria celebracao com tipo, data, horario, local
- [ ] PUT `/api/celebrations/:id/requirements` define funcoes necessarias com quantidades
- [ ] GET `/api/celebrations` retorna celebracoes filtradas por periodo
- [ ] DELETE `/api/celebrations/:id` realiza exclusao logica (soft delete)
- [ ] Apenas COORDINATOR+ pode criar/editar/deletar celebracoes
- [ ] ACOLYTE pode visualizar celebracoes mas nao editar
- [ ] Formulario valida campos obrigatorios e exibe erros
- [ ] Editor de requisitos permite adicionar/remover funcoes com quantidade
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de celebracoes
- [ ] Referencia a `docs/09-especificacao-api.md` e `docs/04-regras-negocio.md`

**Status:** Nao iniciado

---

## Fase 3 -- Motor de Escala

---

## Half-Loop 08: Algoritmo de geracao (TypeScript puro, zero I/O)

**Objetivo:** Implementar o algoritmo de geracao automatica de escalas como modulo TypeScript puro (sem acesso a banco, Redis ou rede), recebendo dados via parametros e retornando o resultado, conforme especificado em `docs/08-algoritmo-escala.md`.

**Dependencias:** Nenhuma (modulo puro, pode ser desenvolvido em paralelo com a Fase 2, mas para fins de sequencia do plano depende de HL-01 para tipos do Prisma)

**Entregaveis:**
- [ ] `backend/src/scheduling/types.ts` -- interfaces do algoritmo: GeneratorInput, GeneratorOutput, CandidateScore, Conflict, Slot, AuditEntry
- [ ] `backend/src/scheduling/scoring.ts` -- 3 funcoes de pontuacao (contagem, rotacao, intervalo) + combinacao ponderada
- [ ] `backend/src/scheduling/conflicts.ts` -- deteccao e classificacao dos 5 tipos de conflito
- [ ] `backend/src/scheduling/state.ts` -- estado mutavel durante a geracao (atribuicoes feitas, contadores)
- [ ] `backend/src/scheduling/generator.ts` -- loop principal: itera celebracoes cronologicamente, vagas por restricao, seleciona candidato com maior pontuacao
- [ ] `backend/src/scheduling/index.ts` -- export publico do modulo
- [ ] `backend/src/scheduling/__tests__/scoring.test.ts` -- testes unitarios das funcoes de pontuacao
- [ ] `backend/src/scheduling/__tests__/generator.test.ts` -- testes do gerador com cenarios: basico, conflito, inicio frio, desempate, travamento

**Teste:**
- [ ] Funcao de pontuacao por contagem retorna 100 para acolito com 0 servicos e valor decrescente conforme aumenta
- [ ] Funcao de pontuacao por rotacao retorna 100 para acolito que nunca fez a funcao e 0 se fez ontem
- [ ] Funcao de pontuacao por intervalo retorna 100 para acolito sem servico recente
- [ ] Combinacao ponderada calcula: `0.50 * contagem + 0.30 * rotacao + 0.20 * intervalo`
- [ ] Gerador atribui acolitos respeitando: sem duplicata no dia, respeitar indisponibilidade, so funcoes habilitadas
- [ ] Gerador produz conflito SEM_CANDIDATOS quando ninguem esta disponivel
- [ ] Gerador respeita atribuicoes travadas (locked) durante re-geracao
- [ ] Inicio frio: acolito sem historico recebe pontuacao maxima
- [ ] Desempate: menos servicos totais, depois mais dias desde ultimo servico, depois alfabetico
- [ ] Todos os testes unitarios passam com `npm test`
- [ ] Modulo nao importa nada de I/O (sem pg, sem ioredis, sem prisma client)

**Documentacao:**
- [ ] CLAUDE.md atualizado com descricao do modulo scheduling e como executar testes
- [ ] Referencia a `docs/08-algoritmo-escala.md`

**Status:** Nao iniciado

---

## Half-Loop 09: Integracao API -> algoritmo -> DB + Celery

**Objetivo:** Conectar o algoritmo puro (HL-08) ao banco de dados e a fila Celery, criando o endpoint de geracao de escala que busca dados do Prisma, chama o gerador, persiste o resultado, e opcionalmente delega para o worker Celery para execucao assincrona.

**Dependencias:** Half-loops 08, 07, 06

**Entregaveis:**
- [ ] `backend/src/routes/schedule.routes.ts` -- endpoint POST `/api/schedules/generate` e GET `/api/schedules`, GET `/api/schedules/:id`
- [ ] `backend/src/services/schedule.service.ts` -- orquestra: busca dados do Prisma, monta GeneratorInput, chama gerador, persiste ScheduleAssignment, registra auditoria
- [ ] `backend/src/services/audit.service.ts` -- persistencia de ScheduleAuditLog
- [ ] `worker/tasks.py` atualizado -- tarefa `generate_schedule` que chama a API interna ou executa logica equivalente
- [ ] `worker/scheduling.py` -- ponte entre Celery e o algoritmo (chamada HTTP ao backend ou reimplementacao simplificada)

**Teste:**
- [ ] POST `/api/schedules/generate` com periodo e lista de celebracoes retorna escala em DRAFT
- [ ] Escala gerada contem atribuicoes para cada vaga de cada celebracao (ou conflitos)
- [ ] ScheduleAuditLog registra cada decisao do algoritmo
- [ ] GET `/api/schedules/:id` retorna escala com atribuicoes e conflitos
- [ ] Geracao assincrona via Celery enfileira e processa corretamente
- [ ] Apenas COORDINATOR+ pode gerar escalas
- [ ] `docker compose up --build` funciona sem erros
- [ ] Regressao: endpoints de celebracoes e acolitos continuam funcionando

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de escalas, fluxo de geracao sincrono e assincrono
- [ ] Referencia a `docs/06-arquitetura.md` (fluxo de geracao assincrona)

**Status:** Nao iniciado

---

## Half-Loop 10: UI de geracao de escala (wizard)

**Objetivo:** Criar a interface de usuario para o fluxo de geracao de escala, com um assistente passo-a-passo (wizard) que guia o coordenador na selecao do periodo, celebracoes, e revisao do resultado gerado.

**Dependencias:** Half-loops 09, 03

**Entregaveis:**
- [ ] `frontend/src/pages/escala-nova.tsx` -- wizard de geracao com 3 etapas: selecao de periodo, selecao de celebracoes, revisao do resultado
- [ ] `frontend/src/pages/escalas.tsx` -- listagem de escalas com filtros por status (DRAFT, PUBLISHED, ARCHIVED)
- [ ] `frontend/src/pages/escala-detalhe.tsx` -- visualizacao completa da escala gerada com grade de atribuicoes
- [ ] `frontend/src/components/schedule/schedule-grid.tsx` -- grade visual: celebracoes nas linhas, funcoes nas colunas, acolitos nas celulas
- [ ] `frontend/src/components/schedule/conflict-indicator.tsx` -- indicador visual de conflitos (icone + tooltip com descricao)
- [ ] `frontend/src/components/schedule/assignment-badge.tsx` -- badge de atribuicao (nome do acolito, pontuacao, status travado/destravado)

**Teste:**
- [ ] Wizard navega entre etapas (periodo -> celebracoes -> resultado) sem perder estado
- [ ] Selecao de periodo filtra celebracoes disponiveis
- [ ] Botao "Gerar" chama API e exibe loading enquanto processa
- [ ] Grade de escala exibe atribuicoes corretas apos geracao
- [ ] Conflitos aparecem com indicador visual claro e descricao legivel
- [ ] Listagem de escalas exibe escalas com filtros por status
- [ ] Detalhe da escala exibe todas as atribuicoes organizadas
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com telas de escala
- [ ] Referencia a `docs/12-mapa-telas.md` e `docs/05-fluxos-usuario.md`

**Status:** Nao iniciado

---

## Half-Loop 11: Resolucao de conflitos + substituicao manual

**Objetivo:** Implementar a interface e API para que o coordenador resolva conflitos gerados pelo algoritmo, faca substituicoes manuais de acolitos, trave/destrave atribuicoes, e re-gere a escala preservando atribuicoes travadas.

**Dependencias:** Half-loops 10, 09

**Entregaveis:**
- [ ] `backend/src/routes/schedule.routes.ts` (adicao) -- endpoints POST `/api/schedules/:id/assignments`, PATCH `/api/schedules/:id/assignments/:assignmentId`, DELETE `/api/schedules/:id/assignments/:assignmentId`
- [ ] `backend/src/services/schedule.service.ts` (adicao) -- logica de atribuicao manual, troca, travamento/destravamento, re-geracao parcial
- [ ] `frontend/src/components/schedule/conflict-resolver.tsx` -- painel de resolucao: lista conflitos com sugestoes de acao e selecao manual de acolito
- [ ] `frontend/src/components/schedule/assignment-editor.tsx` -- editor inline de atribuicao: trocar acolito, travar/destravar
- [ ] `frontend/src/components/shared/confirm-dialog.tsx` -- dialogo de confirmacao reutilizavel
- [ ] `frontend/src/hooks/use-confirm.ts` -- hook para dialogo de confirmacao

**Teste:**
- [ ] POST `/api/schedules/:id/assignments` adiciona atribuicao manual a vaga vazia
- [ ] PATCH `/api/schedules/:id/assignments/:id` troca acolito de uma atribuicao
- [ ] PATCH com `locked: true` trava atribuicao (preservada em re-geracao)
- [ ] DELETE remove atribuicao (vaga volta a ficar vazia)
- [ ] Re-geracao da escala preserva atribuicoes travadas
- [ ] Painel de conflitos lista todos os conflitos com tipo e descricao
- [ ] Coordenador consegue selecionar acolito manualmente para resolver conflito
- [ ] Confirmacao exigida antes de operacoes destrutivas (remover, re-gerar)
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com fluxo de resolucao de conflitos
- [ ] Referencia a `docs/17-fallback-manual.md` e `docs/04-regras-negocio.md`

**Status:** Nao iniciado

---

## Fase 4 -- Distribuicao

---

## Half-Loop 12: Publicacao + tokens de compartilhamento

**Objetivo:** Implementar o fluxo de publicacao de escalas (transicao DRAFT -> PUBLISHED -> ARCHIVED) e a geracao de tokens unicos para compartilhamento publico sem autenticacao.

**Dependencias:** Half-loops 11, 09

**Entregaveis:**
- [ ] `backend/src/routes/schedule.routes.ts` (adicao) -- endpoint POST `/api/schedules/:id/publish`, PATCH `/api/schedules/:id` (status)
- [ ] `backend/src/services/schedule.service.ts` (adicao) -- logica de publicacao: validar que nao ha conflitos nao resolvidos, gerar token nanoid, transicao de status
- [ ] `backend/src/lib/tokens.ts` -- geracao de tokens seguros com nanoid
- [ ] `backend/package.json` atualizado com: `nanoid`
- [ ] `frontend/src/components/schedule/publish-panel.tsx` -- painel de publicacao: validacao pre-publicacao, botao publicar, exibicao do link publico com token
- [ ] `frontend/src/components/shared/copy-button.tsx` -- botao de copiar link para a area de transferencia

**Teste:**
- [ ] POST `/api/schedules/:id/publish` transiciona escala de DRAFT para PUBLISHED
- [ ] Publicacao gera token unico (nanoid) e retorna URL publica
- [ ] Publicacao rejeita escala com conflitos nao resolvidos (vagas vazias)
- [ ] PATCH `/api/schedules/:id` com status ARCHIVED arquiva escala publicada
- [ ] Nao e possivel editar atribuicoes de escala PUBLISHED (somente leitura)
- [ ] Painel de publicacao exibe checklist de validacao antes de publicar
- [ ] Link publico e copiavel com feedback visual
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com fluxo de publicacao e tokens
- [ ] Referencia a `docs/04-regras-negocio.md` (transicao de status)

**Status:** Nao iniciado

---

## Half-Loop 13: Pagina publica de escala

**Objetivo:** Criar a pagina publica acessivel sem autenticacao via token, onde qualquer pessoa pode consultar a escala publicada, exibindo apenas primeiro nome dos acolitos por privacidade.

**Dependencias:** Half-loop 12

**Entregaveis:**
- [ ] `backend/src/routes/public.routes.ts` -- endpoints GET `/api/public/schedules/:token`, GET `/api/public/schedules/:token/period`
- [ ] `backend/src/services/public.service.ts` -- logica de consulta publica: validar token, retornar escala com primeiro nome apenas
- [ ] `frontend/src/pages/escala-publica.tsx` -- pagina publica com layout limpo (sem sidebar, sem auth), grade de escala somente leitura
- [ ] `frontend/src/components/schedule/public-schedule-view.tsx` -- visualizacao publica: grade simplificada, responsiva, impressao amigavel

**Teste:**
- [ ] GET `/api/public/schedules/:token` retorna escala com dados publicos (primeiro nome apenas)
- [ ] Token invalido retorna 404
- [ ] Escala nao publicada retorna 404 (mesmo com token valido de draft)
- [ ] Pagina publica renderiza sem sidebar e sem necessidade de login
- [ ] Pagina publica exibe apenas primeiro nome dos acolitos
- [ ] Layout e responsivo e amigavel para impressao
- [ ] Rota `/p/:token` funciona corretamente no frontend
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com rota publica e API publica
- [ ] Referencia a `docs/09-especificacao-api.md` (endpoints publicos)

**Status:** Nao iniciado

---

## Half-Loop 14: Visualizacoes (por data, pessoa, funcao)

**Objetivo:** Implementar visualizacoes alternativas da escala: por data (quem serve em cada dia), por pessoa (calendario individual do acolito), e por funcao (quem esta em cada funcao ao longo do periodo).

**Dependencias:** Half-loops 10, 05

**Entregaveis:**
- [ ] `frontend/src/pages/escala-detalhe.tsx` (adicao) -- abas ou toggles para alternar entre visualizacoes: grade, por data, por pessoa, por funcao
- [ ] `frontend/src/components/schedule/view-by-date.tsx` -- visualizacao por data: cards agrupados por dia com celebracoes e acolitos
- [ ] `frontend/src/components/schedule/view-by-person.tsx` -- visualizacao por pessoa: selecao de acolito, calendario com dias em que serve
- [ ] `frontend/src/components/schedule/view-by-function.tsx` -- visualizacao por funcao: selecao de funcao, lista de acolitos escalados
- [ ] `backend/src/routes/server.routes.ts` (adicao) -- endpoint GET `/api/servers/:id/history` para historico de servicos do acolito
- [ ] `frontend/src/pages/meu-historico.tsx` -- tela para o acolito ver seu proprio historico de escalas

**Teste:**
- [ ] Visualizacao por data agrupa corretamente celebracoes e acolitos por dia
- [ ] Visualizacao por pessoa exibe calendario individual com dias marcados
- [ ] Visualizacao por funcao lista acolitos por funcao ao longo do periodo
- [ ] Alternancia entre visualizacoes preserva a escala selecionada
- [ ] GET `/api/servers/:id/history` retorna historico paginado de servicos
- [ ] Tela meu-historico exibe historico do acolito logado
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com visualizacoes disponiveis
- [ ] Referencia a `docs/12-mapa-telas.md`

**Status:** Nao iniciado

---

## Fase 5 -- Responsaveis e Administracao

---

## Half-Loop 15: Vinculo responsavel<->acolito

**Objetivo:** Implementar o sistema de vinculo entre responsaveis (pais/tutores) e acolitos, permitindo que o responsavel visualize a escala e disponibilidade dos seus acolitos vinculados.

**Dependencias:** Half-loops 02, 05

**Entregaveis:**
- [ ] `backend/src/routes/guardian.routes.ts` -- endpoints GET `/api/guardians`, GET `/api/guardians/:id/acolytes`, POST `/api/guardians/:id/link`
- [ ] `backend/src/services/guardian.service.ts` -- logica de listagem de responsaveis, vinculacao de acolitos, validacao de permissoes
- [ ] `backend/src/validators/guardian.schema.ts` -- schema Zod para vinculacao
- [ ] `frontend/src/pages/responsaveis.tsx` -- listagem de responsaveis com seus acolitos vinculados (COORDINATOR+)
- [ ] `frontend/src/components/guardian/guardian-acolytes.tsx` -- painel de acolitos vinculados a um responsavel
- [ ] Atualizacao da sidebar para exibir itens de responsavel quando papel e GUARDIAN

**Teste:**
- [ ] POST `/api/guardians/:id/link` vincula acolito a responsavel (somente COORDINATOR+)
- [ ] GET `/api/guardians/:id/acolytes` retorna acolitos vinculados
- [ ] GUARDIAN ve apenas acolitos vinculados a si
- [ ] GUARDIAN consegue ver escala e disponibilidade dos seus acolitos
- [ ] GUARDIAN nao consegue editar dados de outros acolitos
- [ ] Listagem de responsaveis funciona para COORDINATOR+
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de responsaveis e regras de vinculo
- [ ] Referencia a `docs/03-perfis-permissoes.md` e `docs/04-regras-negocio.md`

**Status:** Nao iniciado

---

## Half-Loop 16: Painel administrativo + gestao de usuarios

**Objetivo:** Implementar o painel administrativo completo com gestao de usuarios (listar, editar papel, desativar), visao geral do sistema, e controles de administracao.

**Dependencias:** Half-loops 02, 04

**Entregaveis:**
- [ ] `backend/src/routes/admin.routes.ts` (adicao) -- endpoints GET `/api/admin/users`, PATCH `/api/admin/users/:id/role`
- [ ] `backend/src/routes/user.routes.ts` -- endpoints GET `/api/users`, GET `/api/users/:id`, PATCH `/api/users/:id`, DELETE `/api/users/:id`
- [ ] `backend/src/services/admin.service.ts` -- logica de gestao de usuarios, mudanca de papel, protecao do ultimo ADMIN
- [ ] `frontend/src/pages/admin.tsx` -- dashboard administrativo com visao geral (total de usuarios, escalas, celebracoes)
- [ ] `frontend/src/pages/admin-usuarios.tsx` -- listagem de usuarios com filtros por papel, edicao de papel, desativacao
- [ ] `frontend/src/pages/coordenacao.tsx` -- painel do coordenador com acesso rapido a funcoes mais usadas

**Teste:**
- [ ] GET `/api/admin/users` retorna lista completa de usuarios para ADMIN
- [ ] PATCH `/api/admin/users/:id/role` altera papel do usuario
- [ ] Protecao do ultimo ADMIN: nao permite rebaixar o unico ADMIN
- [ ] DELETE `/api/users/:id` realiza exclusao logica (soft delete)
- [ ] Dashboard admin exibe metricas basicas (contadores)
- [ ] Listagem de usuarios filtra por papel e permite busca por nome
- [ ] Apenas ADMIN acessa gestao de usuarios
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de admin e gestao de usuarios
- [ ] Referencia a `docs/03-perfis-permissoes.md` (matriz RBAC)

**Status:** Nao iniciado

---

## Half-Loop 17: Auditoria + estatisticas + configuracoes

**Objetivo:** Implementar o log de auditoria global, dashboard de estatisticas (distribuicao de servicos, acolitos mais/menos escalados), e tela de configuracoes do sistema (pesos do algoritmo, dados da paroquia).

**Dependencias:** Half-loops 16, 09

**Entregaveis:**
- [ ] `backend/src/routes/admin.routes.ts` (adicao) -- endpoints GET `/api/admin/audit-log`, GET `/api/admin/stats`
- [ ] `backend/src/services/audit.service.ts` (adicao) -- consulta de logs com filtros por periodo, tipo de acao, usuario
- [ ] `backend/src/services/stats.service.ts` -- calculo de estatisticas: servicos por acolito, distribuicao por funcao, taxa de conflitos
- [ ] `frontend/src/pages/admin-auditoria.tsx` -- tela de auditoria com listagem paginada e filtros
- [ ] `frontend/src/components/admin/stats-dashboard.tsx` -- dashboard com graficos/tabelas de estatisticas
- [ ] `frontend/src/components/admin/settings-panel.tsx` -- painel de configuracoes: pesos do algoritmo (contagem, rotacao, intervalo), dados da paroquia

**Teste:**
- [ ] GET `/api/admin/audit-log` retorna logs paginados com filtros
- [ ] GET `/api/admin/stats` retorna estatisticas calculadas corretamente
- [ ] Log de auditoria registra acoes: geracao de escala, publicacao, edicao de atribuicao, mudanca de papel
- [ ] Dashboard de estatisticas exibe distribuicao de servicos por acolito
- [ ] Configuracoes de pesos do algoritmo sao salvas e aplicadas na proxima geracao
- [ ] Apenas ADMIN acessa auditoria e configuracoes
- [ ] Apenas COORDINATOR+ acessa estatisticas
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com endpoints de auditoria, estatisticas e configuracoes
- [ ] Referencia a `docs/08-algoritmo-escala.md` (pesos configuraveis)

**Status:** Nao iniciado

---

## Fase 6 -- Polimento

---

## Half-Loop 18: Responsividade mobile + acessibilidade

**Objetivo:** Garantir que toda a aplicacao funcione bem em dispositivos moveis (celular e tablet) e atenda criterios basicos de acessibilidade (navegacao por teclado, leitores de tela, contraste).

**Dependencias:** Half-loops 03 e todos os half-loops que produzem telas de UI (04-07, 10-11, 13-17)

**Entregaveis:**
- [ ] `frontend/src/components/layout/sidebar.tsx` (revisao) -- sidebar colapsavel em mobile (drawer/sheet), botao hamburger
- [ ] `frontend/src/components/layout/topbar.tsx` (revisao) -- topbar adaptada para mobile
- [ ] Revisao de todas as paginas para breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- [ ] Revisao de todas as tabelas para scroll horizontal ou layout de cards em mobile
- [ ] Revisao de todos os formularios para layout em coluna unica em mobile
- [ ] Revisao de componentes de calendario para toque (touch-friendly)
- [ ] Auditoria de acessibilidade: roles ARIA, labels em campos, foco visivel, contraste minimo 4.5:1
- [ ] `frontend/src/components/shared/skip-link.tsx` -- link "pular para conteudo" para navegacao por teclado

**Teste:**
- [ ] Todas as paginas renderizam corretamente em viewport de 375px (iPhone SE)
- [ ] Sidebar colapsa em drawer no mobile e abre/fecha por gesto ou botao
- [ ] Tabelas tem scroll horizontal ou layout alternativo em mobile
- [ ] Formularios ocupam largura total em mobile
- [ ] Calendario de disponibilidade e usavel por toque
- [ ] Navegacao por teclado (Tab, Enter, Escape) funciona em todos os fluxos
- [ ] Leitores de tela conseguem navegar pelos elementos principais
- [ ] Contraste de texto atende WCAG 2.1 AA (ratio minimo 4.5:1)
- [ ] `docker compose up --build` funciona sem erros

**Documentacao:**
- [ ] CLAUDE.md atualizado com breakpoints e padroes de acessibilidade adotados
- [ ] Referencia a `docs/11-design-system.md`

**Status:** Nao iniciado

---

## Half-Loop 19: Testes E2E + documentacao final

**Objetivo:** Escrever testes end-to-end que cobrem os fluxos criticos do sistema, atualizar toda a documentacao para refletir o estado final do projeto, e garantir que o sistema esta pronto para uso.

**Dependencias:** Todos os half-loops anteriores (01-18)

**Entregaveis:**
- [ ] `backend/vitest.config.ts` ou `backend/jest.config.ts` -- configuracao de testes (se nao existir)
- [ ] `e2e/` ou `tests/` -- diretorio de testes E2E
- [ ] `e2e/auth.test.ts` -- fluxo completo: cadastro -> login -> acesso ao painel -> logout
- [ ] `e2e/schedule-generation.test.ts` -- fluxo: criar celebracoes -> definir disponibilidade -> gerar escala -> resolver conflitos -> publicar
- [ ] `e2e/public-access.test.ts` -- fluxo: acessar escala publica via token -> verificar dados exibidos
- [ ] `e2e/rbac.test.ts` -- verificar que cada papel so acessa o que deve
- [ ] `e2e/availability.test.ts` -- fluxo: marcar indisponibilidade -> verificar que algoritmo respeita
- [ ] `.env.example` -- arquivo de exemplo com todas as variaveis de ambiente documentadas
- [ ] `CLAUDE.md` -- reescrita final com arquitetura completa, todos os endpoints, estrutura de pastas atualizada, comandos
- [ ] `docs/00-plano-mestre.md` revisado com status final de cada documento

**Teste:**
- [ ] Todos os testes E2E passam em ambiente Docker limpo (`docker compose down -v && docker compose up --build`)
- [ ] Fluxo de cadastro e login funciona ponta a ponta
- [ ] Fluxo de geracao de escala funciona ponta a ponta
- [ ] Fluxo de publicacao e acesso publico funciona ponta a ponta
- [ ] RBAC impede acesso indevido em todos os cenarios testados
- [ ] Algoritmo respeita indisponibilidades nos testes
- [ ] Nenhuma regressao em funcionalidades existentes
- [ ] `docker compose up --build` sobe do zero sem erros
- [ ] CLAUDE.md reflete com precisao o estado final do sistema
- [ ] Todos os 20 documentos em `docs/` estao consistentes com a implementacao

**Documentacao:**
- [ ] CLAUDE.md reescrito com estado final completo
- [ ] `docs/00-plano-mestre.md` atualizado com verificacao final
- [ ] `.env.example` criado com todas as variaveis documentadas
- [ ] Este documento (`docs/20-plano-half-loops.md`) atualizado com status final de cada half-loop

**Status:** Nao iniciado

---

## Resumo de progresso

| HL | Titulo | Fase | Status |
|----|--------|------|--------|
| 01 | Setup Prisma + schema + migracao + seed | 1 - Fundacao | Nao iniciado |
| 02 | Autenticacao JWT | 1 - Fundacao | Nao iniciado |
| 03 | Layout base (Tailwind + shadcn/ui + tema + sidebar + routing) | 1 - Fundacao | Nao iniciado |
| 04 | CRUD funcoes liturgicas (admin) | 2 - Dominio Central | Nao iniciado |
| 05 | Perfil de acolito + qualificacoes | 2 - Dominio Central | Nao iniciado |
| 06 | Calendario de disponibilidade | 2 - Dominio Central | Nao iniciado |
| 07 | CRUD celebracoes + requisitos | 2 - Dominio Central | Nao iniciado |
| 08 | Algoritmo de geracao (TypeScript puro, zero I/O) | 3 - Motor de Escala | Nao iniciado |
| 09 | Integracao API -> algoritmo -> DB + Celery | 3 - Motor de Escala | Nao iniciado |
| 10 | UI de geracao de escala (wizard) | 3 - Motor de Escala | Nao iniciado |
| 11 | Resolucao de conflitos + substituicao manual | 3 - Motor de Escala | Nao iniciado |
| 12 | Publicacao + tokens de compartilhamento | 4 - Distribuicao | Nao iniciado |
| 13 | Pagina publica de escala | 4 - Distribuicao | Nao iniciado |
| 14 | Visualizacoes (por data, pessoa, funcao) | 4 - Distribuicao | Nao iniciado |
| 15 | Vinculo responsavel<->acolito | 5 - Responsaveis e Admin | Nao iniciado |
| 16 | Painel administrativo + gestao de usuarios | 5 - Responsaveis e Admin | Nao iniciado |
| 17 | Auditoria + estatisticas + configuracoes | 5 - Responsaveis e Admin | Nao iniciado |
| 18 | Responsividade mobile + acessibilidade | 6 - Polimento | Nao iniciado |
| 19 | Testes E2E + documentacao final | 6 - Polimento | Nao iniciado |
