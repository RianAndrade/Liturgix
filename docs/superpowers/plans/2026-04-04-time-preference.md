# Preferência de Turno (Dia/Noite) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow acolytes to mark morning-only or night-only availability per day, and have the scheduling algorithm respect these preferences.

**Architecture:** Extend the existing `Unavailability` model with a `Period` enum. The scheduling algorithm filters candidates by comparing celebration time (>= 18:00 = night) against the acolyte's period preference. The calendar UI cycles through 4 states on click.

**Tech Stack:** Prisma 6, Fastify 5, Zod 4, React 19, Tailwind CSS, BullMQ

**Spec:** `docs/superpowers/specs/2026-04-04-time-preference-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `backend/prisma/schema.prisma` | Add `Period` enum, add `period` field to `Unavailability` |
| Create | `backend/prisma/migrations/<timestamp>_add_period/migration.sql` | Via `prisma migrate dev` |
| Modify | `backend/src/scheduling/types.ts:28-31,65-70` | Add `period` to `UnavailableDate`, add `TIME_PREFERENCE_EXCLUDED` to `ConflictType` |
| Modify | `backend/src/scheduling/generator.ts:29-34,83-88` | Change `unavailMap` to `Map<number, Map<string, Period>>`, update filter logic |
| Modify | `backend/src/scheduling/conflicts.ts:7-69` | Add `TIME_PREFERENCE_EXCLUDED` detection with precedence rules |
| Modify | `backend/src/worker.ts:71-81` | Include `period` in unavailability query and mapping |
| Modify | `backend/src/routes/availability.routes.ts:5-9,28-34,59-75` | Update Zod schema, GET response, PUT transaction |
| Modify | `frontend/src/types/index.ts` | Add `Period` type |
| Modify | `frontend/src/pages/disponibilidade.tsx` | 4-state cycle, new colors, legend, summary |
| Modify | `frontend/src/pages/celebracoes.tsx` | Diurna/Noturna badge |
| Modify | `frontend/src/pages/escala-detalhe.tsx` | Diurna/Noturna badge on celebration |

---

### Task 1: Prisma Schema — Add Period Enum and Field

**Files:**
- Modify: `backend/prisma/schema.prisma:13-21` (enums section) and `:144-157` (Unavailability model)

- [ ] **Step 1: Add Period enum after existing enums**

In `backend/prisma/schema.prisma`, after the `ScheduleStatus` enum (line 38), add:

```prisma
enum Period {
  ALL_DAY
  MORNING_ONLY
  NIGHT_ONLY

  @@map("period")
}
```

- [ ] **Step 2: Add period field to Unavailability model**

In the `Unavailability` model (line 144), add the `period` field after `date`:

```prisma
model Unavailability {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  date      DateTime @db.Date
  period    Period   @default(ALL_DAY)
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId])
  @@index([date])
  @@map("unavailabilities")
}
```

- [ ] **Step 3: Generate and apply migration**

Run inside the `backend/` directory:

```bash
cd backend && npx prisma migrate dev --name add_period_to_unavailability
```

Expected: Migration created, `period` column added with default `ALL_DAY`. Existing rows get `ALL_DAY`.

- [ ] **Step 4: Verify migration**

```bash
cd backend && npx prisma migrate status
```

Expected: All migrations applied, no pending.

---

### Task 2: Backend Types — Update UnavailableDate and ConflictType

**Files:**
- Modify: `backend/src/scheduling/types.ts:28-31` and `:65-70`

- [ ] **Step 1: Add Period type alias**

At the top of `types.ts` (after line 11), add:

```typescript
export type Period = "ALL_DAY" | "MORNING_ONLY" | "NIGHT_ONLY";
```

- [ ] **Step 2: Update UnavailableDate interface**

Change lines 28-31 from:

```typescript
export interface UnavailableDate {
  userId: number;
  date: string; // YYYY-MM-DD
}
```

To:

```typescript
export interface UnavailableDate {
  userId: number;
  date: string; // YYYY-MM-DD
  period: Period;
}
```

- [ ] **Step 3: Add TIME_PREFERENCE_EXCLUDED to ConflictType**

Change lines 65-70 from:

```typescript
export type ConflictType =
  | "NO_CANDIDATES"
  | "INSUFFICIENT_CANDIDATES"
  | "OVERLOAD_SINGLE_CANDIDATE"
  | "ALL_UNAVAILABLE"
  | "QUALIFICATION_GAP";
```

To:

```typescript
export type ConflictType =
  | "NO_CANDIDATES"
  | "INSUFFICIENT_CANDIDATES"
  | "OVERLOAD_SINGLE_CANDIDATE"
  | "ALL_UNAVAILABLE"
  | "TIME_PREFERENCE_EXCLUDED"
  | "QUALIFICATION_GAP";
```

---

### Task 3: Scheduling Algorithm — Period-Aware Filtering

**Files:**
- Modify: `backend/src/scheduling/generator.ts:29-34` (unavailMap construction) and `:83-88` (filter logic)

- [ ] **Step 1: Change unavailMap from Set to Map**

Replace lines 29-34:

```typescript
  // Build lookup: userId -> set of unavailable date strings
  const unavailMap = new Map<number, Set<string>>();
  for (const u of unavailabilities) {
    if (!unavailMap.has(u.userId)) unavailMap.set(u.userId, new Set());
    unavailMap.get(u.userId)!.add(u.date);
  }
```

With:

```typescript
  // Build lookup: userId -> (date -> period)
  const unavailMap = new Map<number, Map<string, string>>();
  for (const u of unavailabilities) {
    if (!unavailMap.has(u.userId)) unavailMap.set(u.userId, new Map());
    unavailMap.get(u.userId)!.set(u.date, u.period);
  }
```

- [ ] **Step 2: Add isNight helper at top of generateSchedule**

After the `unavailMap` construction, before the `qualifiedMap` construction, add:

```typescript
  // Night threshold: celebrations at 18:00 or later are "night"
  const NIGHT_HOUR = 18;
```

- [ ] **Step 3: Update candidate filter logic**

Replace lines 82-88:

```typescript
    // Filter: available on date + not already in this celebration
    const available = qualified.filter((a) => {
      const unavail = unavailMap.get(a.id);
      if (unavail?.has(dateStr)) return false;
      if (state.isAssignedInCelebration(slot.celebrationId, a.id)) return false;
      return true;
    });
```

With:

```typescript
    // Filter: available on date+period + not already in this celebration
    const isNight = slot.celebrationDate.getHours() >= NIGHT_HOUR;
    const available = qualified.filter((a) => {
      const periods = unavailMap.get(a.id);
      if (periods) {
        const period = periods.get(dateStr);
        if (period) {
          if (period === "ALL_DAY") return false;
          if (period === "MORNING_ONLY" && isNight) return false;
          if (period === "NIGHT_ONLY" && !isNight) return false;
        }
      }
      if (state.isAssignedInCelebration(slot.celebrationId, a.id)) return false;
      return true;
    });
```

- [ ] **Step 4: Track time-excluded count for conflict detection**

After the `available` filter and before the `detectConflict` call (line 91), add a count of candidates excluded specifically by time preference:

```typescript
    // Count candidates excluded only by time preference (not ALL_DAY or other reasons)
    const timeExcludedCount = qualified.filter((a) => {
      const periods = unavailMap.get(a.id);
      if (!periods) return false;
      const period = periods.get(dateStr);
      if (!period || period === "ALL_DAY") return false;
      if (period === "MORNING_ONLY" && isNight) return true;
      if (period === "NIGHT_ONLY" && !isNight) return true;
      return false;
    }).length;
```

Update the `detectConflict` call to pass `timeExcludedCount`:

```typescript
    const conflict = detectConflict(slot, acolytes, unavailabilities, qualified.length, available.length, timeExcludedCount);
```

---

### Task 4: Conflict Detection — TIME_PREFERENCE_EXCLUDED

**Files:**
- Modify: `backend/src/scheduling/conflicts.ts:7-69`

- [ ] **Step 1: Add timeExcludedCount parameter**

Change the `detectConflict` function signature (line 7-13):

```typescript
export function detectConflict(
  slot: CelebrationSlot,
  acolytes: Acolyte[],
  unavailabilities: UnavailableDate[],
  qualifiedCount: number,
  availableCount: number,
  timeExcludedCount: number = 0,
): Conflict | null {
```

- [ ] **Step 2: Add TIME_PREFERENCE_EXCLUDED check**

After the `ALL_UNAVAILABLE` check (after line 39) and before the `INSUFFICIENT_CANDIDATES` check (line 43), add:

```typescript
  // All qualified excluded by time preference (not fully unavailable)
  if (availableCount === 0 && timeExcludedCount > 0 && timeExcludedCount === qualifiedCount) {
    return {
      celebrationId: slot.celebrationId,
      celebrationName: slot.celebrationName,
      functionId: slot.functionId,
      functionName: slot.functionName,
      type: "TIME_PREFERENCE_EXCLUDED",
      description: `Todos os acólitos qualificados estão disponíveis apenas em outro turno`,
      suggestedAction: "Considere ajustar o horário da celebração ou atribuir manualmente",
    };
  }
```

Note: If a mix of ALL_DAY unavailable and time-excluded results in 0 available, the existing `ALL_UNAVAILABLE` fires first (line 30-39). `TIME_PREFERENCE_EXCLUDED` only fires when ALL exclusions are due to time preference.

---

### Task 5: Worker — Include Period in Query

**Files:**
- Modify: `backend/src/worker.ts:71-81`

- [ ] **Step 1: Update unavailability mapping to include period**

Replace lines 78-81:

```typescript
    const unavailabilities: UnavailableDate[] = rawUnavail.map((u) => ({
      userId: u.userId,
      date: u.date.toISOString().slice(0, 10),
    }));
```

With:

```typescript
    const unavailabilities: UnavailableDate[] = rawUnavail.map((u) => ({
      userId: u.userId,
      date: u.date.toISOString().slice(0, 10),
      period: u.period,
    }));
```

The Prisma query (lines 71-76) already fetches all fields including the new `period` — no change needed there.

---

### Task 6: Availability API — Period in GET and PUT

**Files:**
- Modify: `backend/src/routes/availability.routes.ts:5-9,28-34,59-75`

- [ ] **Step 1: Update Zod schema**

Replace lines 5-9:

```typescript
const setAvailabilitySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});
```

With:

```typescript
const dateEntry = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.enum(["ALL_DAY", "MORNING_ONLY", "NIGHT_ONLY"]).default("ALL_DAY"),
});

const setAvailabilitySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dates: z.array(dateEntry),
});
```

- [ ] **Step 2: Update GET response to include period**

Change the `select` in the GET handler (line 30):

```typescript
        select: { id: true, date: true, reason: true, period: true },
```

- [ ] **Step 3: Update PUT transaction to include period**

Replace lines 70-74:

```typescript
      // Create new
      ...dates.map((d) =>
        app.prisma.unavailability.create({
          data: { userId: id, date: new Date(d) },
        }),
      ),
```

With:

```typescript
      // Create new
      ...dates.map((d) =>
        app.prisma.unavailability.create({
          data: { userId: id, date: new Date(d.date), period: d.period },
        }),
      ),
```

- [ ] **Step 4: Update PUT response select**

Change the `select` in the response query (line 79):

```typescript
      select: { id: true, date: true, reason: true, period: true },
```

---

### Task 7: Frontend Types — Add Period

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add Period type**

At the end of the file, add:

```typescript
export type Period = "ALL_DAY" | "MORNING_ONLY" | "NIGHT_ONLY";
```

---

### Task 8: Calendar UI — 4-State Cycle with Visual Feedback

**Files:**
- Modify: `frontend/src/pages/disponibilidade.tsx`

This is the largest task. Changes cover: state type, data loading, toggle logic, colors, legend, summary, and save payload.

- [ ] **Step 1: Update state from Set to Map**

Replace lines 17-18:

```typescript
  const [unavailDates, setUnavailDates] = useState<Set<string>>(new Set());
  const [savedUnavailDates, setSavedUnavailDates] = useState<Set<string>>(new Set());
```

With:

```typescript
  import type { Period } from "@/types";
  // (move this import to top of file with other imports)

  const [unavailDates, setUnavailDates] = useState<Map<string, Period>>(new Map());
  const [savedUnavailDates, setSavedUnavailDates] = useState<Map<string, Period>>(new Map());
```

(The `Period` import should go at the top of the file alongside other imports.)

- [ ] **Step 2: Update data loading (useEffect)**

Replace lines 31-37:

```typescript
    api<{ data: { date: string }[] }>(`/servers/${user.id}/availability?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => {
        const dates = new Set(r.data.map((d) => d.date.slice(0, 10)));
        setUnavailDates(dates);
        setSavedUnavailDates(new Set(dates));
      });
```

With:

```typescript
    api<{ data: { date: string; period: Period }[] }>(`/servers/${user.id}/availability?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => {
        const dates = new Map(r.data.map((d) => [d.date.slice(0, 10), d.period]));
        setUnavailDates(dates);
        setSavedUnavailDates(new Map(dates));
      });
```

- [ ] **Step 3: Replace toggleDate with cycleDate**

Replace lines 62-69:

```typescript
  const toggleDate = (dateStr: string) => {
    setUnavailDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };
```

With:

```typescript
  // Cycle: available -> ALL_DAY -> MORNING_ONLY -> NIGHT_ONLY -> available
  const cycleDate = (dateStr: string) => {
    setUnavailDates((prev) => {
      const next = new Map(prev);
      const current = next.get(dateStr);
      if (!current) {
        next.set(dateStr, "ALL_DAY");
      } else if (current === "ALL_DAY") {
        next.set(dateStr, "MORNING_ONLY");
      } else if (current === "MORNING_ONLY") {
        next.set(dateStr, "NIGHT_ONLY");
      } else {
        next.delete(dateStr); // NIGHT_ONLY -> available
      }
      return next;
    });
  };
```

- [ ] **Step 4: Update save payload**

Replace line 78 in `saveAll`:

```typescript
        body: JSON.stringify({ startDate, endDate, dates: Array.from(unavailDates) }),
```

With:

```typescript
        body: JSON.stringify({
          startDate,
          endDate,
          dates: Array.from(unavailDates.entries()).map(([date, period]) => ({ date, period })),
        }),
```

- [ ] **Step 5: Update saved state after save**

Replace lines 85-86:

```typescript
    setSavedUnavailDates(new Set(unavailDates));
```

With:

```typescript
    setSavedUnavailDates(new Map(unavailDates));
```

- [ ] **Step 6: Update dirty check**

Replace lines 100-104:

```typescript
  const calendarDirty = (() => {
    if (unavailDates.size !== savedUnavailDates.size) return true;
    for (const d of unavailDates) if (!savedUnavailDates.has(d)) return true;
    return false;
  })();
```

With:

```typescript
  const calendarDirty = (() => {
    if (unavailDates.size !== savedUnavailDates.size) return true;
    for (const [d, p] of unavailDates) {
      if (savedUnavailDates.get(d) !== p) return true;
    }
    for (const d of savedUnavailDates.keys()) {
      if (!unavailDates.has(d)) return true;
    }
    return false;
  })();
```

- [ ] **Step 7: Update summary counts**

Replace lines 123-124:

```typescript
  const unavailCount = unavailDates.size;
  const availCount = lastDay - unavailCount;
```

With:

```typescript
  const allDayCount = Array.from(unavailDates.values()).filter((p) => p === "ALL_DAY").length;
  const morningCount = Array.from(unavailDates.values()).filter((p) => p === "MORNING_ONLY").length;
  const nightCount = Array.from(unavailDates.values()).filter((p) => p === "NIGHT_ONLY").length;
  const availCount = lastDay - unavailDates.size;
```

- [ ] **Step 8: Update legend bar**

Replace lines 166-177 (the legend bar content inside the `<div>`):

```tsx
          <div className="mb-2.5 flex items-center gap-4 rounded-md border border-border bg-card-inner px-3 py-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded border border-border bg-card" /> Disponível
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded bg-[#8b1a1a]" /> Indisponível
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded bg-[#f5c542]" /> Só manhã
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded bg-[#3b5998]" /> Só noite
            </span>
            {calendarDirty && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <span className="inline-block h-3 w-3 rounded bg-amber-500/25 ring-2 ring-amber-500" /> Não salvo
              </span>
            )}
          </div>
```

- [ ] **Step 9: Update day button rendering**

Replace the day button (lines 200-218). The onClick changes from `toggleDate` to `cycleDate`, and the styling uses period-based colors:

```tsx
              {days.map((day) => {
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const period = unavailDates.get(dateStr);
                const savedPeriod = savedUnavailDates.get(dateStr);
                const isModified = period !== savedPeriod;
                const isPast = dateStr < today;
                const isToday = dateStr === today;

                // Background color by period
                const bgColor = !period
                  ? "" // available — uses default card style
                  : period === "ALL_DAY"
                    ? "bg-[#8b1a1a] text-white"
                    : period === "MORNING_ONLY"
                      ? "bg-[#f5c542] text-[#5a4a3a]"
                      : "bg-[#3b5998] text-white";

                const modifiedRing = isModified
                  ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-card"
                  : "";

                return (
                  <button
                    key={day}
                    onClick={() => !isPast && cycleDate(dateStr)}
                    disabled={isPast}
                    className={`relative flex h-12 items-center justify-center rounded-md text-[13px] font-medium transition-all ${
                      isPast
                        ? "cursor-default text-foreground/20"
                        : period
                          ? `${bgColor} shadow-sm hover:opacity-90 active:scale-95 ${modifiedRing}`
                          : `border border-border bg-card-inner text-foreground hover:border-accent/40 hover:bg-card active:scale-95 ${modifiedRing}`
                    } ${isToday && !isPast ? "font-bold ring-1 ring-accent/50" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
```

- [ ] **Step 10: Update summary section**

Replace lines 226-236:

```tsx
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
            <div className="flex gap-3 text-xs font-semibold flex-wrap">
              <span className="text-success">{availCount} disponíveis</span>
              <span className="text-[#8b1a1a]">{allDayCount} indisponíveis</span>
              {morningCount > 0 && <span className="text-[#b8960a]">{morningCount} manhã</span>}
              {nightCount > 0 && <span className="text-[#3b5998]">{nightCount} noite</span>}
            </div>
            {calendarDirty && (
              <span className="text-xs font-semibold text-amber-600">
                Pendente
              </span>
            )}
          </div>
```

---

### Task 9: Admin Badges — Diurna/Noturna nas Celebrações

**Files:**
- Modify: `frontend/src/pages/celebracoes.tsx`

- [ ] **Step 1: Add period badge helper**

After the `TYPE_LABEL` constant (line 19), add:

```typescript
function CelebrationPeriodBadge({ date }: { date: string }) {
  const hour = new Date(date).getHours();
  const isNight = hour >= 18;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isNight
          ? "bg-[#3b5998]/15 text-[#3b5998]"
          : "bg-[#f5c542]/20 text-[#b8960a]"
      }`}
    >
      {isNight ? "Noturna" : "Diurna"}
    </span>
  );
}
```

- [ ] **Step 2: Add badge to celebration list items**

Find where celebrations are rendered in the list. Add `<CelebrationPeriodBadge date={cel.date} />` next to the celebration name or type label in the list rendering. The exact insertion point depends on the list layout — place it adjacent to the type badge (e.g., "Missa Dominical") for visual consistency.

---

### Task 10: Admin Badges — Diurna/Noturna no Detalhe de Escala

**Files:**
- Modify: `frontend/src/pages/escala-detalhe.tsx`

- [ ] **Step 1: Add same CelebrationPeriodBadge component**

Copy the same `CelebrationPeriodBadge` component from Task 9 (or extract to a shared file if preferred — but since it's only 2 files, inline is fine).

- [ ] **Step 2: Add badge to celebration headers in schedule detail**

Add the badge next to each celebration's date/name display in the schedule detail view.

---

### Task 11: Smoke Test — Full Flow Verification

- [ ] **Step 1: Start services**

```bash
docker compose up --build -d
```

- [ ] **Step 2: Verify migration applied**

```bash
docker compose exec app npx prisma migrate status
```

Expected: All migrations applied.

- [ ] **Step 3: Test API — GET availability returns period**

```bash
curl -s http://localhost:3000/api/servers/1/availability?startDate=2026-04-01&endDate=2026-04-30 -H "Authorization: Bearer <token>" | jq '.data[0]'
```

Expected: Objects include `period` field.

- [ ] **Step 4: Test API — PUT with period**

```bash
curl -s -X PUT http://localhost:3000/api/servers/1/availability \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-04-01","endDate":"2026-04-30","dates":[{"date":"2026-04-10","period":"ALL_DAY"},{"date":"2026-04-12","period":"NIGHT_ONLY"}]}' | jq
```

Expected: success with period in response.

- [ ] **Step 5: Test calendar UI**

Open the app, navigate to Disponibilidade. Click a future day multiple times — should cycle through: indisponível (red) → manhã (gold) → noite (blue) → disponível (base). Save and reload to verify persistence.

- [ ] **Step 6: Test schedule generation**

Create a schedule for a period that includes a night celebration (>= 18:00) and an acolyte marked as MORNING_ONLY for that day. Verify the acolyte is NOT assigned to the night celebration.
