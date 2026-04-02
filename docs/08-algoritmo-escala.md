# 08 - Especificacao da Geracao Automatica de Escalas

## 1. Visao Geral

O motor de geracao de escalas e o componente central do Liturgix. Ele recebe como entrada um conjunto de celebracoes, acolitos com suas qualificacoes e historico, indisponibilidades e configuracoes, e produz como saida um conjunto de atribuicoes otimizadas que respeita restricoes rigidas e maximiza a justica distributiva.

**Estrategia:** Satisfacao de restricoes gulosa (greedy constraint-satisfaction) com pontuacao ponderada.

O algoritmo nao e um solver de otimizacao global (como programacao linear ou CSP com backtracking). Ele processa cada vaga sequencialmente, escolhendo o melhor candidato disponivel no momento. Essa abordagem foi escolhida por:

- **Previsibilidade:** coordenadoras conseguem entender por que cada decisao foi tomada
- **Performance:** execucao em tempo linear em relacao ao numero de vagas
- **Auditabilidade:** cada decisao gera um registro com pontuacoes de todos os candidatos
- **Simplicidade:** manutencao e evolucao acessiveis sem conhecimento de algoritmos avancados

---

## 2. Entradas do Algoritmo

| Entrada | Tipo | Descricao |
|---------|------|-----------|
| `celebrations` | `Celebration[]` | Celebracoes do periodo com seus requisitos de funcoes |
| `acolytes` | `Acolyte[]` | Acolitos ativos com suas qualificacoes (funcoes habilitadas) |
| `history` | `ServiceRecord[]` | Historico de servicos anteriores (contagem e datas) |
| `unavailabilities` | `Unavailability[]` | Datas em que cada acolito esta indisponivel |
| `lockedAssignments` | `Assignment[]` | Atribuicoes travadas que devem ser preservadas |
| `config` | `SchedulingConfig` | Pesos e parametros configuraveis |

### 2.1. Estrutura de Configuracao

```typescript
interface SchedulingConfig {
  countWeight: number       // Peso da pontuacao de contagem (padrao: 0.50)
  rotationWeight: number    // Peso da pontuacao de rotacao (padrao: 0.30)
  intervalWeight: number    // Peso da pontuacao de intervalo (padrao: 0.20)
  rotationCapDays: number   // Limite de dias para rotacao (padrao: 28)
  intervalCapDays: number   // Limite de dias para intervalo (padrao: 14)
}
```

Os pesos sao armazenados na tabela `scheduling_config` e podem ser ajustados por paroquia em versoes futuras. A soma dos pesos deve ser 1.00.

---

## 3. Saidas do Algoritmo

| Saida | Tipo | Descricao |
|-------|------|-----------|
| `assignments` | `Assignment[]` | Atribuicoes geradas (com ou sem acolito) |
| `conflicts` | `Conflict[]` | Conflitos detectados durante a geracao |
| `auditTrail` | `AuditEntry[]` | Registro de decisao para cada vaga |

```typescript
interface Assignment {
  celebrationId: string
  functionId: string
  userId: string | null    // null = vaga nao preenchida
  score: number | null     // pontuacao do candidato selecionado
  locked: boolean          // se a atribuicao esta travada
  auditData: CandidateScore[]  // pontuacoes de todos os candidatos
}

interface CandidateScore {
  userId: string
  userName: string
  countScore: number       // 0-100
  rotationScore: number    // 0-100
  intervalScore: number    // 0-100
  totalScore: number       // pontuacao ponderada final
  selected: boolean
  rejectionReason?: string // se nao selecionado, motivo
}
```

---

## 4. Formula de Pontuacao

A pontuacao total de cada candidato para uma vaga especifica e calculada como a media ponderada de tres criterios:

```
totalScore = (countWeight * countScore) + (rotationWeight * rotationScore) + (intervalWeight * intervalScore)
```

Com os pesos padrao:

```
totalScore = (0.50 * countScore) + (0.30 * rotationScore) + (0.20 * intervalScore)
```

Cada criterio produz um valor no intervalo **0 a 100**, onde **100 e o melhor** (maior prioridade para servir).

### 4.1. countScore - Pontuacao de Contagem (peso 0.50)

**Objetivo:** Equilibrar o numero total de servicos entre todos os acolitos. Quem serviu menos vezes recebe prioridade.

**Formula:**

```
Se maxCount > 0:
  countScore = 100 - (myCount / maxCount) * 100

Se maxCount == 0:
  countScore = 100
```

Onde:
- `myCount` = numero total de servicos do acolito (historico + atribuicoes ja feitas nesta geracao)
- `maxCount` = maior numero de servicos entre todos os acolitos ativos

**Exemplos:**

| Acolito | myCount | maxCount | Calculo | countScore |
|---------|---------|----------|---------|------------|
| Ana     | 0       | 12       | 100 - (0/12)*100  | **100.00** |
| Bruno   | 4       | 12       | 100 - (4/12)*100  | **66.67**  |
| Carla   | 8       | 12       | 100 - (8/12)*100  | **33.33**  |
| Daniel  | 12      | 12       | 100 - (12/12)*100 | **0.00**   |

**Racional:** Este criterio tem o maior peso (0.50) porque a justica distributiva e a principal preocupacao das coordenadoras. Nenhum acolito deve servir desproporcionalmente mais que outros.

### 4.2. rotationScore - Pontuacao de Rotacao (peso 0.30)

**Objetivo:** Promover a rotacao de acolitos entre funcoes diferentes. Quem nao exerceu esta funcao especifica ha mais tempo recebe prioridade.

**Formula:**

```
rotationScore = min(daysSinceLastInFunction, 28) / 28 * 100
```

Onde:
- `daysSinceLastInFunction` = dias desde a ultima vez que o acolito exerceu **esta funcao especifica**
- O limite (cap) e de **28 dias** (4 semanas)
- Se o acolito **nunca exerceu** esta funcao: `rotationScore = 100`

**Exemplos (para a funcao "Ceroferario"):**

| Acolito | Ultima vez na funcao | Dias | Calculo | rotationScore |
|---------|---------------------|------|---------|---------------|
| Ana     | Nunca               | --   | (nunca = 100)          | **100.00** |
| Bruno   | Ha 3 dias           | 3    | min(3, 28)/28*100      | **10.71**  |
| Carla   | Ha 14 dias          | 14   | min(14, 28)/28*100     | **50.00**  |
| Daniel  | Ha 35 dias          | 35   | min(35, 28)/28*100     | **100.00** |

**Racional:** O cap de 28 dias evita que acolitos que ficaram muito tempo sem uma funcao acumulem pontuacao desproporcionalmente alta. Apos 4 semanas, a pontuacao de rotacao e a maxima, igualando-os a quem nunca exerceu a funcao.

### 4.3. intervalScore - Pontuacao de Intervalo (peso 0.20)

**Objetivo:** Evitar que o mesmo acolito sirva em celebracoes muito proximas, independentemente da funcao. Quem nao serviu recentemente (em qualquer funcao) recebe prioridade.

**Formula:**

```
intervalScore = min(daysSinceLastService, 14) / 14 * 100
```

Onde:
- `daysSinceLastService` = dias desde o ultimo servico do acolito em **qualquer funcao**
- O limite (cap) e de **14 dias** (2 semanas)
- Se o acolito **nunca serviu**: `intervalScore = 100`

**Exemplos:**

| Acolito | Ultimo servico | Dias | Calculo | intervalScore |
|---------|---------------|------|---------|---------------|
| Ana     | Nunca         | --   | (nunca = 100)          | **100.00** |
| Bruno   | Ontem         | 1    | min(1, 14)/14*100      | **7.14**   |
| Carla   | Ha 7 dias     | 7    | min(7, 14)/14*100      | **50.00**  |
| Daniel  | Ha 20 dias    | 20   | min(20, 14)/14*100     | **100.00** |

**Racional:** Este criterio tem o menor peso (0.20) porque e menos importante que a contagem total e a rotacao de funcoes. Porem, e essencial para evitar que um acolito sirva em todas as missas de um fim de semana, por exemplo.

### 4.4. Exemplo Completo de Pontuacao

**Cenario:** Escala para "Ceroferario" em uma Missa Dominical.

| Criterio | Ana | Bruno | Carla | Daniel |
|----------|-----|-------|-------|--------|
| countScore       | 100.00 | 66.67 | 33.33 | 0.00  |
| rotationScore    | 100.00 | 10.71 | 50.00 | 100.00 |
| intervalScore    | 100.00 | 7.14  | 50.00 | 100.00 |

**Calculo com pesos padrao (0.50 / 0.30 / 0.20):**

```
Ana:    (0.50 * 100.00) + (0.30 * 100.00) + (0.20 * 100.00) = 50.00 + 30.00 + 20.00 = 100.00
Bruno:  (0.50 * 66.67)  + (0.30 * 10.71)  + (0.20 * 7.14)   = 33.34 + 3.21  + 1.43  = 37.98
Carla:  (0.50 * 33.33)  + (0.30 * 50.00)  + (0.20 * 50.00)  = 16.67 + 15.00 + 10.00 = 41.67
Daniel: (0.50 * 0.00)   + (0.30 * 100.00) + (0.20 * 100.00) = 0.00  + 30.00 + 20.00 = 50.00
```

**Ranking:**
1. Ana - 100.00 (selecionada)
2. Daniel - 50.00
3. Carla - 41.67
4. Bruno - 37.98

Ana e selecionada por ter a maior pontuacao. Embora Daniel tenha boa rotacao e intervalo, sua contagem alta (12 servicos, a maxima) o penaliza significativamente.

---

## 5. Desempate (Tiebreaker)

Quando dois ou mais candidatos tem a mesma pontuacao total, o desempate e deterministico e segue esta ordem:

1. **Menos servicos totais vence.** O candidato com menor `myCount` tem prioridade.
2. **Se empatado:** mais dias desde o ultimo servico vence. O candidato com maior `daysSinceLastService` tem prioridade.
3. **Se ainda empatado:** ordem alfabetica pelo nome completo. Garante determinismo absoluto -- a mesma entrada sempre produz a mesma saida.

```typescript
function tiebreaker(a: ScoredCandidate, b: ScoredCandidate): number {
  // 1. Maior pontuacao primeiro
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore

  // 2. Menos servicos primeiro
  if (a.serviceCount !== b.serviceCount) return a.serviceCount - b.serviceCount

  // 3. Mais dias desde ultimo servico primeiro
  if (b.daysSinceLastService !== a.daysSinceLastService)
    return b.daysSinceLastService - a.daysSinceLastService

  // 4. Alfabetico pelo nome (determinismo)
  return a.name.localeCompare(b.name, 'pt-BR')
}
```

**Por que determinismo e importante:** A coordenadora pode re-gerar a escala varias vezes durante o planejamento. Sem determinismo, cada geracao poderia produzir resultados diferentes para os mesmos dados de entrada, gerando confusao. O desempate alfabetico garante que, dadas as mesmas entradas, a saida e sempre identica.

---

## 6. Ordem de Processamento

O algoritmo processa as vagas em uma ordem especifica que maximiza a qualidade das atribuicoes:

### 6.1. Celebracoes em Ordem Cronologica

As celebracoes sao processadas da mais antiga para a mais recente. Isso garante que:
- O estado (contagens, datas de ultimo servico) e atualizado progressivamente
- Celebracoes futuras consideram as atribuicoes feitas para as anteriores
- O comportamento e previsivel e facil de auditar

### 6.2. Vagas por Nivel de Restricao (Mais Restrita Primeiro)

Dentro de cada celebracao, as vagas sao processadas na ordem de restricao -- a funcao com **menos candidatos qualificados** e preenchida primeiro.

**Racional:** Se uma funcao tem apenas 2 acolitos qualificados e outra tem 10, e critico preencher a mais restrita primeiro. Se preenchessemos a menos restrita primeiro, poderiamos "gastar" um dos 2 acolitos raros em uma funcao onde muitos outros poderiam servir.

**Calculo do nivel de restricao:**

```typescript
function sortByRestriction(slots: Slot[], acolytes: Acolyte[]): Slot[] {
  return slots.sort((a, b) => {
    const qualifiedA = acolytes.filter(ac => ac.functions.includes(a.functionId)).length
    const qualifiedB = acolytes.filter(ac => ac.functions.includes(b.functionId)).length
    return qualifiedA - qualifiedB  // menos qualificados primeiro
  })
}
```

**Exemplo:**

| Funcao | Acolitos Qualificados | Ordem de Processamento |
|--------|-----------------------|------------------------|
| Turiferario | 2 | 1o (mais restrito) |
| Ceroferario | 5 | 2o |
| Cruciferario | 5 | 3o |
| Librario | 8 | 4o |
| Cerimoniario | 12 | 5o (menos restrito) |

### 6.3. Vagas Multiplas da Mesma Funcao

Quando uma celebracao exige mais de um acolito para a mesma funcao (ex.: 2 ceroferarios), cada vaga e processada individualmente. O primeiro ceroferario selecionado atualiza o estado antes da selecao do segundo, evitando que o mesmo acolito seja selecionado duas vezes.

---

## 7. Restricoes Rigidas (Hard Constraints)

Restricoes rigidas **nunca** sao violadas. Um candidato que viola qualquer restricao rigida e eliminado do pool antes da pontuacao:

1. **Qualificacao:** O acolito deve estar habilitado para a funcao (`UserFunction` ativo para o par acolito-funcao).
2. **Disponibilidade:** O acolito nao pode estar marcado como indisponivel na data da celebracao (`Unavailability`).
3. **Unicidade no dia:** O acolito nao pode ser escalado para mais de uma funcao na mesma celebracao.
4. **Status ativo:** O acolito deve estar com status ativo no sistema.

```typescript
function getEligibleCandidates(
  slot: Slot,
  acolytes: Acolyte[],
  unavailabilities: Unavailability[],
  state: GenerationState
): Acolyte[] {
  return acolytes.filter(acolyte => {
    // 1. Qualificado para a funcao?
    if (!acolyte.functions.includes(slot.functionId)) return false

    // 2. Disponivel na data?
    if (unavailabilities.some(u =>
      u.userId === acolyte.id && u.date === slot.celebrationDate
    )) return false

    // 3. Ja escalado nesta celebracao?
    if (state.isAssignedToCelebration(acolyte.id, slot.celebrationId)) return false

    // 4. Ativo?
    if (!acolyte.isActive) return false

    return true
  })
}
```

---

## 8. Estado Mutavel Durante Geracao

O algoritmo mantem um estado mutavel que e atualizado a cada atribuicao realizada. Isso permite que as decisoes para vagas posteriores considerem as atribuicoes ja feitas:

```typescript
interface GenerationState {
  // Contagem de servicos por acolito (historico + esta geracao)
  serviceCounts: Map<string, number>

  // Data do ultimo servico por acolito em qualquer funcao
  lastServiceDate: Map<string, Date>

  // Data do ultimo servico por acolito por funcao
  lastFunctionDate: Map<string, Map<string, Date>>

  // Atribuicoes ja feitas nesta celebracao (para unicidade)
  celebrationAssignments: Map<string, Set<string>>

  // Maior contagem entre todos os acolitos (para countScore)
  maxCount: number
}
```

### 8.1. Inicializacao do Estado

```typescript
function initState(acolytes: Acolyte[], history: ServiceRecord[]): GenerationState {
  const state: GenerationState = {
    serviceCounts: new Map(),
    lastServiceDate: new Map(),
    lastFunctionDate: new Map(),
    celebrationAssignments: new Map(),
    maxCount: 0
  }

  // Inicializar contagens a partir do historico
  for (const record of history) {
    const count = (state.serviceCounts.get(record.userId) ?? 0) + 1
    state.serviceCounts.set(record.userId, count)

    // Atualizar data do ultimo servico
    const currentLast = state.lastServiceDate.get(record.userId)
    if (!currentLast || record.date > currentLast) {
      state.lastServiceDate.set(record.userId, record.date)
    }

    // Atualizar data do ultimo servico por funcao
    if (!state.lastFunctionDate.has(record.userId)) {
      state.lastFunctionDate.set(record.userId, new Map())
    }
    const funcMap = state.lastFunctionDate.get(record.userId)!
    const currentFuncLast = funcMap.get(record.functionId)
    if (!currentFuncLast || record.date > currentFuncLast) {
      funcMap.set(record.functionId, record.date)
    }
  }

  // Calcular maxCount
  state.maxCount = Math.max(0, ...state.serviceCounts.values())

  return state
}
```

### 8.2. Atualizacao do Estado

Apos cada atribuicao bem-sucedida:

```typescript
function updateState(state: GenerationState, assignment: Assignment, date: Date): void {
  const userId = assignment.userId!

  // Incrementar contagem
  const newCount = (state.serviceCounts.get(userId) ?? 0) + 1
  state.serviceCounts.set(userId, newCount)

  // Atualizar maxCount se necessario
  if (newCount > state.maxCount) {
    state.maxCount = newCount
  }

  // Atualizar data do ultimo servico
  state.lastServiceDate.set(userId, date)

  // Atualizar data do ultimo servico por funcao
  if (!state.lastFunctionDate.has(userId)) {
    state.lastFunctionDate.set(userId, new Map())
  }
  state.lastFunctionDate.get(userId)!.set(assignment.functionId, date)

  // Registrar na celebracao (para restricao de unicidade)
  if (!state.celebrationAssignments.has(assignment.celebrationId)) {
    state.celebrationAssignments.set(assignment.celebrationId, new Set())
  }
  state.celebrationAssignments.get(assignment.celebrationId)!.add(userId)
}
```

---

## 9. Pseudocodigo do Loop Principal

```
function generateSchedule(celebrations, acolytes, history, unavailabilities, config):
  // --- INICIALIZACAO ---
  state = initState(acolytes, history)
  assignments = []
  conflicts = []
  auditTrail = []

  // --- LOOP PRINCIPAL ---
  for celebration in sortByDate(celebrations):
    slots = getRequiredSlots(celebration)
    slots = sortByRestriction(slots, acolytes)  // mais restrita primeiro

    for slot in slots:
      auditEntry = { celebrationId, functionId, candidates: [] }

      // --- PRESERVAR TRAVADAS ---
      if slot.locked:
        assignments.push(slot)
        state.update(slot)
        auditEntry.decision = "LOCKED"
        auditEntry.candidates = [{
          userId: slot.userId,
          reason: "Atribuicao travada pela coordenadora"
        }]
        auditTrail.push(auditEntry)
        continue

      // --- FILTRAR CANDIDATOS ELEGIVEIS ---
      candidates = getEligibleCandidates(slot, acolytes, unavailabilities, state)

      // --- TRATAR AUSENCIA DE CANDIDATOS ---
      if candidates.empty:
        conflict = detectConflictType(slot, acolytes, unavailabilities)
        conflicts.push(conflict)
        assignments.push({...slot, userId: null})
        auditEntry.decision = "NO_CANDIDATES"
        auditEntry.conflict = conflict
        auditTrail.push(auditEntry)
        continue

      // --- PONTUAR TODOS OS CANDIDATOS ---
      scored = candidates.map(c => {
        countScore = calcCountScore(c, state)
        rotationScore = calcRotationScore(c, slot.functionId, state)
        intervalScore = calcIntervalScore(c, state)

        total = (config.countWeight * countScore)
              + (config.rotationWeight * rotationScore)
              + (config.intervalWeight * intervalScore)

        return {
          candidate: c,
          score: total,
          audit: { countScore, rotationScore, intervalScore }
        }
      })

      // --- ORDENAR E SELECIONAR ---
      scored.sort(byScoreDescThenTiebreaker)
      winner = scored[0]

      // --- REGISTRAR AUDITORIA ---
      auditEntry.candidates = scored.map((s, index) => ({
        userId: s.candidate.id,
        userName: s.candidate.name,
        countScore: s.audit.countScore,
        rotationScore: s.audit.rotationScore,
        intervalScore: s.audit.intervalScore,
        totalScore: s.score,
        selected: index === 0,
        rejectionReason: index > 0
          ? "Pontuacao inferior ao candidato selecionado"
          : undefined
      }))
      auditEntry.decision = "SELECTED"
      auditEntry.winnerId = winner.candidate.id

      // --- ATRIBUIR E ATUALIZAR ESTADO ---
      assignments.push({
        ...slot,
        userId: winner.candidate.id,
        score: winner.score,
        auditData: auditEntry.candidates
      })
      state.update(winner, celebration.date)
      auditTrail.push(auditEntry)

  // --- RETORNO ---
  return { assignments, conflicts, auditTrail }
```

---

## 10. Deteccao e Classificacao de Conflitos

Quando uma vaga nao pode ser preenchida, o algoritmo identifica o tipo de conflito e gera informacoes acionaveis para a coordenadora.

### 10.1. Tipos de Conflito

#### SEM_CANDIDATOS

**Condicao:** Nenhum acolito no sistema esta qualificado para a funcao E disponivel na data.

```typescript
{
  type: "SEM_CANDIDATOS",
  celebrationId: "...",
  functionId: "...",
  functionName: "Turiferario",
  celebrationDate: "2026-04-12",
  description: "Nao ha nenhum acolito qualificado para a funcao Turiferario que esteja disponivel em 12/04/2026.",
  suggestedActions: [
    "Habilitar mais acolitos para a funcao Turiferario",
    "Verificar se ha acolitos com indisponibilidade incorreta nesta data",
    "Remover a exigencia desta funcao para esta celebracao"
  ]
}
```

#### CANDIDATOS_INSUFICIENTES

**Condicao:** Ha candidatos qualificados e disponiveis, mas menos do que a quantidade necessaria (ex.: precisa de 2 ceroferarios, mas so 1 esta disponivel).

```typescript
{
  type: "CANDIDATOS_INSUFICIENTES",
  celebrationId: "...",
  functionId: "...",
  functionName: "Ceroferario",
  celebrationDate: "2026-04-12",
  required: 2,
  available: 1,
  description: "A celebracao exige 2 Ceroferario(s), mas apenas 1 acolito qualificado esta disponivel em 12/04/2026.",
  suggestedActions: [
    "Habilitar mais acolitos para a funcao Ceroferario",
    "Reduzir a quantidade exigida de 2 para 1 nesta celebracao",
    "Contatar acolitos indisponiveis para verificar possibilidade de presenca"
  ]
}
```

#### SOBRECARGA_CANDIDATO_UNICO

**Condicao:** Apenas 1 candidato esta qualificado e disponivel, mas ele ja foi escalado muitas vezes no periodo (mais do que o dobro da media).

```typescript
{
  type: "SOBRECARGA_CANDIDATO_UNICO",
  celebrationId: "...",
  functionId: "...",
  functionName: "Cerimoniario",
  celebrationDate: "2026-04-12",
  onlyCandidateId: "...",
  onlyCandidateName: "Pedro",
  currentServiceCount: 8,
  averageServiceCount: 3,
  description: "Pedro e o unico acolito disponivel para Cerimoniario em 12/04/2026, mas ja possui 8 servicos (media do grupo: 3). Ele sera escalado, mas pode haver sobrecarga.",
  suggestedActions: [
    "Habilitar mais acolitos para a funcao Cerimoniario",
    "Considerar redistribuir servicos de Pedro em outras datas",
    "Conversar com Pedro sobre a carga de servicos"
  ]
}
```

**Nota:** Neste caso, o candidato unico **e escalado** (diferente dos outros conflitos). O conflito e registrado como alerta, nao como impedimento.

#### TODOS_INDISPONIVEIS

**Condicao:** Existem acolitos qualificados para a funcao, mas **todos** estao marcados como indisponiveis na data.

```typescript
{
  type: "TODOS_INDISPONIVEIS",
  celebrationId: "...",
  functionId: "...",
  functionName: "Librario",
  celebrationDate: "2026-04-12",
  qualifiedCount: 5,
  unavailableNames: ["Ana", "Bruno", "Carla", "Daniel", "Elena"],
  description: "Todos os 5 acolitos qualificados para Librario estao indisponiveis em 12/04/2026.",
  suggestedActions: [
    "Contatar os acolitos para verificar possibilidade de presenca",
    "Verificar se alguma indisponibilidade foi marcada incorretamente",
    "Remover a exigencia desta funcao para esta celebracao"
  ]
}
```

#### LACUNA_QUALIFICACAO

**Condicao:** A funcao existe no sistema e e exigida pela celebracao, mas **nenhum** acolito esta habilitado para ela (independentemente de disponibilidade).

```typescript
{
  type: "LACUNA_QUALIFICACAO",
  celebrationId: "...",
  functionId: "...",
  functionName: "Naviculario",
  celebrationDate: "2026-04-12",
  description: "A funcao Naviculario e exigida, mas nenhum acolito do sistema esta habilitado para exerc-la.",
  suggestedActions: [
    "Treinar e habilitar acolitos para a funcao Naviculario",
    "Remover esta funcao dos requisitos da celebracao",
    "Verificar se a funcao esta configurada corretamente"
  ]
}
```

### 10.2. Logica de Deteccao

```typescript
function detectConflictType(
  slot: Slot,
  acolytes: Acolyte[],
  unavailabilities: Unavailability[],
  state: GenerationState
): Conflict {
  // Quantos sao qualificados para a funcao?
  const qualified = acolytes.filter(a =>
    a.isActive && a.functions.includes(slot.functionId)
  )

  // Nenhum qualificado no sistema inteiro
  if (qualified.length === 0) {
    return { type: "LACUNA_QUALIFICACAO", ... }
  }

  // Quantos dos qualificados estao disponiveis na data?
  const available = qualified.filter(a =>
    !unavailabilities.some(u =>
      u.userId === a.id && u.date === slot.celebrationDate
    ) && !state.isAssignedToCelebration(a.id, slot.celebrationId)
  )

  // Todos os qualificados estao indisponiveis
  if (available.length === 0) {
    return { type: "TODOS_INDISPONIVEIS", ... }
  }

  // Nota: se available.length > 0, nao deveriamos ter chegado aqui.
  // Se chegou, e porque alguma outra restricao filtrou (ja escalado na celebracao).
  return { type: "SEM_CANDIDATOS", ... }
}
```

Para `CANDIDATOS_INSUFICIENTES` e `SOBRECARGA_CANDIDATO_UNICO`, a deteccao acontece em pontos diferentes do fluxo:

- `CANDIDATOS_INSUFICIENTES`: detectado quando a funcao exige N vagas mas so ha M candidatos (M < N). As M vagas sao preenchidas normalmente; o conflito e registrado para as N - M vagas restantes.
- `SOBRECARGA_CANDIDATO_UNICO`: detectado apos a filtragem de candidatos, quando resta apenas 1, e sua contagem de servicos excede o dobro da media.

---

## 11. Sistema de Travamento/Destravamento

### 11.1. Visao Geral

O sistema de lock permite que a coordenadora proteja atribuicoes especificas durante a re-geracao de escalas:

- **Travar (lock):** A atribuicao e preservada intacta quando a escala for re-gerada. O algoritmo trata a vaga como ja preenchida e atualiza o estado.
- **Destravar (unlock):** A atribuicao volta ao pool e sera re-calculada na proxima geracao.
- **Atribuicao manual = auto-lock:** Quando a coordenadora atribui manualmente um acolito a uma vaga, ela e automaticamente travada.

### 11.2. Fluxo de Re-geracao com Locks

```
1. Coordenadora gera escala (v1)
2. Revisa e faz ajustes manuais (auto-lock em cada ajuste)
3. Trava atribuicoes que considera corretas
4. Re-gera a escala
5. Algoritmo:
   a. Preserva todas as atribuicoes travadas
   b. Atualiza o estado com as travadas (contagem, datas)
   c. Re-calcula apenas as vagas nao travadas
   d. Novas atribuicoes consideram as travadas no calculo de equilibrio
```

### 11.3. Impacto no Estado

Atribuicoes travadas sao processadas **antes** das nao travadas. Elas atualizam o estado normalmente:

```
for slot in slots:
  if slot.locked:
    assignments.push(slot)
    state.update(slot)  // contagem, datas, unicidade
    continue
  // ... calculo normal para nao travadas
```

Isso significa que, se a coordenadora travou Ana como Ceroferaria no domingo, e a proxima vaga de Ceroferaria no mesmo dia precisa de outro acolito, o algoritmo ja sabe que Ana esta ocupada nessa celebracao.

---

## 12. Trilha de Auditoria

Cada vaga processada gera uma entrada de auditoria completa, permitindo que a coordenadora entenda exatamente por que cada decisao foi tomada.

### 12.1. Estrutura da Entrada de Auditoria

```typescript
interface AuditEntry {
  celebrationId: string
  celebrationDate: Date
  celebrationName: string
  functionId: string
  functionName: string
  slotIndex: number           // 1o ceroferario, 2o ceroferario, etc.
  decision: "SELECTED" | "LOCKED" | "NO_CANDIDATES"
  winnerId: string | null
  winnerName: string | null
  winnerScore: number | null
  conflict: Conflict | null
  candidates: CandidateAudit[]
  timestamp: Date
}

interface CandidateAudit {
  userId: string
  userName: string
  countScore: number
  rotationScore: number
  intervalScore: number
  totalScore: number
  rank: number               // posicao no ranking (1 = melhor)
  selected: boolean
  rejectionReason: string | null
}
```

### 12.2. Motivos de Rejeicao

Para candidatos **elegiveis mas nao selecionados**, o motivo de rejeicao e:

```
"Pontuacao inferior: {score} (posicao {rank} de {total})"
```

Para candidatos **eliminados por restricao rigida**, eles nao aparecem na lista de candidatos pontuados, mas podem ser consultados separadamente:

```typescript
interface EliminatedCandidate {
  userId: string
  userName: string
  eliminationReason:
    | "NAO_QUALIFICADO"       // nao habilitado para a funcao
    | "INDISPONIVEL"          // marcou indisponibilidade na data
    | "JA_ESCALADO"           // ja escalado em outra funcao nesta celebracao
    | "INATIVO"               // status inativo
}
```

### 12.3. Armazenamento

Os dados de auditoria sao armazenados como JSON na coluna `auditData` da tabela `ScheduleAssignment`. Isso permite:

- Consulta sem joins complexos
- Preservacao do snapshot no momento da geracao (mesmo que dados posteriores mudem)
- Exibicao na UI sem re-calculo

---

## 13. Inicio Frio (Cold Start)

Acolitos recem-cadastrados que **nunca serviram** recebem tratamento especial:

| Criterio | Valor | Justificativa |
|----------|-------|---------------|
| countScore | 100 | `myCount = 0`, portanto `100 - (0/maxCount)*100 = 100` |
| rotationScore | 100 | Nunca exerceu esta funcao |
| intervalScore | 100 | Nunca serviu em nenhuma funcao |
| **totalScore** | **100.00** | Pontuacao maxima possivel |

**Efeito:** Acolitos novos tem a maior prioridade possivel. Eles serao escalados rapidamente ate que suas contagens se equilibrem com o resto do grupo.

**Cenario de multiplos novos acolitos:** Se varios acolitos novos tem pontuacao 100.00, o desempate alfabetico determina a ordem. Isso e justo no curto prazo -- apos as primeiras atribuicoes, suas pontuacoes divergem naturalmente.

**Cenario de apenas novos acolitos (grupo recem-formado):** Quando `maxCount = 0` para todos, `countScore = 100` para todos. O algoritmo se baseia nos demais criterios (que tambem serao 100 para todos inicialmente). Nesse caso, a distribuicao sera puramente alfabetica na primeira rodada, e divergira naturalmente nas seguintes.

---

## 14. Casos Extremos

### 14.1. Todos os Acolitos Indisponiveis em uma Data

**Cenario:** Uma celebracao no feriado de Carnaval, e todos os 15 acolitos marcaram indisponibilidade.

**Comportamento:**
- Cada vaga gera um conflito `TODOS_INDISPONIVEIS`
- Todas as atribuicoes ficam com `userId = null`
- A escala permanece em status `DRAFT`
- A coordenadora e notificada com a lista de acolitos indisponiveis e sugestoes de acao

**Resolucao esperada:** A coordenadora contata acolitos individualmente, negocia presenca, e faz atribuicoes manuais (que sao auto-travadas).

### 14.2. Apenas 1 Acolito Qualificado para uma Funcao

**Cenario:** Somente Pedro e qualificado como Turiferario. O periodo tem 4 celebracoes que exigem Turiferario.

**Comportamento:**
- Pedro e selecionado para todas as 4 celebracoes (e o unico candidato)
- Um conflito `SOBRECARGA_CANDIDATO_UNICO` e gerado para cada atribuicao
- Sua `countScore` diminui progressivamente, mas nao ha alternativa
- A auditoria registra que ele foi o unico candidato em cada vaga

**Resolucao esperada:** A coordenadora treina outros acolitos para Turiferario, ou remove a exigencia de algumas celebracoes.

### 14.3. Acolito Qualificado para Todas as Funcoes

**Cenario:** Maria esta habilitada para todas as 9 funcoes liturgicas.

**Comportamento:**
- Maria aparece como candidata em **todas** as vagas de todas as celebracoes
- A restricao de unicidade no dia impede que ela seja escalada para mais de uma funcao por celebracao
- O processamento por restricao (mais restrita primeiro) garante que Maria sera alocada na funcao onde ela e mais necessaria
- Suas pontuacoes de rotacao a direcionarao naturalmente para funcoes variadas ao longo do tempo

**Exemplo pratico:**
1. Turiferario (2 qualificados): Maria pode ser escalada aqui
2. Ceroferario (5 qualificados): Se Maria ja foi escalada como Turiferaria, ela e eliminada por unicidade
3. Librario (8 qualificados): Idem

**Resultado:** Maria tende a preencher as funcoes mais restritas, liberando funcoes menos restritas para acolitos menos versateis.

### 14.4. Re-geracao com Atribuicoes Travadas

**Cenario:** Escala com 20 atribuicoes. A coordenadora travou 8 e quer re-gerar as outras 12.

**Comportamento:**
1. As 8 atribuicoes travadas sao processadas primeiro
2. O estado e atualizado com as 8 (contagens, datas, unicidade)
3. As 12 vagas restantes sao re-calculadas considerando o estado atualizado
4. O resultado pode ser diferente da geracao original porque:
   - As atribuicoes travadas podem ter alterado o equilibrio de contagens
   - Acolitos que antes estavam em vagas nao travadas agora estao disponiveis
   - O estado de "ultimo servico" pode ter mudado

**Garantia:** As 8 atribuicoes travadas permanecem inalteradas. A re-geracao nunca modifica uma atribuicao travada.

### 14.5. Celebracao sem Requisitos de Funcao

**Cenario:** Uma celebracao foi criada mas nenhuma funcao foi configurada como necessaria.

**Comportamento:**
- `getRequiredSlots(celebration)` retorna lista vazia
- O loop interno nao executa
- Nenhuma atribuicao e gerada
- Nenhum conflito e registrado
- A celebracao aparece na escala sem atribuicoes

**Resolucao esperada:** A coordenadora configura os requisitos da celebracao antes de re-gerar.

### 14.6. Periodo sem Celebracoes

**Cenario:** O periodo selecionado (ex.: 01/04 a 30/04) nao tem nenhuma celebracao cadastrada.

**Comportamento:**
- O loop externo nao executa
- `assignments` e `conflicts` retornam vazios
- A escala e criada com status `DRAFT` e zero atribuicoes
- A interface informa a coordenadora que nao ha celebracoes no periodo

### 14.7. Acolito Escalado em Duas Celebracoes no Mesmo Dia

**Cenario:** Duas missas no domingo (09h e 19h). O acolito pode ser escalado nas duas?

**Comportamento:** **Sim.** A restricao de unicidade e **por celebracao**, nao por dia. Um acolito pode servir em celebracoes diferentes no mesmo dia, em funcoes iguais ou diferentes. Porem:

- O `intervalScore` nao se aplica intra-dia (ambas tem a mesma data)
- A `countScore` e atualizada apos a primeira atribuicao do dia
- Se a primeira celebracao (09h) escalou o acolito, ele tera uma contagem incrementada para a segunda (19h), recebendo uma pontuacao levemente menor

### 14.8. Empate Total entre Todos os Candidatos

**Cenario:** 3 acolitos novos, mesma contagem, nunca serviram, todos qualificados.

**Comportamento:**
- Todos tem `totalScore = 100.00`
- Desempate 1 (contagem): empate (todos com 0)
- Desempate 2 (dias desde ultimo servico): empate (todos com infinito/nunca)
- Desempate 3 (alfabetico): Ana < Bruno < Carla
- Ana e selecionada

**Na proxima vaga:** Ana ja tem 1 servico. Bruno e Carla tem 0. Bruno e selecionado (por desempate alfabetico, se as pontuacoes empatarem novamente, ou diretamente se a contagem de Ana ja a penalizou).

---

## 15. Pesos Configuraveis

### 15.1. Tabela scheduling_config

Os pesos do algoritmo sao armazenados no banco de dados, permitindo ajuste sem deploy:

```sql
CREATE TABLE scheduling_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(50) UNIQUE NOT NULL,
  value       DECIMAL(5,2) NOT NULL,
  description TEXT,
  updated_at  TIMESTAMP DEFAULT NOW(),
  updated_by  UUID REFERENCES users(id)
);

-- Valores padrao
INSERT INTO scheduling_config (key, value, description) VALUES
  ('count_weight',      0.50, 'Peso da pontuacao de contagem de servicos'),
  ('rotation_weight',   0.30, 'Peso da pontuacao de rotacao de funcao'),
  ('interval_weight',   0.20, 'Peso da pontuacao de intervalo entre servicos'),
  ('rotation_cap_days', 28,   'Limite em dias para calculo de rotacao'),
  ('interval_cap_days', 14,   'Limite em dias para calculo de intervalo');
```

### 15.2. Restricoes de Validacao

Ao atualizar pesos:
- `count_weight + rotation_weight + interval_weight` deve ser igual a `1.00`
- Cada peso deve ser >= `0.00` e <= `1.00`
- `rotation_cap_days` deve ser >= `1` e <= `365`
- `interval_cap_days` deve ser >= `1` e <= `365`

### 15.3. Cenarios de Ajuste

| Cenario | Ajuste Sugerido | Efeito |
|---------|-----------------|--------|
| Poucos acolitos, todos sobrecarregados | Aumentar `interval_weight` para 0.40 | Espalha mais os servicos ao longo do tempo |
| Muitos acolitos, alguns ociosos | Aumentar `count_weight` para 0.60 | Forca equilibrio de contagem mais rapidamente |
| Funcoes especializadas raras | Aumentar `rotation_weight` para 0.40 | Evita que especialistas repitam a mesma funcao |
| Grupo homogeneo, todos fazem tudo | Reduzir `rotation_weight` para 0.20 | Foca em contagem e intervalo |

---

## 16. Complexidade Computacional

### 16.1. Analise de Complexidade

Sejam:
- `C` = numero de celebracoes no periodo
- `S` = numero medio de vagas por celebracao
- `A` = numero total de acolitos

**Loop principal:** `O(C * S * A)`

- Para cada celebracao (`C`), para cada vaga (`S`), pontua todos os candidatos (`A`)
- Ordenacao dos candidatos por vaga: `O(A * log(A))`
- Ordenacao inicial das vagas por restricao: `O(S * A)` (verificar qualificacoes)

**Complexidade total:** `O(C * S * A * log(A))`

### 16.2. Estimativa de Performance

Para o cenario tipico de uma paroquia:
- 20 celebracoes/mes, 5 vagas/celebracao, 30 acolitos
- Total de operacoes: 20 * 5 * 30 * log(30) ~ 14.700 operacoes
- Tempo estimado: < 10ms em hardware moderno

Para o cenario maximo projetado:
- 50 celebracoes/mes, 10 vagas/celebracao, 100 acolitos
- Total de operacoes: 50 * 10 * 100 * log(100) ~ 332.000 operacoes
- Tempo estimado: < 100ms

O algoritmo greedy e adequado para o volume esperado. Nao ha necessidade de otimizacao adicional ou processamento assincrono por motivos de performance (o Celery worker e usado para desacoplamento da requisicao HTTP, nao por necessidade de tempo de processamento).

---

## 17. Fluxo Completo de Geracao

Diagrama textual do fluxo completo, da requisicao da coordenadora ao resultado final:

```
Coordenadora clica "Gerar Escala"
         |
         v
[Frontend] POST /api/schedules/generate
  { periodStart, periodEnd, celebrationIds? }
         |
         v
[API Fastify] Valida requisicao (Zod)
         |
         v
[API] Cria registro Schedule (status: GENERATING)
         |
         v
[API] Enfileira tarefa no Redis
  { scheduleId, periodStart, periodEnd }
         |
         v
[API] Retorna 202 Accepted
  { scheduleId, status: "GENERATING" }
         |
         v
[Celery Worker] Recebe tarefa
         |
         v
[Worker] Busca dados do DB:
  - Celebracoes do periodo
  - Acolitos ativos com qualificacoes
  - Historico de servicos
  - Indisponibilidades
  - Atribuicoes travadas (se re-geracao)
  - Configuracao de pesos
         |
         v
[Worker] Executa generateSchedule(...)
         |
         v
[Worker] Salva resultado no DB:
  - ScheduleAssignment (uma linha por vaga)
  - ScheduleConflict (uma linha por conflito)
  - ScheduleAuditLog (dados de auditoria)
         |
         v
[Worker] Atualiza Schedule:
  - status: DRAFT (ou DRAFT_WITH_CONFLICTS se houver conflitos)
  - generatedAt: now()
  - stats: { totalSlots, filled, unfilled, conflicts }
         |
         v
[Frontend] Poll GET /api/schedules/:id
  (a cada 2 segundos enquanto status = GENERATING)
         |
         v
[Frontend] Exibe resultado:
  - Grade de escala com atribuicoes
  - Indicadores de conflito em vagas nao preenchidas
  - Opcoes: resolver conflitos, travar, publicar
```

---

## 18. Glossario

| Termo | Definicao |
|-------|-----------|
| **Celebracao** | Evento liturgico (missa, novena, adoracao) com data, hora e tipo |
| **Funcao liturgica** | Papel que um acolito pode exercer (ceroferario, turiferario, etc.) |
| **Vaga (slot)** | Uma posicao em uma celebracao que precisa de um acolito para uma funcao |
| **Atribuicao (assignment)** | Vinculo entre um acolito e uma vaga |
| **Qualificacao** | Habilitacao de um acolito para exercer uma funcao |
| **Indisponibilidade** | Data em que um acolito nao pode servir |
| **Conflito** | Situacao em que uma vaga nao pode ser preenchida automaticamente |
| **Travamento (lock)** | Protecao de uma atribuicao contra re-geracao |
| **Cold start** | Situacao de um acolito sem historico de servicos |
| **Estado (state)** | Dados mutaveis que o algoritmo mantem durante a geracao |
| **Peso (weight)** | Multiplicador de cada criterio de pontuacao na formula |
| **Cap (limite)** | Valor maximo de dias considerado no calculo de rotacao/intervalo |
| **Auditoria** | Registro detalhado de cada decisao do algoritmo |
| **Greedy** | Estrategia que toma a melhor decisao local em cada passo |
