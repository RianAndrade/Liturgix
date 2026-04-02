# 16 — Riscos e Decisões Técnicas

## 1. Premissas Assumidas

O dimensionamento do sistema e todas as decisões técnicas foram baseadas nas seguintes premissas para a versão 1.0:

| # | Premissa | Implicação |
|---|----------|------------|
| P1 | Volume menor que 100 acólitos por paróquia | Algoritmo de escala não precisa de otimização pesada |
| P2 | Menos de 50 celebrações por mês | Carga no banco e no worker é baixa; PostgreSQL single-instance é suficiente |
| P3 | Paróquia única (multi-paróquia fora do v1.0) | Schema sem tenant isolation; simplifica auth e queries |
| P4 | Usuários com letramento digital básico (smartphone/computador) | UI deve ser simples e direta, sem fluxos complexos |
| P5 | Coordenadora é a principal power user | Funcionalidades avançadas concentradas no perfil COORDINATOR |
| P6 | Conexão com internet obrigatória (sem modo offline) | Sem service worker, sem cache local, sem sincronização |

**Riscos derivados das premissas:**
- Se uma paróquia ultrapassar 100 acólitos, o algoritmo de escala pode precisar de revisão (ver R1).
- Se o modo offline for exigido futuramente, a arquitetura SPA precisará de refatoração significativa (service worker, IndexedDB, estratégia de sync).

---

## 2. Matriz de Riscos

### 2.1 Classificação

- **Impacto**: Baixo / Médio / Alto
- **Probabilidade**: Baixa / Média / Alta
- **Severidade**: Impacto x Probabilidade (quanto maior, mais atenção)

### 2.2 Riscos Identificados

| ID | Risco | Impacto | Probabilidade | Severidade | Mitigação |
|----|-------|---------|---------------|------------|-----------|
| R1 | Performance do algoritmo com muitos acólitos | Médio | Baixa | Baixa | Algoritmo greedy é O(n*m), rápido para os volumes esperados. Monitorar tempo de execução no Celery; otimizar se necessário |
| R2 | Cold start do Celery worker | Baixo | Média | Baixa | Worker roda continuamente (`restart: unless-stopped`); healthcheck garante prontidão antes de receber tasks |
| R3 | Acólitos insuficientes para funções | Alto | Média | Alta | Detecção de conflitos com UI clara para resolução manual; alertas visuais na tela de escala; permitir gerar escala parcial |
| R4 | Resistência à adoção por parte dos usuários | Alto | Média | Alta | UI simples e intuitiva; link público de escala para consulta fácil (sem login); onboarding mínimo; comunicação via coordenadora |
| R5 | Perda de dados | Alto | Baixa | Média | PostgreSQL com volumes Docker persistentes; estratégia de backup regular (pg_dump agendado); soft delete para dados críticos |
| R6 | Roubo de token JWT | Médio | Baixa | Baixa | Expiração curta (15min access + refresh token); blacklist via Redis no logout; HTTPS obrigatório em produção |
| R7 | Ponto único de falha (coordenadora) | Médio | Média | Média | Role ADMIN também pode gerenciar escalas; sistema permite múltiplos usuários COORDINATOR por paróquia |

### 2.3 Riscos Aceitos (não mitigados na v1.0)

| Risco | Justificativa para aceitar |
|-------|---------------------------|
| Sem modo offline | Complexidade alta, baixa demanda para v1.0. Igrejas geralmente têm Wi-Fi |
| Sem notificações por e-mail | Escopo de v1.0 focado no core; link público de escala substitui parcialmente |
| Sem multi-paróquia | Arquitetura pode ser expandida com tenant ID; não justifica complexidade agora |
| Sem tema escuro | Baixo impacto na adoção; pode ser adicionado incrementalmente via Tailwind |

---

## 3. Decisões Técnicas com Justificativa

Cada decisão abaixo segue o formato: **opção escolhida**, **alternativas consideradas**, **justificativa** e **trade-offs aceitos**.

### 3.1 Prisma em vez de SQL puro

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | Prisma ORM |
| **Alternativas** | SQL puro com `pg`, Knex.js, Drizzle ORM |
| **Justificativa** | Queries type-safe com geração automática de tipos TypeScript; sistema de migrations robusto; schema declarativo serve como documentação viva do domínio; ecossistema maduro com Prisma Studio para debug |
| **Trade-offs** | Leve overhead de performance vs. SQL puro; curva de aprendizado para padrões específicos do Prisma (nested writes, relation queries); dependência de geração de código (`prisma generate`) |

### 3.2 JWT em vez de sessões server-side

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | JWT (access token + refresh token) via `@fastify/jwt` |
| **Alternativas** | Sessões server-side com `@fastify/session` + Redis store |
| **Justificativa** | Autenticação stateless — sem necessidade de armazenar sessões no servidor (exceto blacklist); simplifica escala horizontal futura; padrão bem documentado para SPAs; integração nativa com Fastify |
| **Trade-offs** | Não é possível revogar tokens individuais instantaneamente (blacklist via Redis é workaround); tamanho do token maior que um cookie de sessão; lógica de refresh adiciona complexidade ao frontend |

### 3.3 Celery (Python) em vez de BullMQ (Node.js)

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | Celery 5.4 com broker Redis |
| **Alternativas** | BullMQ (Node.js nativo), Temporal, Agenda.js |
| **Justificativa** | Já configurado no stack existente; ecossistema maduro e battle-tested para filas de tarefas; monitoramento via Flower; retry/backoff nativo; comunidade Python forte em algoritmos |
| **Trade-offs** | Stack poliglota (TypeScript + Python) adiciona complexidade operacional; algoritmo de escala precisa ser implementado em Python OU exposto via HTTP do TypeScript; dois runtimes no Docker Compose |

### 3.4 Algoritmo greedy em vez de otimização (ILP, backtracking)

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | Algoritmo greedy com scoring baseado em pesos |
| **Alternativas** | Integer Linear Programming (PuLP/OR-Tools), backtracking com poda, constraint satisfaction |
| **Justificativa** | Mais simples de implementar, testar e depurar; execução rápida (O(n*m) onde n=acólitos, m=funções); suficiente para os volumes esperados (P1, P2); fairness garantida pelo sistema de pesos (frequência, disponibilidade, preferência) |
| **Trade-offs** | Pode não encontrar a solução globalmente ótima; em cenários de alta restrição (poucos acólitos, muitos conflitos), pode gerar escalas subótimas; coordenadora precisa poder ajustar manualmente |

### 3.5 shadcn/ui em vez de Material UI ou Ant Design

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | shadcn/ui + Tailwind CSS |
| **Alternativas** | Material UI (MUI), Ant Design, Chakra UI, Mantine |
| **Justificativa** | Código "owned" (copy-paste, não dependência npm) — controle total sobre cada componente; totalmente customizável para tema eclesiástico (cores litúrgicas, tipografia sóbria); bundle menor que MUI/Ant; alinhado com Tailwind já presente no stack |
| **Trade-offs** | Mais trabalho de setup inicial (copiar e configurar componentes um a um); menos componentes prontos que MUI/Ant para casos complexos (data grid, date range picker); responsabilidade de manutenção dos componentes é do projeto |

### 3.6 React SPA em vez de Next.js SSR

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | React 19 SPA (Vite) servido como estático pelo Fastify |
| **Alternativas** | Next.js (SSR/SSG), Remix, Astro |
| **Justificativa** | Deploy mais simples (arquivos estáticos servidos pelo próprio Fastify); sem complexidade de SSR para ferramenta interna; stack já configurada com Vite + React; SEO não é requisito (exceto página pública de escala, que é uma única rota) |
| **Trade-offs** | Sem SEO nas rotas internas (não necessário); carregamento inicial levemente mais lento que SSR; toda a lógica de roteamento no cliente |

### 3.7 Soft delete em vez de hard delete

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | Soft delete (campo `deletedAt` nullable) |
| **Alternativas** | Hard delete, tabela de archive separada |
| **Justificativa** | Preservação de dados para auditoria; integridade de referências (escala aponta para acólito que saiu); capacidade de undo; requisito implícito de rastreabilidade em contexto eclesiástico |
| **Trade-offs** | Queries precisam filtrar por `deletedAt IS NULL` (middleware Prisma resolve); storage cresce ao longo do tempo; complexidade adicional em unique constraints (precisa considerar registros "deletados") |

### 3.8 Banco único em vez de microservices

| Aspecto | Detalhe |
|---------|---------|
| **Escolha** | PostgreSQL único compartilhado entre app e worker |
| **Alternativas** | Banco por serviço (microservices pattern), event sourcing |
| **Justificativa** | Arquitetura mais simples para a escala esperada; integridade transacional (escala + atribuições na mesma transação); sem overhead de comunicação entre serviços; equipe pequena |
| **Trade-offs** | Todos os serviços acoplados ao mesmo schema; mudanças de schema afetam app e worker simultaneamente; escala horizontal limitada (mas desnecessária para P1/P2) |

---

## 4. Trade-offs Aceitos na v1.0

Resumo consolidado dos trade-offs conscientemente aceitos para manter o escopo controlado:

| Trade-off | Razão | Caminho futuro |
|-----------|-------|----------------|
| Stack poliglota (TypeScript + Python) | Aproveitar Celery já configurado e ecossistema Python para algoritmos | Avaliar migração para BullMQ se complexidade operacional for alta |
| Sem atualizações em tempo real (polling em vez de WebSocket) | Simplicidade de implementação; escalas não mudam em tempo real | Adicionar WebSocket via `@fastify/websocket` se demanda surgir |
| Sem notificações por e-mail na v1.0 | Fora do escopo core; link público substitui parcialmente | Integrar Nodemailer ou serviço externo (SendGrid, Resend) na v1.1 |
| Apenas light mode | Menor escopo de CSS; foco na funcionalidade | Tema escuro via Tailwind `dark:` quando priorizado |
| Paróquia única | Simplifica schema, auth e queries | Adicionar `parishId` como tenant key para multi-paróquia |
| Sem modo offline | Complexidade de sync muito alta para v1.0 | Service worker + IndexedDB se validado como necessidade real |

---

## 5. Diagrama de Decisão

```
Escala automática necessária?
├── Sim → Algoritmo de escala
│   ├── Volumes < 100 acólitos? → Greedy (simples, rápido)
│   └── Volumes > 100 acólitos? → Avaliar ILP/OR-Tools
│
Auth necessária?
├── Sim → JWT (stateless, SPA-friendly)
│   └── Precisa revogar tokens? → Redis blacklist
│
Task queue necessária?
├── Sim → Celery já existe no stack
│   └── Overhead de polyglot é aceitável? → Sim (v1.0)
│
UI component library?
├── Precisa customizar para tema eclesiástico? → shadcn/ui (owned code)
│
SSR necessário?
├── Ferramenta interna + SEO irrelevante → SPA (React + Vite)
│
Delete strategy?
├── Auditoria necessária? → Soft delete
```

---

## 6. Revisão de Riscos

Esta seção deve ser revisada nos seguintes momentos:

1. **Ao final de cada sprint** — verificar se algum risco se materializou
2. **Ao receber feedback de usuários** — especialmente R3 (acólitos insuficientes) e R4 (resistência à adoção)
3. **Antes de planejar v1.1** — reavaliar premissas P1-P6 com dados reais de uso
4. **Se qualquer premissa for invalidada** — recalcular severidade e ajustar mitigações
