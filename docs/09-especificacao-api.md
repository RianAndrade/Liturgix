# Especificacao de API

## Convencoes Gerais

### Base URL

```
https://{host}/api
```

### Formato

- Protocolo: REST sobre HTTP/1.1
- Content-Type: `application/json` (request e response)
- Encoding: UTF-8
- Datas: ISO 8601 (`2026-04-03T14:30:00Z` para timestamps, `2026-04-03` para datas)
- IDs: inteiros auto-incrementais

### Autenticacao

Todas as rotas protegidas exigem o header:

```
Authorization: Bearer <jwt_token>
```

O token JWT possui payload:

```typescript
interface JWTPayload {
  sub: number;        // user.id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
```

Tokens invalidados sao armazenados em Redis (blacklist) ate sua expiracao natural.

### Papeis (Roles)

```typescript
enum UserRole {
  ACOLYTE = "ACOLYTE",
  GUARDIAN = "GUARDIAN",
  COORDINATOR = "COORDINATOR",
  ADMIN = "ADMIN",
}
```

Hierarquia de permissao: `ADMIN > COORDINATOR > GUARDIAN > ACOLYTE`.

Notacao `COORDINATOR+` significa COORDINATOR ou ADMIN.

---

## Padroes de Resposta

### Mutacao com sucesso

```typescript
interface MutationResponse<T> {
  success: true;
  data: T;
}
```

### Lista com sucesso

```typescript
interface ListResponse<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
```

### Erro

```typescript
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: ValidationError[] | Record<string, any>;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}
```

### Codigos HTTP utilizados

| Codigo | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Leitura ou mutacao sincrona bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 202 | Accepted | Tarefa assincrona enfileirada |
| 400 | Bad Request | Payload invalido ou violacao de regra de negocio |
| 401 | Unauthorized | Token ausente, expirado ou invalidado |
| 403 | Forbidden | Papel insuficiente ou acesso fora de escopo |
| 404 | Not Found | Recurso inexistente ou soft-deleted |
| 409 | Conflict | Duplicidade (ex.: email ja cadastrado) |
| 422 | Unprocessable Entity | Validacao de campos falhou |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro inesperado no servidor |

### Parametros de paginacao (query string)

Aplicaveis a todos os endpoints de listagem:

| Parametro | Tipo | Default | Descricao |
|-----------|------|---------|-----------|
| `page` | number | 1 | Pagina atual (1-indexed) |
| `perPage` | number | 20 | Itens por pagina (max: 100) |

---

## Tipos Compartilhados

```typescript
interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

interface UserDetail extends UserSummary {
  updatedAt: string;
  functions?: LiturgicalFunctionSummary[];
  guardianLinks?: GuardianLinkInfo[];
}

interface LiturgicalFunctionSummary {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

interface GuardianLinkInfo {
  id: number;
  guardianId: number;
  acolyteId: number;
  guardianName: string;
  acolyteName: string;
  linkedAt: string;
}

interface CelebrationSummary {
  id: number;
  name: string;
  date: string;
  type: CelebrationType;
  location: string | null;
  notes: string | null;
  createdAt: string;
}

interface CelebrationDetail extends CelebrationSummary {
  updatedAt: string;
  requirements: CelebrationRequirement[];
}

interface CelebrationRequirement {
  id: number;
  functionId: number;
  functionName: string;
  quantity: number;
}

enum CelebrationType {
  SUNDAY_MASS = "SUNDAY_MASS",
  WEEKDAY_MASS = "WEEKDAY_MASS",
  HOLY_DAY = "HOLY_DAY",
  SPECIAL = "SPECIAL",
}

enum ScheduleStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

interface ScheduleSummary {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
  publicToken: string | null;
  createdAt: string;
  createdBy: number;
}

interface ScheduleDetail extends ScheduleSummary {
  updatedAt: string;
  assignments: ScheduleAssignment[];
  conflicts: ScheduleConflict[];
}

interface ScheduleAssignment {
  id: number;
  celebrationId: number;
  celebrationName: string;
  celebrationDate: string;
  functionId: number;
  functionName: string;
  userId: number | null;
  userName: string | null;
  locked: boolean;
  score: number | null;
  auditData: Record<string, any> | null;
}

enum ConflictType {
  NO_CANDIDATES = "NO_CANDIDATES",
  INSUFFICIENT_CANDIDATES = "INSUFFICIENT_CANDIDATES",
  OVERLOADED_SINGLE_CANDIDATE = "OVERLOADED_SINGLE_CANDIDATE",
  ALL_UNAVAILABLE = "ALL_UNAVAILABLE",
  QUALIFICATION_GAP = "QUALIFICATION_GAP",
}

interface ScheduleConflict {
  type: ConflictType;
  celebrationId: number;
  celebrationName: string;
  functionId: number;
  functionName: string;
  description: string;
  suggestedActions: string[];
}

interface AuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  userId: number;
  userName: string;
  changes: Record<string, any>;
  createdAt: string;
}

interface ServiceRecord {
  id: number;
  scheduleId: number;
  celebrationId: number;
  celebrationName: string;
  celebrationDate: string;
  functionId: number;
  functionName: string;
  attended: boolean;
  createdAt: string;
}

interface AuthToken {
  token: string;
  expiresAt: string;
}
```

---

## 1. Autenticacao

### 1.1 POST /api/auth/register

Registra um novo usuario no sistema.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/auth/register` |
| **Autenticacao** | Nenhuma |
| **Papeis permitidos** | Publico (somente roles ACOLYTE e GUARDIAN) |

#### Request

```typescript
interface RegisterRequest {
  name: string;          // min: 2, max: 100
  email: string;         // formato email valido, unico
  password: string;      // min: 8, max: 128
  role: "ACOLYTE" | "GUARDIAN";
}
```

#### Response (201 Created)

```typescript
interface RegisterResponse {
  success: true;
  data: {
    user: UserSummary;
    token: AuthToken;
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 409 | Email ja cadastrado |
| 422 | Campos obrigatorios ausentes ou invalidos |
| 400 | Tentativa de registrar como COORDINATOR ou ADMIN |

#### Regras de negocio

- Somente os papeis ACOLYTE e GUARDIAN podem ser escolhidos no registro publico.
- COORDINATOR e ADMIN sao atribuidos exclusivamente por um ADMIN via `/api/admin/users/:id/role`.
- A senha e armazenada com hash bcrypt (custo 12).
- Um token JWT e gerado e retornado imediatamente (login automatico apos registro).

---

### 1.2 POST /api/auth/login

Autentica um usuario existente.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/auth/login` |
| **Autenticacao** | Nenhuma |
| **Papeis permitidos** | Publico |

#### Request

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

#### Response (200 OK)

```typescript
interface LoginResponse {
  success: true;
  data: {
    user: UserSummary;
    token: AuthToken;
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Email nao encontrado ou senha incorreta |
| 422 | Campos obrigatorios ausentes |
| 403 | Usuario desativado (soft-deleted) |

#### Regras de negocio

- A mensagem de erro para credenciais invalidas e generica ("Email ou senha incorretos") para evitar enumeracao de usuarios.
- Usuarios desativados recebem 403 com mensagem explicativa.

---

### 1.3 POST /api/auth/logout

Invalida o token do usuario autenticado.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/auth/logout` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado |

#### Request

Sem corpo. O token e extraido do header `Authorization`.

#### Response (200 OK)

```typescript
interface LogoutResponse {
  success: true;
  data: null;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Token ausente, invalido ou ja expirado |

#### Regras de negocio

- O token e adicionado a uma blacklist no Redis com TTL igual ao tempo restante de expiracao do JWT.
- Qualquer requisicao subsequente com o mesmo token recebera 401.

---

### 1.4 GET /api/auth/me

Retorna o perfil completo do usuario autenticado.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/auth/me` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado |

#### Response (200 OK)

```typescript
interface MeResponse {
  success: true;
  data: {
    user: UserDetail;
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Token ausente, invalido ou blacklisted |

#### Regras de negocio

- Retorna o usuario com todas as funcoes habilitadas e vinculos de responsavel (se aplicavel).
- Dados sensiveis (hash da senha) nunca sao incluidos na resposta.

---

## 2. Usuarios

### 2.1 GET /api/users

Lista usuarios com filtros opcionais.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/users` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 20 | Itens por pagina |
| `role` | UserRole | Nao | — | Filtrar por papel |
| `search` | string | Nao | — | Busca por nome ou email (case-insensitive, parcial) |
| `active` | boolean | Nao | true | Filtrar por status ativo |

#### Response (200 OK)

```typescript
interface ListUsersResponse {
  success: true;
  data: UserSummary[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente (ACOLYTE ou GUARDIAN) |

---

### 2.2 GET /api/users/:id

Retorna detalhes de um usuario especifico.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/users/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do usuario |

#### Response (200 OK)

```typescript
interface GetUserResponse {
  success: true;
  data: UserDetail;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | ACOLYTE/GUARDIAN tentando acessar perfil de outro usuario |
| 404 | Usuario nao encontrado |

#### Regras de negocio

- ACOLYTE e GUARDIAN podem acessar apenas seu proprio perfil (`id` deve ser igual ao `sub` do JWT).
- COORDINATOR+ pode acessar qualquer usuario.

---

### 2.3 PATCH /api/users/:id

Edita dados de um usuario.

| Item | Valor |
|------|-------|
| **Metodo** | PATCH |
| **Caminho** | `/api/users/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Proprio usuario ou ADMIN |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do usuario |

#### Request

```typescript
interface UpdateUserRequest {
  name?: string;         // min: 2, max: 100
  email?: string;        // formato email valido, unico
  password?: string;     // min: 8, max: 128 (nova senha)
}
```

#### Response (200 OK)

```typescript
interface UpdateUserResponse {
  success: true;
  data: UserDetail;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Tentando editar outro usuario sem ser ADMIN |
| 404 | Usuario nao encontrado |
| 409 | Novo email ja esta em uso |
| 422 | Campos invalidos |

#### Regras de negocio

- Qualquer usuario pode editar seu proprio perfil (nome, email, senha).
- ADMIN pode editar qualquer usuario.
- COORDINATOR nao pode editar outros usuarios.
- O campo `role` nao e alteravel por este endpoint (usar `/api/admin/users/:id/role`).
- Alteracao de senha exige re-hash com bcrypt.

---

### 2.4 DELETE /api/users/:id

Desativa um usuario (soft delete).

| Item | Valor |
|------|-------|
| **Metodo** | DELETE |
| **Caminho** | `/api/users/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do usuario |

#### Response (200 OK)

```typescript
interface DeleteUserResponse {
  success: true;
  data: {
    id: number;
    active: boolean; // false
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 400 | Tentativa de desativar o ultimo ADMIN |
| 404 | Usuario nao encontrado |

#### Regras de negocio

- Soft delete: o campo `active` e definido como `false`, o registro nao e removido.
- Nao e permitido desativar o ultimo ADMIN do sistema (protecao contra lockout).
- Usuarios desativados nao conseguem fazer login.
- Escalas existentes com atribuicoes do usuario nao sao alteradas (historico preservado).

---

## 3. Acolitos (Servers)

### 3.1 GET /api/servers

Lista acolitos.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/servers` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 20 | Itens por pagina |
| `search` | string | Nao | — | Busca por nome |
| `functionId` | number | Nao | — | Filtrar por funcao habilitada |
| `active` | boolean | Nao | true | Filtrar por status ativo |

#### Response (200 OK)

```typescript
interface ServerSummary {
  id: number;
  name: string;
  email: string;
  active: boolean;
  functions: LiturgicalFunctionSummary[];
  totalServices: number;
}

interface ListServersResponse {
  success: true;
  data: ServerSummary[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |

#### Regras de negocio

- COORDINATOR+ ve todos os acolitos.
- GUARDIAN ve apenas os acolitos vinculados a si.
- ACOLYTE ve apenas seu proprio registro.

---

### 3.2 GET /api/servers/:id

Retorna detalhes de um acolito com funcoes e estatisticas.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/servers/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do acolito |

#### Response (200 OK)

```typescript
interface ServerDetail {
  id: number;
  name: string;
  email: string;
  active: boolean;
  functions: LiturgicalFunctionSummary[];
  stats: {
    totalServices: number;
    servicesByFunction: { functionId: number; functionName: string; count: number }[];
    lastServiceDate: string | null;
    upcomingAssignments: number;
  };
  guardians: { id: number; name: string; email: string }[];
}

interface GetServerResponse {
  success: true;
  data: ServerDetail;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Escopo insuficiente |
| 404 | Acolito nao encontrado |

#### Regras de negocio

- Mesmas regras de escopo do GET /api/servers.
- ACOLYTE so acessa seu proprio detalhe.
- GUARDIAN so acessa acolitos vinculados.

---

### 3.3 GET /api/servers/:id/availability

Retorna as indisponibilidades de um acolito em um periodo.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/servers/:id/availability` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do acolito |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `startDate` | string (date) | Sim | — | Inicio do periodo (ISO 8601 date) |
| `endDate` | string (date) | Sim | — | Fim do periodo (ISO 8601 date) |

#### Response (200 OK)

```typescript
interface AvailabilityResponse {
  success: true;
  data: {
    serverId: number;
    startDate: string;
    endDate: string;
    unavailableDates: string[]; // array de datas ISO 8601
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Escopo insuficiente |
| 404 | Acolito nao encontrado |
| 422 | Datas ausentes ou `startDate` > `endDate` |

#### Regras de negocio

- ACOLYTE pode ver apenas sua propria disponibilidade.
- GUARDIAN pode ver disponibilidade de acolitos vinculados.
- COORDINATOR+ pode ver de qualquer acolito.

---

### 3.4 PUT /api/servers/:id/availability

Define as indisponibilidades de um acolito, substituindo todas as existentes no periodo.

| Item | Valor |
|------|-------|
| **Metodo** | PUT |
| **Caminho** | `/api/servers/:id/availability` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Proprio acolito, GUARDIAN vinculado, ou COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do acolito |

#### Request

```typescript
interface SetAvailabilityRequest {
  startDate: string;     // ISO 8601 date — inicio do periodo
  endDate: string;       // ISO 8601 date — fim do periodo
  dates: string[];       // datas indisponiveis dentro do periodo (ISO 8601 date)
}
```

#### Response (200 OK)

```typescript
interface SetAvailabilityResponse {
  success: true;
  data: {
    serverId: number;
    startDate: string;
    endDate: string;
    unavailableDates: string[];
    totalDates: number;
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Escopo insuficiente |
| 404 | Acolito nao encontrado |
| 422 | Datas fora do periodo, `startDate` > `endDate`, ou formato invalido |

#### Regras de negocio

- Operacao idempotente: todas as indisponibilidades no periodo sao substituidas pelas novas.
- Datas no array `dates` devem estar dentro do intervalo `[startDate, endDate]`.
- Se o array `dates` estiver vazio, todas as indisponibilidades no periodo sao removidas (acolito disponivel em todos os dias).
- Escalas ja publicadas (PUBLISHED) nao sao afetadas retroativamente.

---

### 3.5 GET /api/servers/:id/functions

Retorna as funcoes liturgicas habilitadas para um acolito.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/servers/:id/functions` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do acolito |

#### Response (200 OK)

```typescript
interface ServerFunctionsResponse {
  success: true;
  data: {
    serverId: number;
    functions: LiturgicalFunctionSummary[];
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Escopo insuficiente |
| 404 | Acolito nao encontrado |

---

### 3.6 PUT /api/servers/:id/functions

Define as funcoes liturgicas habilitadas para um acolito.

| Item | Valor |
|------|-------|
| **Metodo** | PUT |
| **Caminho** | `/api/servers/:id/functions` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do acolito |

#### Request

```typescript
interface SetServerFunctionsRequest {
  functionIds: number[]; // IDs das funcoes liturgicas a habilitar
}
```

#### Response (200 OK)

```typescript
interface SetServerFunctionsResponse {
  success: true;
  data: {
    serverId: number;
    functions: LiturgicalFunctionSummary[];
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Acolito nao encontrado |
| 422 | `functionIds` contem IDs de funcoes inexistentes ou inativas |

#### Regras de negocio

- Operacao idempotente: substitui todas as funcoes habilitadas do acolito.
- Somente funcoes ativas podem ser atribuidas.
- Se o array estiver vazio, todas as funcoes sao removidas (acolito nao sera escalado).
- Funcoes removidas nao afetam atribuicoes existentes em escalas.

---

### 3.7 GET /api/servers/:id/history

Retorna o historico de servicos de um acolito.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/servers/:id/history` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do acolito |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 20 | Itens por pagina |
| `startDate` | string (date) | Nao | — | Filtrar a partir desta data |
| `endDate` | string (date) | Nao | — | Filtrar ate esta data |

#### Response (200 OK)

```typescript
interface ServerHistoryResponse {
  success: true;
  data: ServiceRecord[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Escopo insuficiente |
| 404 | Acolito nao encontrado |

#### Regras de negocio

- Mesmas regras de escopo dos demais endpoints de acolitos.
- Ordenacao padrao: data da celebracao decrescente (mais recente primeiro).

---

## 4. Responsaveis (Guardians)

### 4.1 GET /api/guardians

Lista responsaveis cadastrados.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/guardians` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 20 | Itens por pagina |
| `search` | string | Nao | — | Busca por nome ou email |

#### Response (200 OK)

```typescript
interface GuardianSummary {
  id: number;
  name: string;
  email: string;
  active: boolean;
  linkedAcolytes: number; // contagem de acolitos vinculados
}

interface ListGuardiansResponse {
  success: true;
  data: GuardianSummary[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |

---

### 4.2 GET /api/guardians/:id/acolytes

Lista acolitos vinculados a um responsavel.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/guardians/:id/acolytes` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Proprio GUARDIAN ou COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do responsavel |

#### Response (200 OK)

```typescript
interface GuardianAcolytesResponse {
  success: true;
  data: ServerSummary[];
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | GUARDIAN tentando acessar vinculos de outro responsavel |
| 404 | Responsavel nao encontrado |

#### Regras de negocio

- Um GUARDIAN pode ver apenas seus proprios acolitos vinculados.
- COORDINATOR+ pode ver vinculos de qualquer responsavel.

---

### 4.3 POST /api/guardians/:id/link

Vincula um acolito a um responsavel.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/guardians/:id/link` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do responsavel |

#### Request

```typescript
interface LinkAcolyteRequest {
  acolyteId: number;
}
```

#### Response (201 Created)

```typescript
interface LinkAcolyteResponse {
  success: true;
  data: GuardianLinkInfo;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Responsavel ou acolito nao encontrado |
| 409 | Vinculo ja existe |
| 422 | `acolyteId` aponta para usuario que nao e ACOLYTE |

#### Regras de negocio

- O usuario alvo (`acolyteId`) deve ter papel ACOLYTE.
- O usuario destino (`id`) deve ter papel GUARDIAN.
- Um acolito pode ter multiplos responsaveis.
- Um responsavel pode ter multiplos acolitos.
- Vinculos duplicados sao rejeitados com 409.

---

## 5. Celebracoes

### 5.1 GET /api/celebrations

Lista celebracoes com filtros opcionais.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/celebrations` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 20 | Itens por pagina |
| `startDate` | string (date) | Nao | — | Filtrar a partir desta data |
| `endDate` | string (date) | Nao | — | Filtrar ate esta data |
| `type` | CelebrationType | Nao | — | Filtrar por tipo |

#### Response (200 OK)

```typescript
interface ListCelebrationsResponse {
  success: true;
  data: CelebrationSummary[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |

---

### 5.2 POST /api/celebrations

Cria uma nova celebracao.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/celebrations` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Request

```typescript
interface CreateCelebrationRequest {
  name: string;            // min: 2, max: 200
  date: string;            // ISO 8601 date
  type: CelebrationType;
  location?: string;       // max: 200
  notes?: string;          // max: 1000
}
```

#### Response (201 Created)

```typescript
interface CreateCelebrationResponse {
  success: true;
  data: CelebrationDetail;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 422 | Campos obrigatorios ausentes ou invalidos |

---

### 5.3 GET /api/celebrations/:id

Retorna detalhes de uma celebracao com seus requisitos de funcoes.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/celebrations/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da celebracao |

#### Response (200 OK)

```typescript
interface GetCelebrationResponse {
  success: true;
  data: CelebrationDetail;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 404 | Celebracao nao encontrada |

---

### 5.4 PATCH /api/celebrations/:id

Edita uma celebracao existente.

| Item | Valor |
|------|-------|
| **Metodo** | PATCH |
| **Caminho** | `/api/celebrations/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da celebracao |

#### Request

```typescript
interface UpdateCelebrationRequest {
  name?: string;           // min: 2, max: 200
  date?: string;           // ISO 8601 date
  type?: CelebrationType;
  location?: string | null; // null para remover
  notes?: string | null;    // null para remover
}
```

#### Response (200 OK)

```typescript
interface UpdateCelebrationResponse {
  success: true;
  data: CelebrationDetail;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Celebracao nao encontrada |
| 422 | Campos invalidos |

#### Regras de negocio

- Celebracoes vinculadas a escalas PUBLISHED podem ser editadas, mas as atribuicoes existentes nao sao recalculadas automaticamente.

---

### 5.5 DELETE /api/celebrations/:id

Remove uma celebracao (soft delete).

| Item | Valor |
|------|-------|
| **Metodo** | DELETE |
| **Caminho** | `/api/celebrations/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da celebracao |

#### Response (200 OK)

```typescript
interface DeleteCelebrationResponse {
  success: true;
  data: {
    id: number;
    deleted: boolean;
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 400 | Celebracao vinculada a escala PUBLISHED |
| 404 | Celebracao nao encontrada |

#### Regras de negocio

- Soft delete: o registro e marcado como deletado, nao removido fisicamente.
- Celebracoes vinculadas a escalas com status PUBLISHED nao podem ser removidas.
- Celebracoes em escalas DRAFT sao desvinculadas (atribuicoes removidas).

---

### 5.6 PUT /api/celebrations/:id/requirements

Define os requisitos de funcoes liturgicas para uma celebracao.

| Item | Valor |
|------|-------|
| **Metodo** | PUT |
| **Caminho** | `/api/celebrations/:id/requirements` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da celebracao |

#### Request

```typescript
interface SetRequirementsRequest {
  requirements: RequirementInput[];
}

interface RequirementInput {
  functionId: number;   // ID da funcao liturgica
  quantity: number;     // quantidade necessaria (min: 1)
}
```

#### Response (200 OK)

```typescript
interface SetRequirementsResponse {
  success: true;
  data: {
    celebrationId: number;
    requirements: CelebrationRequirement[];
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Celebracao nao encontrada |
| 422 | `functionId` inexistente, inativo, ou `quantity` < 1 |
| 422 | Funcao duplicada no array |

#### Regras de negocio

- Operacao idempotente: substitui todos os requisitos existentes.
- Somente funcoes ativas podem ser requisitadas.
- Quantidade minima por funcao: 1.
- Funcoes duplicadas no array sao rejeitadas.
- Se o array estiver vazio, todos os requisitos sao removidos.

---

## 6. Escalas (Schedules)

### 6.1 GET /api/schedules

Lista escalas.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/schedules` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 20 | Itens por pagina |
| `status` | ScheduleStatus | Nao | — | Filtrar por status |
| `startDate` | string (date) | Nao | — | Escalas que iniciam a partir desta data |
| `endDate` | string (date) | Nao | — | Escalas que terminam ate esta data |

#### Response (200 OK)

```typescript
interface ListSchedulesResponse {
  success: true;
  data: ScheduleSummary[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |

#### Regras de negocio

- ACOLYTE e GUARDIAN veem apenas escalas com status PUBLISHED.
- COORDINATOR+ ve escalas em qualquer status (DRAFT, PUBLISHED, ARCHIVED).

---

### 6.2 POST /api/schedules/generate

Solicita a geracao automatica de uma escala.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/schedules/generate` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Request

```typescript
interface GenerateScheduleRequest {
  name: string;          // min: 2, max: 200
  startDate: string;     // ISO 8601 date
  endDate: string;       // ISO 8601 date
}
```

#### Response (202 Accepted)

```typescript
interface GenerateScheduleResponse {
  success: true;
  data: {
    scheduleId: number;
    taskId: string;        // ID da task no Celery
    status: "PROCESSING";
    message: string;       // "Escala em geracao. Consulte o status pelo scheduleId."
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 422 | Datas invalidas, `startDate` > `endDate`, ou periodo > 90 dias |
| 400 | Nenhuma celebracao encontrada no periodo |
| 400 | Nenhum acolito ativo com funcoes habilitadas |

#### Regras de negocio

- A geracao e assincrona: a requisicao retorna imediatamente com 202.
- A task e enfileirada no Celery via Redis.
- A escala e criada com status DRAFT.
- O algoritmo de geracao segue a especificacao do documento `08-algoritmo-escala.md`:
  - Formula de pontuacao com pesos configuraveis (contagem 50%, rotacao 30%, intervalo 20%).
  - Processamento por celebracao em ordem cronologica, vagas por restricao (mais restrita primeiro).
  - Desempate: menos servicos totais, mais dias desde ultimo servico, ordem alfabetica.
  - Vagas nao resolvidas ficam com `userId: null`.
  - Conflitos sao registrados e retornados no detalhe da escala.
- O periodo maximo e 90 dias.
- Celebracoes sem requisitos definidos sao ignoradas.

---

### 6.3 GET /api/schedules/:id

Retorna detalhes de uma escala com atribuicoes e conflitos.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/schedules/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | Qualquer autenticado (com restricao de escopo) |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da escala |

#### Response (200 OK)

```typescript
interface GetScheduleResponse {
  success: true;
  data: ScheduleDetail;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | ACOLYTE/GUARDIAN tentando acessar escala DRAFT |
| 404 | Escala nao encontrada |

#### Regras de negocio

- ACOLYTE e GUARDIAN so podem acessar escalas PUBLISHED.
- COORDINATOR+ pode acessar qualquer escala.
- A resposta inclui atribuicoes completas e lista de conflitos (somente para COORDINATOR+).

---

### 6.4 PATCH /api/schedules/:id

Edita metadados ou status de uma escala.

| Item | Valor |
|------|-------|
| **Metodo** | PATCH |
| **Caminho** | `/api/schedules/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da escala |

#### Request

```typescript
interface UpdateScheduleRequest {
  name?: string;            // min: 2, max: 200
  status?: ScheduleStatus;
}
```

#### Response (200 OK)

```typescript
interface UpdateScheduleResponse {
  success: true;
  data: ScheduleSummary;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Escala nao encontrada |
| 400 | Transicao de status invalida |

#### Regras de negocio

- Transicoes de status validas:
  - DRAFT -> PUBLISHED
  - DRAFT -> ARCHIVED
  - PUBLISHED -> ARCHIVED
- Transicoes invalidas (rejeitadas com 400):
  - PUBLISHED -> DRAFT
  - ARCHIVED -> qualquer
- Nota: para publicar com geracao de token publico, usar `POST /api/schedules/:id/publish`.

---

### 6.5 POST /api/schedules/:id/publish

Publica uma escala e gera um token publico para compartilhamento.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/schedules/:id/publish` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da escala |

#### Request

Sem corpo.

#### Response (200 OK)

```typescript
interface PublishScheduleResponse {
  success: true;
  data: {
    id: number;
    status: "PUBLISHED";
    publicToken: string;      // token UUID para acesso publico
    publicUrl: string;        // URL completa para compartilhamento
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Escala nao encontrada |
| 400 | Escala nao esta em DRAFT |
| 400 | Escala possui vagas nao preenchidas (conflitos nao resolvidos) |

#### Regras de negocio

- Somente escalas em DRAFT podem ser publicadas.
- Um `publicToken` (UUID v4) e gerado para acesso sem autenticacao.
- Se a escala ja foi publicada anteriormente (re-publicacao apos voltar a DRAFT nao e possivel), retorna erro.
- Escalas com vagas nao preenchidas (`userId: null`) geram aviso, mas a publicacao pode ser forcada com query param `?force=true`.

---

### 6.6 POST /api/schedules/:id/assignments

Cria uma atribuicao manual em uma escala.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/schedules/:id/assignments` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da escala |

#### Request

```typescript
interface CreateAssignmentRequest {
  celebrationId: number;
  functionId: number;
  userId: number;
}
```

#### Response (201 Created)

```typescript
interface CreateAssignmentResponse {
  success: true;
  data: ScheduleAssignment;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Escala, celebracao, funcao ou usuario nao encontrado |
| 400 | Escala nao esta em DRAFT |
| 400 | Usuario nao possui a funcao habilitada |
| 400 | Usuario ja esta atribuido a outra funcao na mesma celebracao |
| 400 | Usuario esta indisponivel na data da celebracao |
| 409 | Vaga ja preenchida (celebracao + funcao + posicao) |

#### Regras de negocio

- Atribuicoes manuais so podem ser feitas em escalas DRAFT.
- O acolito deve ter a funcao habilitada.
- O acolito nao pode estar atribuido a outra funcao na mesma celebracao (sem duplicata no dia).
- O acolito nao pode estar indisponivel na data.
- Atribuicoes manuais sao automaticamente marcadas como `locked: true` para preservacao durante re-geracao.
- Registro na trilha de auditoria.

---

### 6.7 PATCH /api/schedules/:id/assignments/:assignmentId

Edita ou troca uma atribuicao existente.

| Item | Valor |
|------|-------|
| **Metodo** | PATCH |
| **Caminho** | `/api/schedules/:id/assignments/:assignmentId` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da escala |
| `assignmentId` | number | ID da atribuicao |

#### Request

```typescript
interface UpdateAssignmentRequest {
  userId?: number;       // novo acolito (troca)
  locked?: boolean;      // travar/destravar para re-geracao
}
```

#### Response (200 OK)

```typescript
interface UpdateAssignmentResponse {
  success: true;
  data: ScheduleAssignment;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Escala ou atribuicao nao encontrada |
| 400 | Escala nao esta em DRAFT |
| 400 | Novo usuario nao possui a funcao habilitada |
| 400 | Novo usuario ja atribuido a outra funcao na mesma celebracao |
| 400 | Novo usuario indisponivel na data |

#### Regras de negocio

- Somente escalas em DRAFT permitem edicao de atribuicoes.
- Ao trocar o acolito, as mesmas validacoes de criacao se aplicam.
- O campo `locked` controla se a atribuicao e preservada durante re-geracao automatica.
- Registro na trilha de auditoria com valores anterior e novo.

---

### 6.8 DELETE /api/schedules/:id/assignments/:assignmentId

Remove uma atribuicao de uma escala.

| Item | Valor |
|------|-------|
| **Metodo** | DELETE |
| **Caminho** | `/api/schedules/:id/assignments/:assignmentId` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da escala |
| `assignmentId` | number | ID da atribuicao |

#### Response (200 OK)

```typescript
interface DeleteAssignmentResponse {
  success: true;
  data: {
    id: number;
    deleted: boolean;
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Escala ou atribuicao nao encontrada |
| 400 | Escala nao esta em DRAFT |

#### Regras de negocio

- Somente escalas em DRAFT permitem remocao de atribuicoes.
- A vaga volta a ficar aberta (`userId: null`).
- Registro na trilha de auditoria.

---

### 6.9 GET /api/schedules/:id/audit

Retorna a trilha de auditoria de uma escala.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/schedules/:id/audit` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | COORDINATOR+ |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da escala |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 50 | Itens por pagina |

#### Response (200 OK)

```typescript
interface ScheduleAuditResponse {
  success: true;
  data: AuditLogEntry[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Escala nao encontrada |

#### Regras de negocio

- Inclui todos os eventos: geracao automatica, atribuicoes manuais, edicoes, remocoes, publicacao.
- Cada entrada registra: acao, usuario que executou, timestamp, dados alterados.
- Ordenacao: mais recente primeiro.

---

## 7. Acesso Publico

### 7.1 GET /api/public/schedules/:token

Retorna uma escala publicada para consulta publica (sem autenticacao).

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/public/schedules/:token` |
| **Autenticacao** | Nenhuma |
| **Papeis permitidos** | Publico |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `token` | string | Token publico UUID da escala |

#### Response (200 OK)

```typescript
interface PublicAssignment {
  celebrationName: string;
  celebrationDate: string;
  celebrationType: CelebrationType;
  location: string | null;
  functionName: string;
  serverFirstName: string;   // somente primeiro nome (privacidade)
}

interface PublicScheduleResponse {
  success: true;
  data: {
    name: string;
    startDate: string;
    endDate: string;
    publishedAt: string;
    assignments: PublicAssignment[];
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 404 | Token invalido ou escala nao publicada |

#### Regras de negocio

- Nenhuma autenticacao necessaria.
- Somente o primeiro nome dos acolitos e exibido (protecao de privacidade).
- Somente escalas com status PUBLISHED sao acessiveis.
- Escalas ARCHIVED nao sao acessiveis por token publico.
- Rate limit mais restritivo para prevenir abuso.

---

### 7.2 GET /api/public/schedules/:token/period

Retorna escalas publicadas em um periodo para consulta publica.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/public/schedules/:token/period` |
| **Autenticacao** | Nenhuma |
| **Papeis permitidos** | Publico |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `token` | string | Token publico UUID da escala |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `startDate` | string (date) | Nao | inicio da escala | Filtrar a partir desta data |
| `endDate` | string (date) | Nao | fim da escala | Filtrar ate esta data |

#### Response (200 OK)

```typescript
interface PublicSchedulePeriodResponse {
  success: true;
  data: {
    name: string;
    startDate: string;
    endDate: string;
    filteredStartDate: string;
    filteredEndDate: string;
    assignments: PublicAssignment[];
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 404 | Token invalido ou escala nao publicada |
| 422 | Datas invalidas |

#### Regras de negocio

- Mesmas regras de privacidade do endpoint anterior.
- Permite filtrar atribuicoes por sub-periodo dentro da escala.
- Se `startDate` e `endDate` nao forem informados, retorna o periodo completo.

---

## 8. Administracao

### 8.1 GET /api/admin/users

Lista todos os usuarios com informacoes completas de gerenciamento.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/admin/users` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 20 | Itens por pagina |
| `role` | UserRole | Nao | — | Filtrar por papel |
| `search` | string | Nao | — | Busca por nome ou email |
| `active` | boolean | Nao | — | Filtrar por status (nao filtra por padrao, mostra todos) |

#### Response (200 OK)

```typescript
interface AdminUserSummary extends UserSummary {
  lastLoginAt: string | null;
  totalServices: number;
  linkedGuardians: number;   // para ACOLYTE
  linkedAcolytes: number;    // para GUARDIAN
}

interface AdminListUsersResponse {
  success: true;
  data: AdminUserSummary[];
  pagination: Pagination;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |

#### Regras de negocio

- Diferente de `GET /api/users`, este endpoint inclui usuarios inativos por padrao e informacoes adicionais de gerenciamento.
- Inclui ultimo login, contagem de servicos e vinculos.

---

### 8.2 PATCH /api/admin/users/:id/role

Altera o papel de um usuario.

| Item | Valor |
|------|-------|
| **Metodo** | PATCH |
| **Caminho** | `/api/admin/users/:id/role` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID do usuario |

#### Request

```typescript
interface ChangeRoleRequest {
  role: UserRole;
}
```

#### Response (200 OK)

```typescript
interface ChangeRoleResponse {
  success: true;
  data: {
    id: number;
    name: string;
    email: string;
    previousRole: UserRole;
    newRole: UserRole;
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Usuario nao encontrado |
| 400 | Tentativa de remover o papel ADMIN do ultimo ADMIN |
| 400 | Papel invalido |

#### Regras de negocio

- O sistema deve ter pelo menos um ADMIN ativo em todos os momentos.
- Se o usuario alvo e o ultimo ADMIN e a mudanca e para outro papel, a requisicao e rejeitada.
- Ao rebaixar um COORDINATOR para ACOLYTE/GUARDIAN, as escalas que ele criou nao sao afetadas.
- Registro na trilha de auditoria global.

---

### 8.3 GET /api/admin/functions

Lista todas as funcoes liturgicas, incluindo inativas.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/admin/functions` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Response (200 OK)

```typescript
interface AdminFunctionDetail extends LiturgicalFunctionSummary {
  usageCount: number;        // acolitos com esta funcao habilitada
  assignmentCount: number;   // total de atribuicoes em escalas
  createdAt: string;
  updatedAt: string;
}

interface AdminListFunctionsResponse {
  success: true;
  data: AdminFunctionDetail[];
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |

#### Regras de negocio

- Retorna todas as funcoes, incluindo inativas, com estatisticas de uso.
- Ordenacao por `displayOrder`.

---

### 8.4 POST /api/admin/functions

Cria uma nova funcao liturgica.

| Item | Valor |
|------|-------|
| **Metodo** | POST |
| **Caminho** | `/api/admin/functions` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Request

```typescript
interface CreateFunctionRequest {
  name: string;            // min: 2, max: 100, unico
  description: string;     // min: 2, max: 500
  displayOrder: number;    // inteiro positivo para ordenacao
}
```

#### Response (201 Created)

```typescript
interface CreateFunctionResponse {
  success: true;
  data: LiturgicalFunctionSummary;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 409 | Nome da funcao ja existe |
| 422 | Campos obrigatorios ausentes ou invalidos |

#### Regras de negocio

- A funcao e criada como ativa por padrao.
- O nome deve ser unico (case-insensitive).

---

### 8.5 PATCH /api/admin/functions/:id

Edita uma funcao liturgica existente.

| Item | Valor |
|------|-------|
| **Metodo** | PATCH |
| **Caminho** | `/api/admin/functions/:id` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Path Parameters

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `id` | number | ID da funcao |

#### Request

```typescript
interface UpdateFunctionRequest {
  name?: string;           // min: 2, max: 100, unico
  description?: string;    // min: 2, max: 500
  displayOrder?: number;
  active?: boolean;
}
```

#### Response (200 OK)

```typescript
interface UpdateFunctionResponse {
  success: true;
  data: LiturgicalFunctionSummary;
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |
| 404 | Funcao nao encontrada |
| 409 | Novo nome ja em uso |
| 422 | Campos invalidos |

#### Regras de negocio

- Desativar uma funcao (`active: false`) nao remove atribuicoes existentes em escalas.
- Funcoes inativas nao podem ser atribuidas a novos acolitos nem usadas em novos requisitos de celebracao.
- O nome deve permanecer unico (case-insensitive).

---

### 8.6 GET /api/admin/audit-log

Retorna o log de auditoria global do sistema.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/admin/audit-log` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Query Parameters

| Parametro | Tipo | Obrigatorio | Default | Descricao |
|-----------|------|-------------|---------|-----------|
| `page` | number | Nao | 1 | Pagina |
| `perPage` | number | Nao | 50 | Itens por pagina |
| `action` | string | Nao | — | Filtrar por tipo de acao |
| `userId` | number | Nao | — | Filtrar por usuario que executou a acao |
| `startDate` | string (date) | Nao | — | Filtrar a partir desta data |
| `endDate` | string (date) | Nao | — | Filtrar ate esta data |

#### Response (200 OK)

```typescript
interface AdminAuditLogResponse {
  success: true;
  data: AuditLogEntry[];
  pagination: Pagination;
}
```

#### Acoes registradas

| Acao | Descricao |
|------|-----------|
| `USER_CREATED` | Novo usuario registrado |
| `USER_UPDATED` | Dados de usuario alterados |
| `USER_DEACTIVATED` | Usuario desativado |
| `ROLE_CHANGED` | Papel de usuario alterado |
| `FUNCTION_CREATED` | Nova funcao liturgica criada |
| `FUNCTION_UPDATED` | Funcao liturgica alterada |
| `CELEBRATION_CREATED` | Celebracao criada |
| `CELEBRATION_UPDATED` | Celebracao alterada |
| `CELEBRATION_DELETED` | Celebracao removida |
| `SCHEDULE_GENERATED` | Escala gerada automaticamente |
| `SCHEDULE_PUBLISHED` | Escala publicada |
| `SCHEDULE_ARCHIVED` | Escala arquivada |
| `ASSIGNMENT_CREATED` | Atribuicao manual criada |
| `ASSIGNMENT_UPDATED` | Atribuicao alterada |
| `ASSIGNMENT_DELETED` | Atribuicao removida |
| `GUARDIAN_LINKED` | Acolito vinculado a responsavel |
| `AVAILABILITY_UPDATED` | Indisponibilidade atualizada |

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |

---

### 8.7 GET /api/admin/stats

Retorna estatisticas gerais do sistema.

| Item | Valor |
|------|-------|
| **Metodo** | GET |
| **Caminho** | `/api/admin/stats` |
| **Autenticacao** | Bearer Token |
| **Papeis permitidos** | ADMIN |

#### Response (200 OK)

```typescript
interface AdminStatsResponse {
  success: true;
  data: {
    users: {
      total: number;
      active: number;
      inactive: number;
      byRole: {
        ACOLYTE: number;
        GUARDIAN: number;
        COORDINATOR: number;
        ADMIN: number;
      };
    };
    celebrations: {
      total: number;
      upcoming: number;  // celebracoes futuras
      byType: Record<CelebrationType, number>;
    };
    schedules: {
      total: number;
      byStatus: {
        DRAFT: number;
        PUBLISHED: number;
        ARCHIVED: number;
      };
    };
    functions: {
      total: number;
      active: number;
    };
    recentActivity: AuditLogEntry[]; // ultimas 10 acoes
  };
}
```

#### Erros

| Codigo | Cenario |
|--------|---------|
| 401 | Nao autenticado |
| 403 | Papel insuficiente |

#### Regras de negocio

- Estatisticas sao calculadas em tempo real (sem cache).
- `upcoming` conta celebracoes com data >= hoje.
- `recentActivity` retorna os 10 registros mais recentes do log de auditoria.

---

## Apendice A: Resumo de Endpoints

| # | Metodo | Caminho | Papel Minimo | Descricao |
|---|--------|---------|-------------|-----------|
| 1 | POST | `/api/auth/register` | Publico | Registro de usuario |
| 2 | POST | `/api/auth/login` | Publico | Autenticacao |
| 3 | POST | `/api/auth/logout` | Autenticado | Invalidar token |
| 4 | GET | `/api/auth/me` | Autenticado | Perfil do usuario |
| 5 | GET | `/api/users` | COORDINATOR | Listar usuarios |
| 6 | GET | `/api/users/:id` | Autenticado* | Detalhe do usuario |
| 7 | PATCH | `/api/users/:id` | Autenticado* | Editar usuario |
| 8 | DELETE | `/api/users/:id` | ADMIN | Desativar usuario |
| 9 | GET | `/api/servers` | Autenticado* | Listar acolitos |
| 10 | GET | `/api/servers/:id` | Autenticado* | Detalhe do acolito |
| 11 | GET | `/api/servers/:id/availability` | Autenticado* | Indisponibilidades |
| 12 | PUT | `/api/servers/:id/availability` | Autenticado* | Definir indisponibilidades |
| 13 | GET | `/api/servers/:id/functions` | Autenticado* | Funcoes do acolito |
| 14 | PUT | `/api/servers/:id/functions` | COORDINATOR | Definir funcoes |
| 15 | GET | `/api/servers/:id/history` | Autenticado* | Historico de servicos |
| 16 | GET | `/api/guardians` | COORDINATOR | Listar responsaveis |
| 17 | GET | `/api/guardians/:id/acolytes` | Autenticado* | Acolitos vinculados |
| 18 | POST | `/api/guardians/:id/link` | COORDINATOR | Vincular acolito |
| 19 | GET | `/api/celebrations` | Autenticado | Listar celebracoes |
| 20 | POST | `/api/celebrations` | COORDINATOR | Criar celebracao |
| 21 | GET | `/api/celebrations/:id` | Autenticado | Detalhe da celebracao |
| 22 | PATCH | `/api/celebrations/:id` | COORDINATOR | Editar celebracao |
| 23 | DELETE | `/api/celebrations/:id` | COORDINATOR | Remover celebracao |
| 24 | PUT | `/api/celebrations/:id/requirements` | COORDINATOR | Definir requisitos |
| 25 | GET | `/api/schedules` | Autenticado* | Listar escalas |
| 26 | POST | `/api/schedules/generate` | COORDINATOR | Gerar escala |
| 27 | GET | `/api/schedules/:id` | Autenticado* | Detalhe da escala |
| 28 | PATCH | `/api/schedules/:id` | COORDINATOR | Editar escala |
| 29 | POST | `/api/schedules/:id/publish` | COORDINATOR | Publicar escala |
| 30 | POST | `/api/schedules/:id/assignments` | COORDINATOR | Atribuicao manual |
| 31 | PATCH | `/api/schedules/:id/assignments/:assignmentId` | COORDINATOR | Editar atribuicao |
| 32 | DELETE | `/api/schedules/:id/assignments/:assignmentId` | COORDINATOR | Remover atribuicao |
| 33 | GET | `/api/schedules/:id/audit` | COORDINATOR | Auditoria da escala |
| 34 | GET | `/api/public/schedules/:token` | Publico | Escala publica |
| 35 | GET | `/api/public/schedules/:token/period` | Publico | Escala publica por periodo |
| 36 | GET | `/api/admin/users` | ADMIN | Listar usuarios (admin) |
| 37 | PATCH | `/api/admin/users/:id/role` | ADMIN | Alterar papel |
| 38 | GET | `/api/admin/functions` | ADMIN | Listar funcoes |
| 39 | POST | `/api/admin/functions` | ADMIN | Criar funcao |
| 40 | PATCH | `/api/admin/functions/:id` | ADMIN | Editar funcao |
| 41 | GET | `/api/admin/audit-log` | ADMIN | Log de auditoria global |
| 42 | GET | `/api/admin/stats` | ADMIN | Estatisticas |

> \* **Autenticado***: acesso permitido a qualquer usuario autenticado, mas com restricao de escopo (row-level). ACOLYTE ve apenas seus proprios dados, GUARDIAN ve dados de acolitos vinculados, COORDINATOR+ ve todos.

---

## Apendice B: Headers Padrao

### Request

| Header | Valor | Obrigatorio |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Sim (para POST/PUT/PATCH) |
| `Authorization` | `Bearer <token>` | Sim (exceto rotas publicas) |
| `Accept` | `application/json` | Recomendado |

### Response

| Header | Valor |
|--------|-------|
| `Content-Type` | `application/json; charset=utf-8` |
| `X-Request-Id` | UUID unico por requisicao (rastreabilidade) |
| `X-RateLimit-Limit` | Limite de requisicoes por janela |
| `X-RateLimit-Remaining` | Requisicoes restantes |
| `X-RateLimit-Reset` | Timestamp Unix de reset da janela |

---

## Apendice C: Rate Limiting

| Categoria | Limite | Janela |
|-----------|--------|--------|
| Rotas autenticadas | 100 requisicoes | 1 minuto |
| `POST /api/auth/login` | 10 tentativas | 1 minuto |
| `POST /api/auth/register` | 5 tentativas | 1 minuto |
| `POST /api/schedules/generate` | 3 tentativas | 5 minutos |
| Rotas publicas (`/api/public/*`) | 30 requisicoes | 1 minuto |

Ao exceder o limite, o servidor retorna:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Limite de requisicoes excedido. Tente novamente em X segundos."
}
```

---

## Apendice D: Versionamento

A API nao utiliza versionamento explicito na URL (sem `/v1/`). Mudancas incompativeis serao comunicadas com antecedencia e depreciacao gradual. O header `X-API-Deprecation` sera incluido em endpoints marcados para remocao futura.
