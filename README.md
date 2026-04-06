# Liturgix

Liturgix é um sistema web para organizar escalas litúrgicas de acólitos em paróquias e comunidades católicas.

Na prática, coordenadores de liturgia precisam montar escalas de quem vai servir em cada celebração (missas, adorações, festas etc.), respeitando a disponibilidade de cada acólito, suas funções habilitadas (cerimoniário, turiferário, cruciferário...) e garantindo uma rotação justa. Fazer isso manualmente é trabalhoso e propenso a erros — alguém sempre acaba sobrecarregado ou esquecido.

O Liturgix automatiza esse processo: os acólitos informam sua disponibilidade pelo sistema, o coordenador cadastra as celebrações e seus requisitos, e um algoritmo gera a escala otimizada automaticamente. O resultado pode ser publicado com um link público para que todos consultem.

## Arquitetura

| Serviço | Stack | Porta |
|---------|-------|-------|
| **app** | Fastify 5 (TypeScript) + React 19 (Vite) | 3000 |
| **worker** | BullMQ (Node.js/TypeScript) | — |
| **db** | PostgreSQL 16 | 5432 |
| **redis** | Redis 7 | 6379 |

## Funcionalidades

- Autenticação JWT com blacklist via Redis
- CRUD de funções litúrgicas, celebrações e acólitos
- Calendário de disponibilidade por período
- Algoritmo de geração de escalas (greedy constraint-satisfaction com scoring ponderado)
- Worker assíncrono BullMQ para geração de escalas
- Publicação de escalas com token público
- Painel administrativo com coordenação e gestão de responsáveis
- Design system "Vitral Lateral Terroso" com modo claro/escuro

## Stack

- **Backend:** Fastify 5, Prisma 6, Zod, BullMQ
- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router
- **Infra:** Docker Compose, PostgreSQL 16, Redis 7

## Como rodar

```bash
# Copie e configure as variáveis de ambiente
cp .env.example .env

# Suba todos os serviços
docker compose up --build -d

# Acompanhe os logs
docker compose logs -f
```

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `POSTGRES_USER` | Usuário do PostgreSQL | liturgix |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | liturgix |
| `POSTGRES_DB` | Nome do banco | liturgix |
| `JWT_SECRET` | Secret para tokens JWT | dev-secret |
| `REDIS_URL` | URL do Redis | redis://redis:6379/0 |

## Algoritmo de Escala

Greedy constraint-satisfaction com scoring ponderado:

```
totalScore = 0.50 * countScore + 0.30 * rotationScore + 0.20 * intervalScore
```

- 5 tipos de conflito detectados
- Locked assignments preservados em re-geração
- Execução assíncrona via BullMQ worker

## Licença

MIT
