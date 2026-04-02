# Liturgix

Sistema de geração automática de escalas litúrgicas para acólitos em igrejas.

## Arquitetura

| Serviço | Stack | Porta | Função |
|---------|-------|-------|--------|
| **app** | Fastify 5 (TypeScript) + React 19 (Vite) | 3000 | API REST + SPA |
| **worker** | BullMQ (Node.js/TypeScript) | — | Geração assíncrona de escalas |
| **db** | PostgreSQL 16 Alpine | 5432 | Banco de dados |
| **redis** | Redis 7 Alpine | 6379 | Fila BullMQ + JWT blacklist |

Rede: `liturgix-net` (bridge). Todos com `restart: unless-stopped`.

## Estrutura do Projeto

```
├── docker-compose.yml          # 4 serviços: app, worker, db, redis
├── docker-compose.override.yml # Dev: frontend hot-reload
├── infra/
│   ├── Dockerfile              # Multi-stage: frontend → backend → produção
│   └── .dockerignore
├── .env                        # POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
├── docs/                       # 20 documentos de planejamento (00-20)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 11 modelos, 5 enums (Prisma 6)
│   │   ├── migrations/
│   │   └── seed.ts             # 9 funções litúrgicas
│   ├── src/
│   │   ├── server.ts           # Fastify: plugins + rotas
│   │   ├── worker.ts           # BullMQ worker: geração de escalas
│   │   ├── modules/            # Feature modules (rotas + validação)
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts    # register, login, logout, me
│   │   │   │   ├── auth.schema.ts    # Zod schemas
│   │   │   │   └── auth.guard.ts     # JWT verify + Redis blacklist
│   │   │   ├── admin/
│   │   │   │   └── admin.routes.ts   # CRUD funções, stats
│   │   │   ├── server/
│   │   │   │   └── server.routes.ts  # Acólitos: list, detail, functions
│   │   │   ├── availability/
│   │   │   │   └── availability.routes.ts
│   │   │   ├── celebration/
│   │   │   │   └── celebration.routes.ts
│   │   │   ├── schedule/
│   │   │   │   └── schedule.routes.ts
│   │   │   └── public/
│   │   │       └── public.routes.ts
│   │   ├── scheduling/         # Algoritmo puro (zero I/O)
│   │   │   ├── types.ts
│   │   │   ├── scoring.ts
│   │   │   ├── state.ts
│   │   │   ├── conflicts.ts
│   │   │   └── generator.ts
│   │   └── shared/
│   │       ├── lib/            # db.ts, redis.ts, liturgical-calendar.ts
│   │       ├── middleware/     # role.guard.ts (RBAC)
│   │       ├── plugins/       # auth.ts (@fastify/jwt), prisma.ts
│   │       └── types/         # JwtPayload + FastifyJWT augmentation
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx             # Router + AuthProvider
│   │   ├── index.css           # Tailwind + tema eclesiástico (oklch)
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/           # login, cadastro, AuthProvider, AuthLayout
│   │   │   ├── dashboard/      # painel
│   │   │   ├── escalas/        # lista, nova, detalhe, pública
│   │   │   ├── celebracoes/    # CRUD celebrações
│   │   │   ├── acolitos/       # lista, detalhe, histórico
│   │   │   ├── disponibilidade/
│   │   │   └── admin/          # funções, coordenação, responsáveis
│   │   └── shared/
│   │       ├── components/     # layout/ (AppLayout, Sidebar, ProtectedRoute) + ui/
│   │       ├── lib/            # api.ts, cn.ts, function-colors.ts, theme.tsx
│   │       └── types/
│   ├── vite.config.ts          # Proxy /api, Tailwind v4, path aliases
│   └── package.json
```

## Endpoints da API

**Auth (4):** POST register, login, logout; GET me
**Admin (4):** GET/POST/PATCH functions; GET stats
**Servers/Acólitos (5):** GET list, detail, functions, history; PUT functions
**Availability (2):** GET/PUT por período
**Celebrations (6):** GET list, detail; POST create; PATCH edit; DELETE soft; PUT requirements
**Schedules (8):** GET list, detail, audit; POST generate, publish, assignments; PATCH edit, assignments; DELETE assignments
**Public (1):** GET schedule by token

## Algoritmo de Escala

Greedy constraint-satisfaction com scoring ponderado:
- `totalScore = 0.50 * countScore + 0.30 * rotationScore + 0.20 * intervalScore`
- Roda no worker BullMQ (async), grava assignments no DB
- 5 tipos de conflito detectados
- Locked assignments preservados em re-geração

## Comandos

```bash
docker compose up --build -d     # Subir tudo
docker compose logs -f [app|worker|db|redis]
docker compose down              # Parar
docker compose down -v           # Parar + limpar volumes
```

## Variáveis de Ambiente

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (default: liturgix)
- `DATABASE_URL` — montada no compose
- `REDIS_URL` — `redis://redis:6379/0`
- `JWT_SECRET` — secret para JWT (default: dev-secret)
- `NODE_ENV` — `production` no container app

## Status de Implementação

| Half-Loop | Status |
|-----------|--------|
| HL-01: Prisma + Schema + Migração + Seed | ✅ |
| HL-02: Autenticação JWT | ✅ |
| HL-03: Layout base (Tailwind + Sidebar + Routing) | ✅ |
| HL-04: CRUD funções litúrgicas (admin) | ✅ |
| HL-05: Perfil de acólito + qualificações | ✅ |
| HL-06: Calendário de disponibilidade | ✅ |
| HL-07: CRUD celebrações + requisitos | ✅ |
| HL-08: Algoritmo de geração | ✅ |
| HL-09: Integração API → BullMQ worker → DB | ✅ |
| HL-10: UI de geração de escala | ⬜ |
| HL-11: Resolução de conflitos + manual | ⬜ |
| HL-12: Publicação + tokens | ✅ (backend) |
| HL-13: Página pública | ✅ (backend) |
| HL-14-19: Frontend remaining | ⬜ |

## Notas Técnicas

- Prisma 6 (não 7 — v7 requer adapter, complexidade desnecessária)
- Backend usa `{ Redis }` (named import) de ioredis
- Worker é Node.js/BullMQ (substituiu Celery/Python)
- Frontend é SPA React (Vite), sem Next.js — "use client" não se aplica
- Design System completo em `docs/design-system.md` — referência obrigatória para qualquer mudança visual
- Identidade visual: "Vitral Lateral Terroso" — borda de vitral, tons terrosos, dourado como acento
- Modo claro (areia #f3ece0) e modo escuro (#1a1210) com tokens semânticos
- 9 cores de função litúrgica com simbolismo (Paleta Simbólica Quente)
- Sidebar sempre escura (#2d1f14) com manchas de vitral, login sempre escuro
- Fontes: Crimson Pro (títulos) + Inter (corpo)
