# Escala Litúrgica — Plano Mestre de Planejamento e Documentação

## Contexto

O projeto **Liturgix** é um sistema de geração automática de escalas para acólitos e funções litúrgicas em igrejas. O objetivo é permitir que acólitos informem disponibilidade, coordenadoras gerem escalas justas e auditáveis, e que escalas sejam consultadas publicamente.

Já existe um scaffold em `/home/rian/Projects/Liturgix/` com:
- **Backend**: Fastify 5 + TypeScript (ES2022, NodeNext) — apenas health check
- **Frontend**: React 19 + Vite 6 — apenas health check display
- **Worker**: Celery (Python 3.12) + Redis broker
- **DB**: PostgreSQL 16 Alpine via Docker
- **Redis**: Redis 7 Alpine via Docker
- **Infra**: Docker Compose com healthchecks, rede bridge, volumes persistentes

**Esta fase é exclusivamente de planejamento e documentação.** Nenhum código será escrito. O resultado será uma base documental robusta, pronta para validação, que servirá como fundação para os half-loops de desenvolvimento.

---

## Decisão de Arquitetura: Manter Stack Existente

O projeto já tem uma decisão de stack tomada. Vamos respeitá-la e construir sobre ela:

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Servidor API | Fastify 5 (TypeScript) | Já configurado, performático, ecossistema de plugins maduro |
| Frontend | React 19 + Vite 6 + React Router | Já configurado, SPA com proxy para API em dev |
| ORM | Prisma (a adicionar) | Type-safe, migração controlada, schema como documentação |
| Autenticação | JWT via @fastify/jwt + bcrypt | Simples, sem dependência externa, alinhado com requisito |
| Biblioteca UI | Tailwind CSS + shadcn/ui (adaptado p/ Vite) | Componentes owned, customizáveis para estética eclesiástica |
| Tarefas em segundo plano | Celery (Python) via Redis | Já configurado, ideal para geração assíncrona de escalas |
| Banco de dados | PostgreSQL 16 | Já configurado, relacional, ideal para o domínio |
| Cache/Fila | Redis 7 | Já configurado, broker do Celery + cache de sessões |
| Infraestrutura | Docker Compose | Já configurado com healthchecks e volumes |
| Validação | Zod | Validação de schemas no backend e frontend |

---

## Documentos a Produzir

A fase de planejamento entregará os seguintes documentos, organizados em `docs/` dentro do projeto:

### 1. `docs/01-visao-geral.md` — Visão Geral do Produto
- Propósito do sistema
- Problema que resolve
- Público-alvo
- Premissas assumidas
- Escopo v1.0

### 2. `docs/02-escopo-funcional.md` — Escopo Funcional
- Features por módulo (auth, acólitos, celebrações, escalas, admin)
- O que está DENTRO e FORA do v1.0
- Critérios de aceite por feature

### 3. `docs/03-perfis-permissoes.md` — Perfis e Permissões
- 4 papéis: ACOLYTE, GUARDIAN, COORDINATOR, ADMIN
- Matriz RBAC completa (recurso x ação x papel)
- Regras de escopo (row-level): acólito vê só o seu, responsável vê vinculados
- Proteção do último ADMIN

### 4. `docs/04-regras-negocio.md` — Regras de Negócio
- Regras rígidas (nunca violar): sem duplicata no dia, respeitar indisponibilidade, só funções habilitadas
- Regras flexíveis (otimizar): equilíbrio de serviços, rotação de funções, intervalo recente
- Regras de validação de dados
- Regras de transição de status (DRAFT → PUBLISHED → ARCHIVED)
- Regras de vínculo responsável-acólito

### 5. `docs/05-fluxos-usuario.md` — Fluxos do Usuário
- Fluxo de cadastro (acólito, responsável)
- Fluxo de login
- Fluxo de marcar indisponibilidade
- Fluxo de gerar escala (coordenadora)
- Fluxo de resolver conflito
- Fluxo de publicar escala
- Fluxo de consultar escala pública
- Fluxo de administração

### 6. `docs/06-arquitetura.md` — Arquitetura do Sistema
- Diagrama de serviços (Fastify ↔ PostgreSQL ↔ Redis ↔ Celery)
- Responsabilidades de cada serviço
- Fluxo de requisição (frontend → API → DB/Redis → resposta)
- Fluxo de geração assíncrona (API → fila Redis → Celery worker → DB)
- Estratégia de autenticação JWT
- CORS e segurança
- Estrutura de plugins Fastify

### 7. `docs/07-modelagem-dados.md` — Modelagem de Dados
- Schema Prisma completo com todas as entidades:
  - User (com enum de papéis)
  - GuardianLink (muitos-para-muitos responsável↔acólito)
  - LiturgicalFunction (9 funções iniciais, configurável)
  - UserFunction (qualificações do acólito)
  - Unavailability (datas indisponíveis)
  - Celebration (com enum CelebrationType)
  - CelebrationFunctionRequirement (funções necessárias por celebração)
  - Schedule (DRAFT/PUBLISHED/ARCHIVED)
  - ScheduleAssignment (com pontuação e dados de auditoria em JSON)
  - ServiceRecord (histórico real de serviço)
  - ScheduleAuditLog (trilha de auditoria)
- Relacionamentos e índices
- Convenção: camelCase no Prisma, snake_case no PostgreSQL via @map
- Dados iniciais para funções litúrgicas
- Diagrama ER textual

### 8. `docs/08-algoritmo-escala.md` — Especificação da Geração Automática
- Estratégia: satisfação de restrições gulosa com pontuação ponderada
- Fórmula de pontuação:
  ```
  pontuacaoTotal = (0.50 * pontuacaoContagem) + (0.30 * pontuacaoRotacao) + (0.20 * pontuacaoIntervalo)
  ```
  - pontuacaoContagem: inverso linear do total de serviços (0-100)
  - pontuacaoRotacao: dias desde a última vez nesta função (0-100, limite 28 dias)
  - pontuacaoIntervalo: dias desde o último serviço qualquer (0-100, limite 14 dias)
- Ordem de processamento: celebrações cronológicas, vagas por restrição (mais restrita primeiro)
- Desempate: menos serviços totais → mais dias desde último serviço → alfabético (determinismo)
- Pesos configuráveis por paróquia (tabela scheduling_config)
- 5 tipos de conflito: SEM_CANDIDATOS, CANDIDATOS_INSUFICIENTES, SOBRECARGA_CANDIDATO_UNICO, TODOS_INDISPONIVEIS, LACUNA_QUALIFICACAO
- Cada conflito com descrição legível e ações sugeridas
- Vagas não resolvidas ficam com userId NULL, escala permanece DRAFT
- Sistema de travamento/destravamento para preservar atribuições manuais durante re-geração
- Pseudocódigo do loop principal
- Trilha de auditoria: cada candidato para cada vaga recebe entrada de auditoria (selecionado ou rejeitado com razão)
- Início frio: acólitos novos recebem pontuação 100 em todos os critérios
- Casos extremos documentados

### 9. `docs/09-especificacao-api.md` — Especificação de API
- Convenção: backend em inglês, REST, JSON
- Endpoints organizados por domínio:

**Autenticação (4 endpoints)**:
- POST /api/auth/register — cadastro (apenas ACOLYTE/GUARDIAN)
- POST /api/auth/login — autenticação → JWT
- POST /api/auth/logout — invalidar token via lista negra no Redis
- GET /api/auth/me — perfil do usuário autenticado

**Usuários (4 endpoints)**:
- GET /api/users — listar (COORDINATOR+)
- GET /api/users/:id — detalhe
- PATCH /api/users/:id — editar
- DELETE /api/users/:id — exclusão lógica (ADMIN)

**Acólitos (7 endpoints)**:
- GET /api/servers — listar acólitos
- GET /api/servers/:id — detalhe
- GET /api/servers/:id/availability — indisponibilidades por período
- PUT /api/servers/:id/availability — definir indisponibilidades (substituição no período)
- GET /api/servers/:id/functions — funções habilitadas
- PUT /api/servers/:id/functions — definir funções (COORDINATOR+)
- GET /api/servers/:id/history — histórico de serviços

**Responsáveis (3 endpoints)**:
- GET /api/guardians — listar responsáveis (COORDINATOR+)
- GET /api/guardians/:id/acolytes — acólitos vinculados
- POST /api/guardians/:id/link — vincular acólito (COORDINATOR+)

**Celebrações (6 endpoints)**:
- GET /api/celebrations — listar com filtros
- POST /api/celebrations — criar (COORDINATOR+)
- GET /api/celebrations/:id — detalhe
- PATCH /api/celebrations/:id — editar
- DELETE /api/celebrations/:id — exclusão lógica
- PUT /api/celebrations/:id/requirements — definir funções necessárias

**Escalas (9 endpoints)**:
- GET /api/schedules — listar (ACOLYTE/GUARDIAN só veem PUBLISHED)
- POST /api/schedules/generate — gerar automaticamente
- GET /api/schedules/:id — detalhe com atribuições
- PATCH /api/schedules/:id — editar metadados/status
- POST /api/schedules/:id/publish — publicar
- POST /api/schedules/:id/assignments — adicionar atribuição manual
- PATCH /api/schedules/:id/assignments/:assignmentId — editar/trocar
- DELETE /api/schedules/:id/assignments/:assignmentId — remover
- GET /api/schedules/:id/audit — trilha de auditoria

**Público (2 endpoints)**:
- GET /api/public/schedules/:token — escala pública (sem auth, só primeiro nome)
- GET /api/public/schedules/:token/period — escalas do período

**Administração (7 endpoints)**:
- GET /api/admin/users — lista completa com gestão
- PATCH /api/admin/users/:id/role — mudar papel
- GET /api/admin/functions — listar funções (incluindo inativas)
- POST /api/admin/functions — criar função
- PATCH /api/admin/functions/:id — editar função
- GET /api/admin/audit-log — log global
- GET /api/admin/stats — estatísticas

- Cada endpoint documentado com: método, caminho, objetivo, papel necessário, payload de requisição (interface TypeScript), resposta de sucesso, erros possíveis, regras de negócio
- Padrão de resposta: `{ success: true, data: T }` para mutações, `PaginatedResponse<T>` para listas
- Padrão de erro: `{ statusCode, error, message, details? }`

### 10. `docs/10-convencao-rotas.md` — Convenção de Rotas Frontend e Backend
- Frontend (português, sem acentos):
  - /login, /cadastro, /painel, /escalas, /escala/:id, /escala/nova
  - /celebracoes, /celebracao/:id, /celebracao/nova
  - /acolitos, /acolito/:id, /disponibilidade, /minhas-funcoes, /meu-historico
  - /responsaveis, /coordenacao, /admin, /admin/usuarios, /admin/funcoes, /admin/auditoria
  - /p/:token (escala pública)
- Backend (inglês): /api/auth/*, /api/users/*, /api/servers/*, etc.
- Mapeamento frontend↔backend para cada tela

### 11. `docs/11-design-system.md` — Design System
- Inspiração: clerical/eclesiástica — sobriedade, reverência, clareza
- Paleta de cores (oklch):
  - Fundo: branco quente (pergaminho envelhecido)
  - Primária: bordô profundo/vinho (vestes litúrgicas)
  - Destaque: dourado discreto (cálices, candelabros)
  - Texto: carvão escuro (não preto puro)
  - Suave: pergaminho discreto
- Tipografia:
  - Títulos: Crimson Pro (serifada, tradição)
  - Corpo: Inter (sem serifa, legibilidade)
  - Mono: JetBrains Mono
- Espaçamentos: sistema de 4px (4, 8, 12, 16, 24, 32, 48, 64)
- Raio de borda: 6px (contido, não arredondado demais)
- Sombras: sutis, sem elevação exagerada
- Estados: hover, foco, desabilitado, carregando, erro, sucesso
- Componentes base (shadcn/ui customizado):
  - Button, Card, Dialog, Table, campos de formulário, Select, Calendar, Badge, Toast
- Padrões de tela: lista com filtros, detalhe, formulário, calendário, grade de escala
- Modo claro como padrão (sem modo escuro inicialmente)

### 12. `docs/12-mapa-telas.md` — Mapa de Telas
- Wireframes textuais de cada tela principal
- Hierarquia de navegação (sidebar por papel)
- Fluxo entre telas
- Componentes usados em cada tela
- 23 telas mapeadas com proteção por papel

### 13. `docs/13-plano-implementacao.md` — Plano de Implementação por Etapas
- 6 fases sequenciais, cada uma um conjunto de half-loops:

**Fase 1 — Fundação** (3 half-loops):
1. Setup do Prisma + schema + migração + dados iniciais
2. Autenticação: JWT, registro, login, logout, perfil + middleware de papéis
3. Layout base: Tailwind + shadcn/ui + tema eclesiástico + sidebar + roteamento

**Fase 2 — Domínio Central** (4 half-loops):
4. CRUD de funções litúrgicas (admin)
5. Perfil de acólito + qualificações
6. Calendário de disponibilidade
7. CRUD de celebrações + requisitos

**Fase 3 — Motor de Escala** (4 half-loops):
8. Algoritmo de geração (TypeScript puro, sem I/O)
9. Integração: API → algoritmo → DB + worker Celery
10. UI de geração de escala (assistente passo-a-passo)
11. Resolução de conflitos + substituição manual

**Fase 4 — Distribuição** (3 half-loops):
12. Fluxo de publicação + tokens de compartilhamento
13. Página pública de escala + API pública
14. Visualizações: por data, por pessoa, por função

**Fase 5 — Responsáveis e Administração** (3 half-loops):
15. Vínculo responsável↔acólito + visualização
16. Painel administrativo + gestão de usuários + papéis
17. Auditoria + estatísticas + configurações

**Fase 6 — Polimento** (2 half-loops):
18. Responsividade mobile + acessibilidade
19. Testes E2E + documentação final

### 14. `docs/14-backlog.md` — Backlog Inicial
- Todas as histórias de usuário organizadas por fase
- Prioridade (obrigatório/desejável/opcional)
- Estimativa de complexidade relativa

### 15. `docs/15-criterios-aceite.md` — Critérios de Aceite
- Critérios por feature principal
- Cenários de teste para o algoritmo
- Cenários de conflito e fallback

### 16. `docs/16-riscos-decisoes.md` — Riscos e Decisões Técnicas
- Premissas assumidas (ex.: volume < 100 acólitos, < 50 celebrações/mês)
- Riscos: performance do algoritmo, cold start do Celery, falta de acólitos
- Decisões técnicas: por que Prisma e não SQL puro, por que JWT e não sessão, por que Celery e não BullMQ
- Trade-offs aceitos

### 17. `docs/17-fallback-manual.md` — Estratégia para Casos Ambíguos e Fallback Manual
- Quando o algoritmo não resolve
- Interface de resolução para a coordenadora
- Mecanismo de travamento/destravamento
- Troca entre acólitos
- Re-geração parcial

### 18. `docs/18-estrutura-pastas.md` — Estrutura de Pastas
- Organização do backend (plugins Fastify, rotas, serviços, escalonamento)
- Organização do frontend (páginas, componentes, hooks, lib, tipos)
- Convenções de nomenclatura

### 19. `docs/19-contexto-claude.md` — Padrão de Documentação Contínua
- Como manter CLAUDE.md atualizado
- Convenções para que o Claude sempre tenha contexto
- Mapa de dependências entre documentos

### 20. `docs/20-plano-half-loops.md` — Plano de Half-Loops
- Definição de half-loop para este projeto
- Regras: objetivo claro, docs atualizados, revisável
- Checklist por half-loop
- Critérios de completude

---

## Estrutura de Pastas do Projeto (Proposta)

```
Liturgix/
├── docs/                              # Documentação completa (20 documentos)
│   ├── 01-visao-geral.md
│   ├── ...
│   └── 20-plano-half-loops.md
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Schema completo
│   │   ├── migrations/                # Histórico de migrações
│   │   └── seed.ts                    # Dados iniciais (funções litúrgicas)
│   ├── src/
│   │   ├── server.ts                  # Ponto de entrada Fastify (refatorado em plugins)
│   │   ├── plugins/
│   │   │   ├── auth.ts                # @fastify/jwt + decoradores
│   │   │   ├── prisma.ts              # Plugin do Prisma client
│   │   │   └── cors.ts                # Configuração de CORS
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── server.routes.ts       # Endpoints de acólitos
│   │   │   ├── guardian.routes.ts
│   │   │   ├── celebration.routes.ts
│   │   │   ├── schedule.routes.ts
│   │   │   ├── public.routes.ts       # Acesso público às escalas
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── celebration.service.ts
│   │   │   ├── schedule.service.ts
│   │   │   └── audit.service.ts
│   │   ├── scheduling/                # TypeScript puro, zero I/O
│   │   │   ├── generator.ts           # Loop principal do algoritmo
│   │   │   ├── scoring.ts             # 3 funções de pontuação + combinação
│   │   │   ├── conflicts.ts           # Detecção de conflitos
│   │   │   ├── state.ts               # Estado mutável durante geração
│   │   │   └── types.ts               # Interfaces do algoritmo
│   │   ├── validators/                # Schemas Zod
│   │   │   ├── auth.schema.ts
│   │   │   ├── celebration.schema.ts
│   │   │   ├── schedule.schema.ts
│   │   │   └── availability.schema.ts
│   │   ├── middleware/
│   │   │   ├── auth.guard.ts          # Verifica JWT
│   │   │   └── role.guard.ts          # Verifica papel
│   │   ├── lib/
│   │   │   ├── db.ts                  # Singleton do Prisma client
│   │   │   ├── redis.ts               # Cliente Redis
│   │   │   └── tokens.ts              # nanoid para tokens públicos
│   │   └── types/
│   │       └── index.ts               # Tipos compartilhados
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # Ponto de entrada
│   │   ├── App.tsx                    # Configuração do roteador
│   │   ├── pages/                     # Telas (1 arquivo por rota)
│   │   │   ├── login.tsx
│   │   │   ├── cadastro.tsx
│   │   │   ├── painel.tsx
│   │   │   ├── escalas.tsx
│   │   │   ├── escala-detalhe.tsx
│   │   │   ├── escala-nova.tsx
│   │   │   ├── celebracoes.tsx
│   │   │   ├── celebracao-form.tsx
│   │   │   ├── acolitos.tsx
│   │   │   ├── acolito-detalhe.tsx
│   │   │   ├── disponibilidade.tsx
│   │   │   ├── meu-historico.tsx
│   │   │   ├── responsaveis.tsx
│   │   │   ├── coordenacao.tsx
│   │   │   ├── admin.tsx
│   │   │   ├── admin-usuarios.tsx
│   │   │   ├── admin-funcoes.tsx
│   │   │   ├── admin-auditoria.tsx
│   │   │   └── escala-publica.tsx     # /p/:token
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui base (código próprio)
│   │   │   ├── layout/               # Sidebar, Topbar, PageHeader
│   │   │   ├── schedule/             # GradeEscala, BadgeAtribuição, IndicadorConflito
│   │   │   ├── celebration/          # FormulárioCelebração, CardCelebração
│   │   │   ├── acolyte/              # CalendárioDisponibilidade, CardAcólito
│   │   │   ├── auth/                 # FormulárioLogin, FormulárioCadastro
│   │   │   └── shared/               # TabelaDados, EstadoVazio, EsqueletoCarregamento
│   │   ├── hooks/
│   │   │   ├── use-auth.ts           # Contexto de auth + gestão de JWT
│   │   │   ├── use-api.ts            # Wrapper de fetch com headers de auth
│   │   │   └── use-confirm.ts        # Diálogo de confirmação
│   │   ├── lib/
│   │   │   ├── api.ts                # Cliente de API tipado
│   │   │   ├── auth.tsx              # AuthProvider + RotaProtegida
│   │   │   └── cn.ts                 # Utilitário de classname
│   │   └── types/
│   │       └── index.ts              # Tipos compartilhados com o backend
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── components.json               # Configuração do shadcn/ui
│   └── package.json
│
├── worker/
│   ├── tasks.py                       # Tarefas Celery (geração de escala assíncrona)
│   ├── scheduling.py                  # Port do algoritmo TS → Python (ou chamada HTTP)
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
├── Dockerfile
├── .env
├── .env.example
└── CLAUDE.md                          # Contexto completo atualizado
```

---

## Abordagem de Execução

### Passo 1: Produzir todos os 20 documentos
Trabalhar documento por documento, usando subagentes em paralelo quando possível. Cada documento será revisado por consistência com os demais.

### Passo 2: Revisar coerência cruzada
Garantir que:
- Toda regra de negócio tem endpoint correspondente
- Todo endpoint tem tela correspondente
- Toda tela tem componentes identificados
- Todo campo do banco tem validação definida
- Toda permissão está na matriz RBAC

### Passo 3: Validação do usuário
Apresentar a base documental completa para revisão antes de iniciar qualquer half-loop de desenvolvimento.

---

## Verificação

Após a fase de documentação, verificar:
- [ ] Todos os 20 documentos existem e estão consistentes
- [ ] Schema Prisma cobre todas as entidades e relacionamentos
- [ ] API cobre todos os fluxos de usuário
- [ ] Matriz RBAC cobre todos os endpoints
- [ ] Algoritmo está especificado com fórmula, pesos, desempate, e casos extremos
- [ ] Design system tem paleta, tipografia, componentes, e padrões definidos
- [ ] Mapa de telas cobre todas as 23 rotas do frontend
- [ ] Plano de half-loops tem objetivos claros por etapa
- [ ] CLAUDE.md atualizado com arquitetura completa

---

## Arquivos Críticos Existentes

| Arquivo | Estado | Ação |
|---------|--------|------|
| `/home/rian/Projects/Liturgix/backend/src/server.ts` | Scaffold básico | Será refatorado em plugins |
| `/home/rian/Projects/Liturgix/backend/package.json` | Dependências mínimas | Adicionar prisma, @fastify/jwt, bcrypt, zod, nanoid |
| `/home/rian/Projects/Liturgix/frontend/src/App.tsx` | Health check | Será reescrito com roteador e tema |
| `/home/rian/Projects/Liturgix/frontend/package.json` | React + Vite | Adicionar tailwind, react-router, dependências do shadcn |
| `/home/rian/Projects/Liturgix/docker-compose.yml` | Funcional | Possivelmente adicionar serviço de migração |
| `/home/rian/Projects/Liturgix/CLAUDE.md` | Scaffold | Será reescrito com arquitetura completa |
| `/home/rian/Projects/Liturgix/worker/tasks.py` | Celery básico | Implementar tarefa de geração de escala |
