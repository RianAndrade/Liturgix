# 04 — Regras de Negocio

Este documento especifica todas as regras de negocio do Liturgix, organizadas por categoria. As regras sao a base para validacoes no backend, logica de geracao de escalas e comportamento esperado da interface.

---

## 1. Regras Rigidas (nunca violar)

Estas regras sao **invariantes do sistema**. Qualquer violacao deve ser impedida no backend, independentemente do que a interface permita.

| ID | Regra | Descricao | Onde aplica |
|----|-------|-----------|-------------|
| R01 | Sem duplicata no dia | Um acolito nao pode ser escalado duas vezes na mesma celebracao. Mesmo que esteja qualificado para multiplas funcoes naquela celebracao, so pode ocupar uma vaga por celebracao. | Geracao de escala, edicao manual |
| R02 | Respeitar indisponibilidade | Nunca escalar acolito em data marcada como indisponivel. Se o acolito informou que nao pode em determinada data, o sistema deve tratar isso como restricao absoluta. | Geracao de escala, edicao manual |
| R03 | So funcoes habilitadas | Acolito so pode ser escalado para funcoes para as quais possui qualificacao registrada. Exemplo: um acolito habilitado apenas como ceriferiario nao pode ser escalado como turiferiario. | Geracao de escala, edicao manual |
| R04 | Acolito ativo | Somente acolitos com conta ativa (nao excluidos logicamente) podem ser escalados. Acolitos desativados devem ser invisíveis para o algoritmo de geracao. | Geracao de escala, listagens |

### Exemplo de violacao impedida

```
Celebracao: Missa Dominical — 06/04/2026 10:00
Acolito: Joao Silva
Funcao ja atribuida: Ceriferiario

Tentativa: escalar Joao Silva tambem como Cruciferario na mesma celebracao
Resultado: BLOQUEADO (R01 — sem duplicata no dia)
```

---

## 2. Regras Flexiveis (otimizacao)

Estas regras orientam o **algoritmo de geracao** para produzir escalas justas e equilibradas. Nao sao bloqueantes — o sistema pode viola-las quando nao ha alternativa — mas devem ser maximizadas.

### 2.1 Equilibrio de servicos

Distribuir escalacoes de forma justa entre todos os acolitos qualificados para cada funcao. O objetivo e evitar que um acolito sirva muito mais que outros no mesmo periodo.

**Metrica**: desvio padrao do numero de escalacoes entre acolitos qualificados para a mesma funcao. Quanto menor, melhor.

### 2.2 Rotacao de funcoes

Variar a funcao que cada acolito desempenha entre celebracoes. Um acolito habilitado para 3 funcoes nao deve ser sempre escalado na mesma.

**Metrica**: dias desde a ultima vez que o acolito exerceu determinada funcao. Quanto mais tempo, maior a prioridade para aquela funcao.

### 2.3 Intervalo entre servicos

Evitar escalar o mesmo acolito em celebracoes muito proximas (ex: sabado a noite e domingo de manha). Isso previne sobrecarga e melhora a experiencia do acolito.

**Metrica**: dias desde qualquer servico do acolito. Quanto mais tempo sem servir, maior a prioridade.

---

## 3. Formula de Pontuacao (Scoring)

O algoritmo de geracao calcula um **score total** para cada candidato a cada vaga. O candidato com maior score e selecionado.

### Formula

```
totalScore = (0.50 * countScore) + (0.30 * rotationScore) + (0.20 * intervalScore)
```

### Componentes

| Componente | Peso | Calculo | Faixa |
|------------|------|---------|-------|
| `countScore` | 50% | Inverso linear do total de servicos no periodo. Quem serviu menos tem score mais alto. | 0 — 100 |
| `rotationScore` | 30% | Dias desde a ultima vez que exerceu **esta funcao especifica**. Limitado a 28 dias (apos 28 dias, score = 100). | 0 — 100 |
| `intervalScore` | 20% | Dias desde **qualquer servico**. Limitado a 14 dias (apos 14 dias, score = 100). | 0 — 100 |

### Cold start

Acolitos novos (sem historico de escalacoes) recebem **100 em todos os criterios**. Isso garante que novatos sejam priorizados nas primeiras escalas, integrando-os rapidamente.

### Desempate (tiebreaker)

Quando dois ou mais candidatos tem o mesmo `totalScore`, o desempate segue esta ordem:

1. **Menos servicos totais** no periodo (favorece quem serviu menos)
2. **Mais dias desde o ultimo servico** (favorece quem esta ha mais tempo sem servir)
3. **Ordem alfabetica pelo nome** (garante determinismo — mesma entrada, mesma saída)

### Exemplo de calculo

```
Candidatos para Ceriferiario — Missa 12/04/2026:

Ana:
  servicos no periodo: 3   → countScore = 70
  dias desde ceriferiario: 21 → rotationScore = 75
  dias desde qualquer:     7  → intervalScore = 50
  totalScore = (0.50 * 70) + (0.30 * 75) + (0.20 * 50) = 35 + 22.5 + 10 = 67.5

Bruno:
  servicos no periodo: 5   → countScore = 40
  dias desde ceriferiario: 28 → rotationScore = 100
  dias desde qualquer:     2  → intervalScore = 14.3
  totalScore = (0.50 * 40) + (0.30 * 100) + (0.20 * 14.3) = 20 + 30 + 2.86 = 52.86

Carlos (novo):
  servicos no periodo: 0   → countScore = 100
  dias desde ceriferiario: — → rotationScore = 100
  dias desde qualquer:     — → intervalScore = 100
  totalScore = (0.50 * 100) + (0.30 * 100) + (0.20 * 100) = 50 + 30 + 20 = 100

Resultado: Carlos (100) > Ana (67.5) > Bruno (52.86)
Carlos e selecionado.
```

---

## 4. Tipos de Conflito

Durante a geracao de escalas, o algoritmo pode encontrar situacoes onde nao consegue preencher uma vaga. Esses conflitos sao registrados e reportados para a coordenadora resolver manualmente.

| Codigo | Nome | Descricao | Acao sugerida |
|--------|------|-----------|---------------|
| `NO_CANDIDATES` | Sem candidatos | Nenhum acolito qualificado existe no sistema para esta funcao. | Habilitar acolitos para a funcao ou remover a funcao da celebracao. |
| `INSUFFICIENT_CANDIDATES` | Candidatos insuficientes | Ha acolitos qualificados, mas menos do que o numero de vagas requeridas. | Habilitar mais acolitos ou reduzir vagas. |
| `OVERLOAD_SINGLE_CANDIDATE` | Sobrecarga em candidato unico | Existe apenas um candidato qualificado e ele ja esta sobrecarregado (muitas escalacoes no periodo). | Habilitar mais acolitos para a funcao. |
| `ALL_UNAVAILABLE` | Todos indisponiveis | Todos os acolitos qualificados marcaram indisponibilidade na data da celebracao. | Negociar disponibilidade ou deixar vaga aberta. |
| `QUALIFICATION_GAP` | Lacuna de qualificacao | A funcao existe no cadastro de celebracoes, mas nenhum acolito no sistema todo possui essa qualificacao. | Treinar acolitos para a funcao ou revisar o cadastro. |

### Diferenca entre NO_CANDIDATES e QUALIFICATION_GAP

- **NO_CANDIDATES**: pode haver acolitos com a qualificacao, mas todos estao inativos ou nao existem para aquela paroquia/comunidade.
- **QUALIFICATION_GAP**: a funcao esta cadastrada no tipo de celebracao, mas literalmente zero acolitos ativos tem essa qualificacao no sistema inteiro.

Na pratica, `QUALIFICATION_GAP` e um caso especifico e mais grave de `NO_CANDIDATES`.

---

## 5. Regras de Validacao de Dados

Validacoes aplicadas na entrada de dados (API e formularios).

### 5.1 Usuario

| Campo | Regra |
|-------|-------|
| Email | Obrigatorio, formato valido, **unico por usuario** no sistema. Tentativa de cadastrar email duplicado retorna erro `409 Conflict`. |
| Nome | Obrigatorio, 2-100 caracteres. |
| Senha | Obrigatoria, minimo 8 caracteres. |

### 5.2 Indisponibilidade

| Campo | Regra |
|-------|-------|
| Data inicio | Obrigatoria, deve ser **data futura** (nao permite registrar indisponibilidade retroativa). |
| Data fim | Obrigatoria, deve ser >= data inicio. |
| Sobreposicao | **Nao permitida**. Se o acolito ja tem indisponibilidade de 10/04 a 15/04, nao pode criar outra de 12/04 a 18/04. Deve editar a existente ou excluir e recriar. |

### 5.3 Celebracao

| Campo | Regra |
|-------|-------|
| Data/hora | Obrigatoria, deve ser **data/hora futura**. |
| Tipo | Obrigatorio, deve ser um tipo valido cadastrado no sistema (ex: Missa Dominical, Missa Semanal, Adoracao). |
| Funcoes requeridas | **Pelo menos 1 funcao** deve ser definida. Uma celebracao sem funcoes nao faz sentido para geracao de escala. |

### 5.4 Escala

| Campo | Regra |
|-------|-------|
| Periodo | Obrigatorio: data inicio e data fim. Data fim > data inicio. |
| Celebracoes | Deve haver **pelo menos 1 celebracao** cadastrada no periodo informado. Gerar escala para periodo sem celebracoes retorna erro. |

---

## 6. Regras de Transicao de Status da Escala

A escala possui um ciclo de vida com transicoes controladas.

```
                    ┌────────────────┐
                    │                │
                    v                │ re-geracao
                 ┌──────┐           │ (preserva travados)
                 │ DRAFT │──────────┘
                 └──┬───┘
                    │
                    │ publicar
                    v
              ┌───────────┐
              │ PUBLISHED  │
              └──┬────────┘
                 │
                 │ arquivar
                 v
              ┌───────────┐
              │ ARCHIVED   │
              └───────────┘
```

### Transicoes permitidas

| De | Para | Condicao | Quem pode |
|----|------|----------|-----------|
| `DRAFT` | `DRAFT` | Re-geracao do algoritmo. Escalacoes **travadas** (confirmadas manualmente) sao preservadas; apenas vagas nao-travadas sao recalculadas. | Coordenadora, Admin |
| `DRAFT` | `PUBLISHED` | **Todas as vagas preenchidas** OU coordenadora aceita explicitamente publicar com vagas abertas. A interface deve exibir aviso claro quando houver vagas nao preenchidas. | Coordenadora, Admin |
| `PUBLISHED` | `ARCHIVED` | Acao manual apos o periodo da escala ter passado (ou a qualquer momento, se necessario). | Coordenadora, Admin |

### Transicoes proibidas

| De | Para | Motivo |
|----|------|--------|
| `PUBLISHED` | `DRAFT` | Uma vez publicada, a escala e visivel pelos acolitos. Reverter causaria confusao. Se houver erro, a coordenadora deve criar nova escala. |
| `ARCHIVED` | Qualquer | Escalas arquivadas sao imutaveis. Servem apenas como historico. |

---

## 7. Regras de Vinculo Responsavel-Acolito

O sistema suporta vinculos entre responsaveis (pais, tutores) e acolitos menores de idade ou sob tutela.

### Regras de criacao

- **Apenas usuarios com papel COORDINATOR ou superior** podem criar vinculos entre responsaveis e acolitos.
- O vinculo e uma relacao N:N:
  - Um acolito pode ter **multiplos responsaveis** (ex: pai e mae).
  - Um responsavel pode ter **multiplos acolitos vinculados** (ex: irmaos).

### Regras de visibilidade

- O responsavel **so ve dados dos acolitos vinculados a ele**. Nao tem acesso a informacoes de outros acolitos.
- Dados visiveis incluem: escalacoes, indisponibilidades e historico de servicos dos acolitos vinculados.

### Regras de acoes

| Acao | Responsavel pode? | Observacao |
|------|-------------------|------------|
| Ver escala do acolito vinculado | Sim | Somente dos seus vinculados |
| Registrar indisponibilidade | Sim | Somente para seus vinculados |
| Editar perfil do acolito | Nao | Apenas coordenadora/admin |
| Remover vinculo | Nao | Apenas coordenadora/admin |

---

## 8. Resumo de Regras por Contexto

### Na geracao automatica de escala

1. Filtrar apenas acolitos ativos (R04)
2. Remover acolitos indisponiveis na data (R02)
3. Remover acolitos sem qualificacao para a funcao (R03)
4. Remover acolitos ja escalados naquela celebracao (R01)
5. Calcular `totalScore` para cada candidato restante
6. Selecionar candidato com maior score (desempate conforme secao 3)
7. Registrar conflito se nao houver candidatos viaveis

### Na edicao manual de escala

1. Validar R01 a R04 antes de confirmar
2. Exibir aviso se regras flexiveis forem violadas (ex: acolito sobrecarregado)
3. Permitir que coordenadora sobrescreva avisos flexiveis com justificativa

### Na publicacao de escala

1. Verificar se todas as vagas estao preenchidas
2. Se houver vagas abertas, exigir confirmacao explicita
3. Registrar quem publicou e quando (auditoria)
