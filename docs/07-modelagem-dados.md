# 07 — Modelagem de Dados

## Sumario

Este documento define o schema completo do banco de dados do Liturgix, utilizando **Prisma ORM** com PostgreSQL 16. Todas as entidades, relacionamentos, indices, convencoes de nomenclatura e dados iniciais (seed) estao documentados aqui.

---

## Convencoes

| Aspecto | Convencao |
|---------|-----------|
| Nomenclatura Prisma | `camelCase` para campos e modelos |
| Nomenclatura PostgreSQL | `snake_case` via `@map` e `@@map` |
| IDs | `Int` autoincrement |
| Exclusao | Soft delete via campo `active` (sem exclusao fisica) |
| Timestamps | `createdAt` com `@default(now())`, `updatedAt` com `@updatedAt` |
| Cascata | `onDelete: Cascade` para dependencias fortes, `Restrict` para proteger integridade |
| Indices | Campos frequentemente consultados recebem `@@index` explicito |

---

## Schema Prisma Completo

```prisma
// ============================================================
// Liturgix — Prisma Schema
// PostgreSQL 16 | Prisma 5+
// ============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────

enum Role {
  ACOLYTE
  GUARDIAN
  COORDINATOR
  ADMIN

  @@map("role")
}

enum CelebrationType {
  SUNDAY_MASS
  WEEKDAY_MASS
  HOLY_DAY
  SPECIAL

  @@map("celebration_type")
}

enum ScheduleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED

  @@map("schedule_status")
}

// ────────────────────────────────────────────────────────────
// 1. User
// ────────────────────────────────────────────────────────────

model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         Role     @default(ACOLYTE)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relacionamentos — Responsavel (Guardian)
  guardianLinks  GuardianLink[] @relation("Guardian")
  acolyteLinks   GuardianLink[] @relation("Acolyte")

  // Relacionamentos — Funcoes e Disponibilidade
  userFunctions   UserFunction[]
  unavailabilities Unavailability[]

  // Relacionamentos — Escalas
  createdSchedules    Schedule[]           @relation("ScheduleCreator")
  scheduleAssignments ScheduleAssignment[]
  serviceRecords      ServiceRecord[]
  auditLogs           ScheduleAuditLog[]

  @@index([email])
  @@index([role])
  @@index([active])
  @@map("users")
}

// ────────────────────────────────────────────────────────────
// 2. GuardianLink
//    Vincula um responsavel (GUARDIAN) a um acolito menor.
// ────────────────────────────────────────────────────────────

model GuardianLink {
  id         Int      @id @default(autoincrement())
  guardianId Int      @map("guardian_id")
  acolyteId  Int      @map("acolyte_id")
  createdAt  DateTime @default(now()) @map("created_at")

  guardian User @relation("Guardian", fields: [guardianId], references: [id], onDelete: Cascade)
  acolyte  User @relation("Acolyte", fields: [acolyteId], references: [id], onDelete: Cascade)

  @@unique([guardianId, acolyteId])
  @@index([guardianId])
  @@index([acolyteId])
  @@map("guardian_links")
}

// ────────────────────────────────────────────────────────────
// 3. LiturgicalFunction
//    As 9 funcoes liturgicas que um acolito pode exercer.
// ────────────────────────────────────────────────────────────

model LiturgicalFunction {
  id           Int      @id @default(autoincrement())
  name         String   @unique
  description  String?
  active       Boolean  @default(true)
  displayOrder Int      @map("display_order")
  createdAt    DateTime @default(now()) @map("created_at")

  // Relacionamentos
  userFunctions                UserFunction[]
  celebrationFunctionRequirements CelebrationFunctionRequirement[]
  scheduleAssignments          ScheduleAssignment[]
  serviceRecords               ServiceRecord[]

  @@index([active])
  @@index([displayOrder])
  @@map("liturgical_functions")
}

// ────────────────────────────────────────────────────────────
// 4. UserFunction
//    Quais funcoes cada acolito esta habilitado a exercer.
// ────────────────────────────────────────────────────────────

model UserFunction {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  functionId Int      @map("function_id")
  assignedAt DateTime @default(now()) @map("assigned_at")

  user     User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  function LiturgicalFunction @relation(fields: [functionId], references: [id], onDelete: Cascade)

  @@unique([userId, functionId])
  @@index([userId])
  @@index([functionId])
  @@map("user_functions")
}

// ────────────────────────────────────────────────────────────
// 5. Unavailability
//    Datas em que o acolito NAO pode servir.
// ────────────────────────────────────────────────────────────

model Unavailability {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  date      DateTime @db.Date
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId])
  @@index([date])
  @@map("unavailabilities")
}

// ────────────────────────────────────────────────────────────
// 6. Celebration
//    Celebracoes liturgicas (missas, festas, etc.).
// ────────────────────────────────────────────────────────────

model Celebration {
  id        Int              @id @default(autoincrement())
  name      String
  date      DateTime
  type      CelebrationType  @default(SUNDAY_MASS)
  location  String?
  notes     String?
  active    Boolean          @default(true)
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")

  // Relacionamentos
  functionRequirements CelebrationFunctionRequirement[]
  scheduleAssignments  ScheduleAssignment[]
  serviceRecords       ServiceRecord[]

  @@index([date])
  @@index([type])
  @@index([active])
  @@map("celebrations")
}

// ────────────────────────────────────────────────────────────
// 7. CelebrationFunctionRequirement
//    Quantos acolitos por funcao uma celebracao precisa.
// ────────────────────────────────────────────────────────────

model CelebrationFunctionRequirement {
  id            Int @id @default(autoincrement())
  celebrationId Int @map("celebration_id")
  functionId    Int @map("function_id")
  quantity      Int @default(1)

  celebration Celebration        @relation(fields: [celebrationId], references: [id], onDelete: Cascade)
  function    LiturgicalFunction @relation(fields: [functionId], references: [id], onDelete: Cascade)

  @@unique([celebrationId, functionId])
  @@index([celebrationId])
  @@index([functionId])
  @@map("celebration_function_requirements")
}

// ────────────────────────────────────────────────────────────
// 8. Schedule
//    Escala gerada para um periodo.
// ────────────────────────────────────────────────────────────

model Schedule {
  id            Int             @id @default(autoincrement())
  name          String
  startDate     DateTime        @map("start_date") @db.Date
  endDate       DateTime        @map("end_date") @db.Date
  status        ScheduleStatus  @default(DRAFT)
  publicToken   String?         @unique @map("public_token")
  generatedAt   DateTime        @default(now()) @map("generated_at")
  publishedAt   DateTime?       @map("published_at")
  createdById   Int             @map("created_by_id")
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  createdBy   User                 @relation("ScheduleCreator", fields: [createdById], references: [id], onDelete: Restrict)
  assignments ScheduleAssignment[]
  auditLogs   ScheduleAuditLog[]
  serviceRecords ServiceRecord[]

  @@index([status])
  @@index([startDate, endDate])
  @@index([publicToken])
  @@index([createdById])
  @@map("schedules")
}

// ────────────────────────────────────────────────────────────
// 9. ScheduleAssignment
//    Atribuicao de um acolito a uma funcao em uma celebracao
//    dentro de uma escala.
// ────────────────────────────────────────────────────────────

model ScheduleAssignment {
  id            Int      @id @default(autoincrement())
  scheduleId    Int      @map("schedule_id")
  celebrationId Int      @map("celebration_id")
  functionId    Int      @map("function_id")
  userId        Int?     @map("user_id")
  locked        Boolean  @default(false)
  score         Float?
  auditData     Json?    @map("audit_data")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  schedule    Schedule           @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  celebration Celebration        @relation(fields: [celebrationId], references: [id], onDelete: Cascade)
  function    LiturgicalFunction @relation(fields: [functionId], references: [id], onDelete: Cascade)
  user        User?              @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([scheduleId, celebrationId, functionId, userId])
  @@index([scheduleId])
  @@index([celebrationId])
  @@index([functionId])
  @@index([userId])
  @@map("schedule_assignments")
}

// ────────────────────────────────────────────────────────────
// 10. ServiceRecord
//     Historico de servicos efetivamente prestados.
// ────────────────────────────────────────────────────────────

model ServiceRecord {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  celebrationId Int      @map("celebration_id")
  functionId    Int      @map("function_id")
  scheduleId    Int      @map("schedule_id")
  servedAt      DateTime @map("served_at")
  createdAt     DateTime @default(now()) @map("created_at")

  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  celebration Celebration        @relation(fields: [celebrationId], references: [id], onDelete: Cascade)
  function    LiturgicalFunction @relation(fields: [functionId], references: [id], onDelete: Cascade)
  schedule    Schedule           @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([celebrationId])
  @@index([servedAt])
  @@index([scheduleId])
  @@map("service_records")
}

// ────────────────────────────────────────────────────────────
// 11. ScheduleAuditLog
//     Log de auditoria de acoes sobre escalas.
// ────────────────────────────────────────────────────────────

model ScheduleAuditLog {
  id            Int      @id @default(autoincrement())
  scheduleId    Int      @map("schedule_id")
  action        String
  performedById Int      @map("performed_by_id")
  details       Json
  createdAt     DateTime @default(now()) @map("created_at")

  schedule    Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  performedBy User     @relation(fields: [performedById], references: [id], onDelete: Restrict)

  @@index([scheduleId])
  @@index([performedById])
  @@index([action])
  @@index([createdAt])
  @@map("schedule_audit_logs")
}
```

---

## Descricao das Entidades

### 1. User (`users`)

Entidade central do sistema. Representa qualquer pessoa com acesso: acolito, responsavel, coordenador ou administrador.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `name` | String | Nome completo |
| `email` | String (unique) | Email para login |
| `passwordHash` | String | Hash bcrypt da senha |
| `role` | Role (enum) | Papel no sistema |
| `active` | Boolean | Soft delete flag |
| `createdAt` | DateTime | Data de criacao |
| `updatedAt` | DateTime | Ultima atualizacao |

**Roles:**
- `ACOLYTE` — Acolito comum, pode informar disponibilidade e consultar escalas
- `GUARDIAN` — Responsavel por acolitos menores, gerencia disponibilidade deles
- `COORDINATOR` — Gera, edita e publica escalas
- `ADMIN` — Acesso total ao sistema

### 2. GuardianLink (`guardian_links`)

Relacionamento N:N entre responsaveis e acolitos menores de idade. Um responsavel pode ter varios acolitos, e um acolito pode ter mais de um responsavel.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `guardianId` | Int (FK → User) | Responsavel |
| `acolyteId` | Int (FK → User) | Acolito menor |
| `createdAt` | DateTime | Data do vinculo |

**Cascade:** Se o User (responsavel ou acolito) for removido, o vinculo e removido em cascata.

### 3. LiturgicalFunction (`liturgical_functions`)

As funcoes liturgicas que um acolito pode exercer durante uma celebracao. O sistema e inicializado com 9 funcoes padrao (ver Seed Data).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `name` | String (unique) | Nome da funcao |
| `description` | String? | Descricao opcional |
| `active` | Boolean | Se a funcao esta ativa |
| `displayOrder` | Int | Ordem de exibicao na UI |
| `createdAt` | DateTime | Data de criacao |

### 4. UserFunction (`user_functions`)

Tabela de juncao que define quais funcoes cada acolito esta habilitado a exercer. Um acolito pode ter varias funcoes, e uma funcao pode ser exercida por varios acolitos.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `userId` | Int (FK → User) | Acolito |
| `functionId` | Int (FK → LiturgicalFunction) | Funcao liturgica |
| `assignedAt` | DateTime | Data da atribuicao |

**Cascade:** Remocao do User ou da LiturgicalFunction remove a associacao.

### 5. Unavailability (`unavailabilities`)

Datas em que um acolito nao pode servir. O algoritmo de geracao de escalas consulta esta tabela para respeitar indisponibilidades.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `userId` | Int (FK → User) | Acolito |
| `date` | Date | Data da indisponibilidade |
| `reason` | String? | Motivo (opcional) |
| `createdAt` | DateTime | Data do registro |

**Constraint:** Um acolito so pode ter uma entrada de indisponibilidade por data.

### 6. Celebration (`celebrations`)

Celebracoes liturgicas que compoem uma escala. Cada celebracao tem um tipo, data/hora e requisitos de funcoes.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `name` | String | Nome da celebracao (ex: "Missa Dominical 10h") |
| `date` | DateTime | Data e hora da celebracao |
| `type` | CelebrationType | Tipo da celebracao |
| `location` | String? | Local (opcional) |
| `notes` | String? | Observacoes |
| `active` | Boolean | Soft delete flag |
| `createdAt` | DateTime | Data de criacao |
| `updatedAt` | DateTime | Ultima atualizacao |

**Tipos:**
- `SUNDAY_MASS` — Missa dominical
- `WEEKDAY_MASS` — Missa de dia de semana
- `HOLY_DAY` — Dia santo de guarda
- `SPECIAL` — Celebracao especial (Semana Santa, Natal, etc.)

### 7. CelebrationFunctionRequirement (`celebration_function_requirements`)

Define quantos acolitos por funcao sao necessarios em cada celebracao. Por exemplo, uma missa dominical pode precisar de 2 Ceroferarios e 1 Cruciferario.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `celebrationId` | Int (FK → Celebration) | Celebracao |
| `functionId` | Int (FK → LiturgicalFunction) | Funcao liturgica |
| `quantity` | Int (default: 1) | Quantidade de acolitos necessarios |

### 8. Schedule (`schedules`)

Uma escala gerada para um periodo de datas. Pode estar em rascunho, publicada ou arquivada. Quando publicada, recebe um `publicToken` para acesso publico sem autenticacao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `name` | String | Nome da escala (ex: "Escala Abril 2026") |
| `startDate` | Date | Inicio do periodo |
| `endDate` | Date | Fim do periodo |
| `status` | ScheduleStatus | Estado atual |
| `publicToken` | String? (unique) | Token para acesso publico |
| `generatedAt` | DateTime | Quando foi gerada |
| `publishedAt` | DateTime? | Quando foi publicada |
| `createdById` | Int (FK → User) | Coordenador que criou |
| `createdAt` | DateTime | Data de criacao |
| `updatedAt` | DateTime | Ultima atualizacao |

**Cascade:** `onDelete: Restrict` no `createdBy` — nao permite excluir o coordenador que criou a escala.

### 9. ScheduleAssignment (`schedule_assignments`)

Cada linha e uma atribuicao: "nesta escala, nesta celebracao, nesta funcao, este acolito serve". O campo `userId` e nullable para representar vagas ainda nao preenchidas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `scheduleId` | Int (FK → Schedule) | Escala |
| `celebrationId` | Int (FK → Celebration) | Celebracao |
| `functionId` | Int (FK → LiturgicalFunction) | Funcao |
| `userId` | Int? (FK → User) | Acolito atribuido (null = vaga aberta) |
| `locked` | Boolean (default: false) | Se a atribuicao esta travada (edicao manual) |
| `score` | Float? | Score do algoritmo de alocacao |
| `auditData` | Json? | Dados de auditoria do algoritmo |
| `createdAt` | DateTime | Data de criacao |
| `updatedAt` | DateTime | Ultima atualizacao |

**Cascade:** `onDelete: SetNull` no `user` — se o acolito for removido, a vaga fica aberta em vez de perder o registro da escala.

### 10. ServiceRecord (`service_records`)

Historico de servicos efetivamente prestados. Apos a celebracao ocorrer, o coordenador confirma a presenca e o registro e criado. Serve como base para o algoritmo de distribuicao justa.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `userId` | Int (FK → User) | Acolito que serviu |
| `celebrationId` | Int (FK → Celebration) | Celebracao |
| `functionId` | Int (FK → LiturgicalFunction) | Funcao exercida |
| `scheduleId` | Int (FK → Schedule) | Escala de referencia |
| `servedAt` | DateTime | Data/hora do servico |
| `createdAt` | DateTime | Data do registro |

### 11. ScheduleAuditLog (`schedule_audit_logs`)

Log de auditoria para rastrear todas as acoes realizadas sobre uma escala: geracao, edicoes manuais, publicacao, arquivamento.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | Int (PK) | Identificador unico |
| `scheduleId` | Int (FK → Schedule) | Escala |
| `action` | String | Tipo da acao (ex: "GENERATED", "ASSIGNMENT_CHANGED", "PUBLISHED") |
| `performedById` | Int (FK → User) | Quem executou |
| `details` | Json | Detalhes da acao (dados anteriores/posteriores) |
| `createdAt` | DateTime | Quando ocorreu |

**Cascade:** `onDelete: Restrict` no `performedBy` — preserva integridade do log de auditoria.

---

## Comportamento de Cascade (Resumo)

| Relacao | onDelete | Justificativa |
|---------|----------|---------------|
| GuardianLink → User (guardian) | Cascade | Vinculo perde sentido sem o responsavel |
| GuardianLink → User (acolyte) | Cascade | Vinculo perde sentido sem o acolito |
| UserFunction → User | Cascade | Habilitacao depende do acolito |
| UserFunction → LiturgicalFunction | Cascade | Habilitacao depende da funcao |
| Unavailability → User | Cascade | Indisponibilidade pertence ao acolito |
| CelebrationFunctionRequirement → Celebration | Cascade | Requisito pertence a celebracao |
| CelebrationFunctionRequirement → LiturgicalFunction | Cascade | Requisito pertence a funcao |
| Schedule → User (createdBy) | **Restrict** | Protege historico — nao apagar coordenador com escalas |
| ScheduleAssignment → Schedule | Cascade | Atribuicoes pertencem a escala |
| ScheduleAssignment → Celebration | Cascade | Remove atribuicoes de celebracoes excluidas |
| ScheduleAssignment → LiturgicalFunction | Cascade | Remove atribuicoes de funcoes excluidas |
| ScheduleAssignment → User | **SetNull** | Vaga fica aberta em vez de perder o slot |
| ServiceRecord → User | Cascade | Historico acompanha o acolito |
| ServiceRecord → Celebration | Cascade | Historico acompanha a celebracao |
| ServiceRecord → LiturgicalFunction | Cascade | Historico acompanha a funcao |
| ServiceRecord → Schedule | Cascade | Historico acompanha a escala |
| ScheduleAuditLog → Schedule | Cascade | Log pertence a escala |
| ScheduleAuditLog → User (performedBy) | **Restrict** | Protege integridade do log de auditoria |

---

## Indices

Alem das chaves primarias e constraints unique (que geram indices automaticamente), os seguintes indices explicitos sao definidos para otimizar consultas frequentes:

| Tabela | Campos | Justificativa |
|--------|--------|---------------|
| `users` | `email` | Login por email |
| `users` | `role` | Filtro por papel |
| `users` | `active` | Filtro de usuarios ativos |
| `guardian_links` | `guardian_id` | Buscar acolitos de um responsavel |
| `guardian_links` | `acolyte_id` | Buscar responsaveis de um acolito |
| `liturgical_functions` | `active` | Filtro de funcoes ativas |
| `liturgical_functions` | `display_order` | Ordenacao na UI |
| `user_functions` | `user_id` | Funcoes de um acolito |
| `user_functions` | `function_id` | Acolitos habilitados para uma funcao |
| `unavailabilities` | `user_id` | Indisponibilidades de um acolito |
| `unavailabilities` | `date` | Verificar indisponibilidades em uma data |
| `celebrations` | `date` | Celebracoes por data |
| `celebrations` | `type` | Filtro por tipo |
| `celebrations` | `active` | Filtro de celebracoes ativas |
| `celebration_function_requirements` | `celebration_id` | Requisitos de uma celebracao |
| `celebration_function_requirements` | `function_id` | Celebracoes que usam uma funcao |
| `schedules` | `status` | Filtro por estado |
| `schedules` | `start_date, end_date` | Busca por periodo |
| `schedules` | `public_token` | Acesso publico por token |
| `schedules` | `created_by_id` | Escalas de um coordenador |
| `schedule_assignments` | `schedule_id` | Atribuicoes de uma escala |
| `schedule_assignments` | `celebration_id` | Atribuicoes de uma celebracao |
| `schedule_assignments` | `function_id` | Atribuicoes por funcao |
| `schedule_assignments` | `user_id` | Atribuicoes de um acolito |
| `service_records` | `user_id` | Historico de um acolito |
| `service_records` | `celebration_id` | Historico de uma celebracao |
| `service_records` | `served_at` | Consulta por periodo |
| `service_records` | `schedule_id` | Registros de uma escala |
| `schedule_audit_logs` | `schedule_id` | Logs de uma escala |
| `schedule_audit_logs` | `performed_by_id` | Acoes de um usuario |
| `schedule_audit_logs` | `action` | Filtro por tipo de acao |
| `schedule_audit_logs` | `created_at` | Ordenacao cronologica |

---

## Seed Data — Funcoes Liturgicas Iniciais

As 9 funcoes liturgicas padrao devem ser inseridas na primeira migracao ou via script de seed:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const liturgicalFunctions = [
  {
    name: 'Cruciferario',
    description: 'Porta a cruz processional durante a entrada e saida da celebracao.',
    displayOrder: 1,
  },
  {
    name: 'Ceroferario',
    description: 'Porta os cirios (velas) que ladeiam a cruz processional, o Evangelho e o altar.',
    displayOrder: 2,
  },
  {
    name: 'Turiferario',
    description: 'Porta e maneja o turibulo com o incenso durante a celebracao.',
    displayOrder: 3,
  },
  {
    name: 'Naveteiro',
    description: 'Porta a naveta com o incenso e auxilia o turiferario.',
    displayOrder: 4,
  },
  {
    name: 'Acolito do Missal',
    description: 'Segura e apresenta o Missal Romano ao celebrante durante as oracoes.',
    displayOrder: 5,
  },
  {
    name: 'Acolito das Galhetas',
    description: 'Apresenta as galhetas com agua e vinho durante o ofertorio.',
    displayOrder: 6,
  },
  {
    name: 'Acolito da Credencia',
    description: 'Cuida da mesa da credencia e auxilia na preparacao dos objetos liturgicos.',
    displayOrder: 7,
  },
  {
    name: 'Acolito da Patena',
    description: 'Porta a patena durante a distribuicao da comunhao.',
    displayOrder: 8,
  },
  {
    name: 'Cerimoniario',
    description: 'Coordena os demais acolitos e o andamento da celebracao. Funcao de lideranca.',
    displayOrder: 9,
  },
]

async function main() {
  console.log('Seeding liturgical functions...')

  for (const fn of liturgicalFunctions) {
    await prisma.liturgicalFunction.upsert({
      where: { name: fn.name },
      update: {},
      create: fn,
    })
  }

  console.log(`Seeded ${liturgicalFunctions.length} liturgical functions.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Resumo das funcoes:**

| # | Funcao | Descricao resumida |
|---|--------|--------------------|
| 1 | Cruciferario | Porta a cruz processional |
| 2 | Ceroferario | Porta os cirios (velas) |
| 3 | Turiferario | Porta e maneja o turibulo |
| 4 | Naveteiro | Porta a naveta com incenso |
| 5 | Acolito do Missal | Segura o Missal Romano |
| 6 | Acolito das Galhetas | Apresenta agua e vinho |
| 7 | Acolito da Credencia | Cuida da mesa da credencia |
| 8 | Acolito da Patena | Porta a patena na comunhao |
| 9 | Cerimoniario | Coordena os acolitos |

---

## Diagrama Entidade-Relacionamento

```
┌─────────────────────┐
│       User          │
│─────────────────────│
│ id (PK)             │
│ name                │
│ email (UQ)          │
│ passwordHash        │
│ role                │
│ active              │
│ createdAt           │
│ updatedAt           │
└──────┬──────────────┘
       │
       ├──────────────── 1:N ──────────────────┐
       │                                       │
       │  ┌────────────────────┐               │
       │  │  GuardianLink      │               │
       │  │────────────────────│               │
       ├──│ guardianId (FK)    │               │
       └──│ acolyteId  (FK)   │               │
          │ createdAt          │               │
          │ UQ(guardianId,     │               │
          │    acolyteId)      │               │
          └────────────────────┘               │
                                               │
       ┌───────────────────────────────────────┘
       │
       ├──── 1:N ──── ┌─────────────────────┐
       │              │  UserFunction        │
       │              │─────────────────────│
       │              │ userId (FK → User)   │──── N:1 ────┐
       │              │ functionId (FK)      │             │
       │              │ assignedAt           │             │
       │              │ UQ(userId,functionId)│             │
       │              └─────────────────────┘             │
       │                                                   │
       ├──── 1:N ──── ┌─────────────────────┐             │
       │              │  Unavailability      │             │
       │              │─────────────────────│             │
       │              │ userId (FK → User)   │   ┌────────┴──────────────┐
       │              │ date                 │   │ LiturgicalFunction    │
       │              │ reason               │   │───────────────────────│
       │              │ UQ(userId, date)     │   │ id (PK)               │
       │              └─────────────────────┘   │ name (UQ)             │
       │                                         │ description           │
       │                                         │ active                │
       │                                         │ displayOrder          │
       │                                         │ createdAt             │
       │                                         └────────┬─────────────┘
       │                                                   │
       │                                                   │
       │  ┌──────────────────────────────┐                 │
       │  │  Celebration                 │                 │
       │  │──────────────────────────────│                 │
       │  │ id (PK)                      │                 │
       │  │ name                         │                 │
       │  │ date                         │                 │
       │  │ type                         │                 │
       │  │ location                     │                 │
       │  │ notes                        │                 │
       │  │ active                       │                 │
       │  │ createdAt                    │                 │
       │  │ updatedAt                    │                 │
       │  └──────────┬───────────────────┘                 │
       │             │                                     │
       │             ├── 1:N ─── ┌─────────────────────────┴────────────┐
       │             │           │ CelebrationFunctionRequirement       │
       │             │           │──────────────────────────────────────│
       │             │           │ celebrationId (FK → Celebration)     │
       │             │           │ functionId (FK → LiturgicalFunction) │
       │             │           │ quantity                             │
       │             │           │ UQ(celebrationId, functionId)        │
       │             │           └──────────────────────────────────────┘
       │             │
       │             │
       │  ┌──────────┴────────────────────────────────┐
       │  │  Schedule                                  │
       │  │────────────────────────────────────────────│
       │  │ id (PK)                                    │
       │  │ name                                       │
       │  │ startDate                                  │
       │  │ endDate                                    │
       │  │ status                                     │
       │  │ publicToken (UQ)                           │
       │  │ generatedAt                                │
       │  │ publishedAt                                │
       │  │ createdById (FK → User) ◄─── Restrict ────┤───── User
       │  │ createdAt                                  │
       │  │ updatedAt                                  │
       │  └──────────┬────────────────────────────────┘
       │             │
       │             ├── 1:N ─── ┌──────────────────────────────────────┐
       │             │           │  ScheduleAssignment                  │
       │             │           │──────────────────────────────────────│
       │             │           │ scheduleId (FK → Schedule)           │
       │             │           │ celebrationId (FK → Celebration)     │
       │             │           │ functionId (FK → LiturgicalFunction) │
       ├── N:1 ──────┤           │ userId (FK → User, nullable)        │──── SetNull
       │             │           │ locked                               │
       │             │           │ score                                │
       │             │           │ auditData                            │
       │             │           │ UQ(scheduleId, celebrationId,        │
       │             │           │    functionId, userId)               │
       │             │           └──────────────────────────────────────┘
       │             │
       │             ├── 1:N ─── ┌──────────────────────────────────────┐
       │             │           │  ServiceRecord                       │
       │             │           │──────────────────────────────────────│
       ├── N:1 ──────┤           │ userId (FK → User)                   │
       │             │           │ celebrationId (FK → Celebration)     │
       │             │           │ functionId (FK → LiturgicalFunction) │
       │             │           │ scheduleId (FK → Schedule)           │
       │             │           │ servedAt                             │
       │             │           │ createdAt                            │
       │             │           └──────────────────────────────────────┘
       │             │
       │             └── 1:N ─── ┌──────────────────────────────────────┐
       │                         │  ScheduleAuditLog                    │
       │                         │──────────────────────────────────────│
       ├── N:1 (Restrict) ──────│ performedById (FK → User)            │
                                 │ scheduleId (FK → Schedule)           │
                                 │ action                               │
                                 │ details (Json)                       │
                                 │ createdAt                            │
                                 └──────────────────────────────────────┘
```

**Legenda:**
- `PK` = Chave primaria
- `FK` = Chave estrangeira
- `UQ` = Constraint unique
- `1:N` = Um para muitos
- `N:1` = Muitos para um
- Setas indicam a direcao da foreign key
- `Cascade` e o comportamento padrao de `onDelete` (nao anotado)
- `Restrict` e `SetNull` sao anotados explicitamente

---

## Consultas Frequentes e Indices Relacionados

Para referencia, estas sao as consultas mais comuns do sistema e os indices que as suportam:

| Consulta | Indices utilizados |
|----------|--------------------|
| Login por email | `users.email` (unique) |
| Listar acolitos ativos | `users.active` + `users.role` |
| Funcoes de um acolito | `user_functions.user_id` |
| Acolitos habilitados para uma funcao | `user_functions.function_id` |
| Indisponibilidades para um periodo | `unavailabilities.date` + `unavailabilities.user_id` |
| Celebracoes de uma semana | `celebrations.date` + `celebrations.active` |
| Requisitos de uma celebracao | `celebration_function_requirements.celebration_id` |
| Atribuicoes de uma escala | `schedule_assignments.schedule_id` |
| Escala publica por token | `schedules.public_token` (unique) |
| Historico de servicos de um acolito | `service_records.user_id` + `service_records.served_at` |
| Log de auditoria de uma escala | `schedule_audit_logs.schedule_id` + `schedule_audit_logs.created_at` |

---

## Notas de Implementacao

1. **Prisma Migrate**: Usar `prisma migrate dev` em desenvolvimento e `prisma migrate deploy` em producao via Docker entrypoint.

2. **Seed**: Configurar o script de seed no `package.json`:
   ```json
   {
     "prisma": {
       "seed": "tsx prisma/seed.ts"
     }
   }
   ```

3. **Soft Delete**: Entidades com `active` flag nunca sao fisicamente deletadas. Queries devem incluir `where: { active: true }` por padrao. Considerar um middleware Prisma para aplicar o filtro automaticamente.

4. **Campos Json**: `auditData` em ScheduleAssignment e `details` em ScheduleAuditLog usam o tipo `Json` nativo do Prisma/PostgreSQL. Definir tipos TypeScript para validar a estrutura desses campos na camada de aplicacao.

5. **Public Token**: O campo `publicToken` em Schedule deve ser gerado como um UUID v4 ou string aleatoria segura no momento da publicacao. Nao gerar no momento da criacao (rascunho).

6. **Performance**: O indice composto `(start_date, end_date)` em schedules permite range queries eficientes para encontrar escalas que cobrem um periodo especifico.
