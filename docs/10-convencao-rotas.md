# Convenção de Rotas — Frontend e Backend

Este documento define a convenção de rotas do Liturgix, mapeando cada rota do frontend aos endpoints da API que ela consome, os papéis com acesso permitido e a hierarquia de navegação.

---

## Princípios

1. **Frontend em português, sem acentos** — rotas legíveis para o usuário brasileiro, sem caracteres especiais na URL.
2. **Backend em inglês** — convenção REST padrão, prefixo `/api/`.
3. **Separação clara** — o frontend nunca expõe a estrutura da API; o mapeamento é interno.
4. **Proteção por papel** — toda rota protegida valida o JWT e o papel do usuário antes de renderizar.

---

## Rotas do Frontend

### Rotas Públicas (sem autenticação)

| Rota | Descrição | Componente principal |
|------|-----------|---------------------|
| `/login` | Tela de login | `LoginPage` |
| `/cadastro` | Tela de cadastro (acólito ou responsável) | `RegisterPage` |
| `/p/:token` | Escala pública (consulta sem autenticação) | `PublicSchedulePage` |

### Rotas Autenticadas — Todos os papéis

| Rota | Descrição | Componente principal |
|------|-----------|---------------------|
| `/painel` | Dashboard principal (conteúdo adaptado por papel) | `DashboardPage` |
| `/escalas` | Lista de escalas (ACOLYTE/GUARDIAN veem apenas PUBLISHED) | `ScheduleListPage` |
| `/escala/:id` | Detalhe da escala (ACOLYTE/GUARDIAN veem apenas PUBLISHED) | `ScheduleDetailPage` |

### Rotas Autenticadas — ACOLYTE e GUARDIAN

| Rota | Descrição | Componente principal |
|------|-----------|---------------------|
| `/disponibilidade` | Calendário de disponibilidade (própria) | `AvailabilityPage` |
| `/minhas-funcoes` | Funções litúrgicas habilitadas (próprias) | `MyFunctionsPage` |
| `/meu-historico` | Histórico de serviços (próprio) | `MyHistoryPage` |

### Rotas Autenticadas — COORDINATOR e ADMIN

| Rota | Descrição | Componente principal |
|------|-----------|---------------------|
| `/escala/nova` | Gerar nova escala (assistente passo-a-passo) | `GenerateSchedulePage` |
| `/celebracoes` | Lista de celebrações | `CelebrationListPage` |
| `/celebracao/:id` | Detalhe da celebração | `CelebrationDetailPage` |
| `/celebracao/nova` | Nova celebração | `CelebrationFormPage` |
| `/acolitos` | Lista de acólitos | `AcolyteListPage` |
| `/acolito/:id` | Detalhe do acólito | `AcolyteDetailPage` |
| `/responsaveis` | Lista de responsáveis | `GuardianListPage` |
| `/coordenacao` | Painel de coordenação | `CoordinationPanelPage` |

> **Nota:** GUARDIAN tem acesso a `/acolitos` e `/acolito/:id`, porém enxerga apenas os acólitos vinculados a ele.

### Rotas Autenticadas — ADMIN

| Rota | Descrição | Componente principal |
|------|-----------|---------------------|
| `/admin` | Dashboard administrativo | `AdminDashboardPage` |
| `/admin/usuarios` | Gestão de usuários | `AdminUsersPage` |
| `/admin/funcoes` | Gestão de funções litúrgicas | `AdminFunctionsPage` |
| `/admin/auditoria` | Log de auditoria | `AdminAuditPage` |

---

## Rotas do Backend (API)

Todas as rotas da API seguem o prefixo `/api/` e são organizadas por domínio.

| Prefixo | Domínio | Autenticação |
|---------|---------|-------------|
| `/api/auth/*` | Autenticação (registro, login, logout, perfil) | Misto (register/login públicos, demais autenticados) |
| `/api/users/*` | Gestão de usuários | JWT (COORDINATOR+) |
| `/api/servers/*` | Gestão de acólitos | JWT (varia por endpoint) |
| `/api/guardians/*` | Gestão de responsáveis | JWT (COORDINATOR+) |
| `/api/celebrations/*` | Gestão de celebrações | JWT (COORDINATOR+) |
| `/api/schedules/*` | Gestão de escalas | JWT (varia por endpoint) |
| `/api/public/*` | Acesso público | Nenhuma (token na URL) |
| `/api/admin/*` | Administração | JWT (ADMIN) |

---

## Matriz de Controle de Acesso

| Rota Frontend | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN | Público |
|---------------|:-------:|:--------:|:-----------:|:-----:|:-------:|
| `/login` | — | — | — | — | Sim |
| `/cadastro` | — | — | — | — | Sim |
| `/painel` | Sim | Sim | Sim | Sim | — |
| `/escalas` | Sim* | Sim* | Sim | Sim | — |
| `/escala/:id` | Sim* | Sim* | Sim | Sim | — |
| `/escala/nova` | — | — | Sim | Sim | — |
| `/celebracoes` | — | — | Sim | Sim | — |
| `/celebracao/:id` | — | — | Sim | Sim | — |
| `/celebracao/nova` | — | — | Sim | Sim | — |
| `/acolitos` | — | Sim** | Sim | Sim | — |
| `/acolito/:id` | — | Sim** | Sim | Sim | — |
| `/disponibilidade` | Sim | Sim | — | — | — |
| `/minhas-funcoes` | Sim | Sim | — | — | — |
| `/meu-historico` | Sim | Sim | — | — | — |
| `/responsaveis` | — | — | Sim | Sim | — |
| `/coordenacao` | — | — | Sim | Sim | — |
| `/admin` | — | — | — | Sim | — |
| `/admin/usuarios` | — | — | — | Sim | — |
| `/admin/funcoes` | — | — | — | Sim | — |
| `/admin/auditoria` | — | — | — | Sim | — |
| `/p/:token` | — | — | — | — | Sim |

\* ACOLYTE e GUARDIAN veem apenas escalas com status PUBLISHED.
\*\* GUARDIAN vê apenas acólitos vinculados a ele.

---

## Mapeamento Frontend → Backend

Cada rota do frontend consome um ou mais endpoints da API. A tabela abaixo lista as chamadas realizadas por cada tela.

### Rotas Públicas

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/login` | `POST /api/auth/login` |
| `/cadastro` | `POST /api/auth/register` |
| `/p/:token` | `GET /api/public/schedules/:token` , `GET /api/public/schedules/:token/period` |

### Dashboard

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/painel` | `GET /api/auth/me` , `GET /api/schedules` (escalas recentes), `GET /api/admin/stats` (se ADMIN) |

### Escalas

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/escalas` | `GET /api/schedules` |
| `/escala/:id` | `GET /api/schedules/:id` , `GET /api/schedules/:id/audit` (se COORDINATOR+) |
| `/escala/nova` | `GET /api/celebrations` , `POST /api/schedules/generate` , `POST /api/schedules/:id/publish` , `POST /api/schedules/:id/assignments` , `PATCH /api/schedules/:id/assignments/:assignmentId` , `DELETE /api/schedules/:id/assignments/:assignmentId` |

### Celebrações

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/celebracoes` | `GET /api/celebrations` |
| `/celebracao/:id` | `GET /api/celebrations/:id` |
| `/celebracao/nova` | `POST /api/celebrations` , `PUT /api/celebrations/:id/requirements` |

### Acólitos

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/acolitos` | `GET /api/servers` |
| `/acolito/:id` | `GET /api/servers/:id` , `GET /api/servers/:id/functions` , `GET /api/servers/:id/availability` , `GET /api/servers/:id/history` , `PUT /api/servers/:id/functions` (se COORDINATOR+) |

### Área Pessoal (ACOLYTE / GUARDIAN)

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/disponibilidade` | `GET /api/servers/:id/availability` , `PUT /api/servers/:id/availability` |
| `/minhas-funcoes` | `GET /api/servers/:id/functions` |
| `/meu-historico` | `GET /api/servers/:id/history` |

> **Nota:** Nas rotas da área pessoal, o `:id` é o ID do próprio usuário autenticado, obtido via `GET /api/auth/me`.

### Responsáveis

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/responsaveis` | `GET /api/guardians` , `GET /api/guardians/:id/acolytes` , `POST /api/guardians/:id/link` |

### Coordenação

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/coordenacao` | `GET /api/schedules` , `GET /api/servers` , `GET /api/celebrations` , `GET /api/admin/stats` |

### Administração

| Rota Frontend | Endpoints da API Consumidos |
|---------------|---------------------------|
| `/admin` | `GET /api/admin/stats` |
| `/admin/usuarios` | `GET /api/admin/users` , `PATCH /api/admin/users/:id/role` , `PATCH /api/users/:id` , `DELETE /api/users/:id` |
| `/admin/funcoes` | `GET /api/admin/functions` , `POST /api/admin/functions` , `PATCH /api/admin/functions/:id` |
| `/admin/auditoria` | `GET /api/admin/audit-log` |

---

## Hierarquia de Navegação

A sidebar do aplicativo exibe itens de acordo com o papel do usuário autenticado.

### ACOLYTE

```
Painel (/painel)
Escalas (/escalas)
Disponibilidade (/disponibilidade)
Minhas Funções (/minhas-funcoes)
Meu Histórico (/meu-historico)
```

### GUARDIAN

```
Painel (/painel)
Escalas (/escalas)
Acólitos (/acolitos)          ← apenas vinculados
Disponibilidade (/disponibilidade)
Minhas Funções (/minhas-funcoes)
Meu Histórico (/meu-historico)
```

### COORDINATOR

```
Painel (/painel)
Escalas (/escalas)
  └─ Nova Escala (/escala/nova)
Celebrações (/celebracoes)
  └─ Nova Celebração (/celebracao/nova)
Acólitos (/acolitos)
Responsáveis (/responsaveis)
Coordenação (/coordenacao)
```

### ADMIN

```
Painel (/painel)
Escalas (/escalas)
  └─ Nova Escala (/escala/nova)
Celebrações (/celebracoes)
  └─ Nova Celebração (/celebracao/nova)
Acólitos (/acolitos)
Responsáveis (/responsaveis)
Coordenação (/coordenacao)
Administração (/admin)
  ├─ Usuários (/admin/usuarios)
  ├─ Funções Litúrgicas (/admin/funcoes)
  └─ Auditoria (/admin/auditoria)
```

---

## Regras de Redirecionamento

| Situação | Comportamento |
|----------|-------------- |
| Usuário não autenticado acessa rota protegida | Redireciona para `/login` com `?redirect=<rota_original>` |
| Usuário autenticado acessa `/login` ou `/cadastro` | Redireciona para `/painel` |
| Usuário acessa rota sem permissão para seu papel | Redireciona para `/painel` com toast de erro |
| Usuário acessa `/` (raiz) | Redireciona para `/painel` (autenticado) ou `/login` (não autenticado) |
| Rota inexistente | Exibe página 404 com link para `/painel` ou `/login` |

---

## Convenções de Implementação

1. **React Router** — rotas definidas em arquivo centralizado com guards por papel.
2. **Lazy loading** — cada rota carrega seu componente via `React.lazy()` para otimizar o bundle.
3. **Componente de guarda** — `<RequireAuth roles={[...]} />` wrapper que valida JWT e papel.
4. **Rota de layout** — rotas autenticadas compartilham um layout com sidebar, header e área de conteúdo.
5. **Rotas aninhadas** — `/admin/*` e `/escala/*` usam rotas aninhadas dentro de seus respectivos layouts.
6. **Parâmetros de rota** — `:id` sempre UUID, `:token` sempre string opaca para acesso público.
