# Preferência de Turno (Dia/Noite) para Disponibilidade

**Data:** 2026-04-04
**Status:** Aprovado

## Resumo

Acólitos podem indicar se estão disponíveis apenas de manhã ou apenas à noite em dias específicos. O algoritmo de geração de escala usa essa informação para evitar atribuir acólitos a celebrações fora do seu turno preferido. Administradores veem badges visuais indicando se celebrações são diurnas ou noturnas.

## Decisões de Design

- **Corte dia/noite:** hardcoded 18:00 (padrão litúrgico). Feedback visual no admin mostra a classificação, mas sem configuração.
- **Modelo de dados:** expandir `Unavailability` com campo `period` (enum) em vez de modelo separado.
- **Interação do calendário:** ciclo de cliques no dia (disponível → indisponível → só manhã → só noite → disponível).
- **Cores:** bege (disponível), vermelho escuro (indisponível), dourado (manhã), azul escuro (noite).

## 1. Modelo de Dados

### Novo enum `Period`

```prisma
enum Period {
  ALL_DAY
  MORNING_ONLY
  NIGHT_ONLY

  @@map("period")
}
```

### Alteração em `Unavailability`

```prisma
model Unavailability {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  date      DateTime @db.Date
  period    Period   @default(ALL_DAY)   // NOVO
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId])
  @@index([date])
  @@map("unavailabilities")
}
```

### Semântica

| Estado no calendário | Registro no DB | Significado |
|---|---|---|
| Disponível (dia todo) | Nenhum registro | Pode servir em qualquer horário |
| Indisponível | `period: ALL_DAY` | Não pode servir nesse dia |
| Só manhã | `period: MORNING_ONLY` | Disponível apenas para celebrações < 18:00 |
| Só noite | `period: NIGHT_ONLY` | Disponível apenas para celebrações >= 18:00 |

Migração retrocompatível: registros existentes recebem `ALL_DAY` por default.

## 2. API

### GET `/servers/:id/availability?startDate=&endDate=`

Resposta ganha campo `period`:

```json
{
  "data": [
    { "date": "2026-04-10", "period": "ALL_DAY" },
    { "date": "2026-04-12", "period": "NIGHT_ONLY" }
  ]
}
```

### PUT `/servers/:id/availability`

Payload muda de array de strings para array de objetos:

```json
{
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "dates": [
    { "date": "2026-04-10", "period": "ALL_DAY" },
    { "date": "2026-04-12", "period": "NIGHT_ONLY" }
  ]
}
```

**Sem retrocompatibilidade com formato antigo.** O PUT antes aceitava `dates: string[]` (array de strings). Agora aceita `dates: { date, period }[]` (array de objetos). Frontend e backend devem ser atualizados atomicamente. Se `period` não vier no objeto, assume `ALL_DAY`.

### Validação (Zod)

```typescript
const dateEntry = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.enum(["ALL_DAY", "MORNING_ONLY", "NIGHT_ONLY"]).default("ALL_DAY"),
});

const putAvailabilityBody = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dates: z.array(dateEntry),
});
```

## 3. Algoritmo de Geração

### Lógica de filtragem (generator.ts)

Ao filtrar candidatos para um slot `(celebration, function)`:

```
hora = celebration.date.getHours()
isNight = hora >= 18

Para cada candidato:
  unavail = unavailMap.get(userId, dateStr)
  
  se não há registro → disponível
  se unavail.period === ALL_DAY → indisponível
  se unavail.period === MORNING_ONLY → disponível somente se !isNight
  se unavail.period === NIGHT_ONLY → disponível somente se isNight
```

### Estrutura de dados (types.ts)

```typescript
// Atualizar UnavailableDate (manter userId existente)
interface UnavailableDate {
  userId: number;
  date: string;       // YYYY-MM-DD
  period: "ALL_DAY" | "MORNING_ONLY" | "NIGHT_ONLY";
}
```

O `unavailMap` passa de `Map<number, Set<string>>` para `Map<number, Map<string, Period>>` (userId → date → period).

### Novo tipo de conflito (conflicts.ts)

```typescript
TIME_PREFERENCE_EXCLUDED = "TIME_PREFERENCE_EXCLUDED"
```

**Quando disparar:** quando existem candidatos qualificados e presentes no dia, mas TODOS foram excluídos por restrição de turno (nenhum era `ALL_DAY` unavailable — todos tinham preferência de turno incompatível).

**Precedência com conflitos existentes:**
- Se nenhum candidato qualificado existe → `NO_CANDIDATES` (existente)
- Se candidatos existem mas todos têm `period: ALL_DAY` → `ALL_UNAVAILABLE` (existente)
- Se candidatos existem, alguns estão no dia, mas todos excluídos por turno → `TIME_PREFERENCE_EXCLUDED` (novo)
- Se mistura de ALL_DAY e turno incompatível → `ALL_UNAVAILABLE` (o turno é apenas um motivo adicional)

**Texto sugerido:**
- description: `"Todos os acólitos qualificados estão disponíveis apenas em outro turno"`
- suggestedAction: `"Considere ajustar o horário da celebração ou atribuir manualmente"`

### Worker (worker.ts)

Atualizar a query de unavailabilities para incluir o campo `period` e converter para o novo formato de `UnavailableDate`.

## 4. UI do Calendário (Acólito)

### Interação: ciclo de cliques

Cada clique no dia avança o estado:

```
disponível → indisponível → só manhã → só noite → disponível
```

### Cores e visual

| Estado | Cor de fundo | Hex |
|---|---|---|
| Disponível | Bege/areia (base) | tema existente |
| Indisponível | Vermelho escuro | `#8b1a1a` |
| Só manhã | Dourado | `#f5c542` |
| Só noite | Azul escuro | `#3b5998` |

### Legenda

Barra de legenda fixa acima do calendário com os 4 estados e suas cores, substituindo a legenda atual de 2 estados.

### Resumo

Atualizar o resumo abaixo do calendário:
- Antes: "X disponíveis · Y indisponíveis"
- Depois: "X disponíveis · Y indisponíveis · Z manhã · W noite"

### Estado interno

```typescript
// Antes: Set<string> de datas indisponíveis
// Depois: Map<string, Period> onde key = YYYY-MM-DD
const [unavailDates, setUnavailDates] = useState<Map<string, Period>>(new Map());
```

### Indicador de mudanças não salvas

Manter o anel amber existente para dias modificados (comparação entre estado atual e estado salvo).

## 5. Feedback Visual no Admin

### Badge de turno nas celebrações

Em qualquer lugar que uma celebração aparece (listagem, detalhe de escala):

- Celebração com hora < 18:00 → badge dourado "Diurna"
- Celebração com hora >= 18:00 → badge azul "Noturna"

### Implementação

Função utilitária:

```typescript
function getCelebrationPeriod(date: Date): "day" | "night" {
  return date.getHours() >= 18 ? "night" : "day";
}
```

Componente badge reutilizável com as cores correspondentes.

## Arquivos Impactados

| Arquivo | Mudança |
|---|---|
| `backend/prisma/schema.prisma` | Enum `Period`, campo `period` em `Unavailability` |
| `backend/prisma/migrations/` | Nova migração |
| `backend/src/routes/availability.routes.ts` | GET retorna period, PUT aceita objetos |
| `backend/src/scheduling/types.ts` | `UnavailableDate` com period |
| `backend/src/scheduling/generator.ts` | Filtragem por turno |
| `backend/src/scheduling/conflicts.ts` | Novo tipo `TIME_PREFERENCE_EXCLUDED` |
| `backend/src/worker.ts` | Query inclui period |
| `frontend/src/pages/disponibilidade.tsx` | Ciclo 4 estados, cores, legenda, resumo |
| `frontend/src/types/index.ts` | Tipo Period no frontend |
| Componentes de celebração/escala | Badge diurna/noturna |
