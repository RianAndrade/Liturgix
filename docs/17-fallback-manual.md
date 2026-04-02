# 17 — Estratégia para Casos Ambíguos e Fallback Manual

## Visão Geral

O algoritmo de geração automática de escalas resolve a maioria das atribuições de forma autônoma, mas nem sempre é possível preencher todas as vagas. Indisponibilidades extensas, falta de acólitos qualificados em determinadas funções ou sobreposição de restrições podem deixar vagas sem candidato viável.

Este documento descreve a estratégia completa para lidar com esses cenários: como os conflitos são apresentados, como a coordenadora intervém manualmente, como o sistema preserva decisões manuais durante re-gerações e como se chega a uma escala publicável.

---

## 1. Quando o Algoritmo Não Resolve

### 1.1 Vagas Não Resolvidas

Quando o algoritmo não encontra candidato viável para uma vaga, a atribuição é criada com `userId = NULL`. Isso sinaliza que a vaga existe, precisa ser preenchida, mas não tem responsável definido.

- A escala permanece no status **DRAFT** enquanto houver vagas não resolvidas
- Não é possível publicar uma escala com vagas `userId = NULL`, a menos que a coordenadora as aceite explicitamente como lacunas (ver seção 3.2)
- Vagas não resolvidas são visualmente destacadas na interface (fundo vermelho claro, ícone de alerta)

### 1.2 Tipos de Conflito

Cada conflito gerado pelo algoritmo possui três propriedades:

| Propriedade | Descrição |
|-------------|-----------|
| `type` | Enum do tipo de conflito (ver tabela abaixo) |
| `description` | Texto legível explicando o que aconteceu |
| `suggestedActions` | Lista de ações sugeridas para resolução |

Os cinco tipos de conflito possíveis:

| Tipo | Código | Descrição | Ações Sugeridas |
|------|--------|-----------|-----------------|
| Sem candidatos | `NO_CANDIDATES` | Nenhum acólito habilitado para esta função | Habilitar acólitos na função; criar nova qualificação |
| Candidatos insuficientes | `INSUFFICIENT_CANDIDATES` | Há candidatos, mas todos já estão atribuídos em outras vagas na mesma celebração | Atribuir manualmente o único disponível; redistribuir atribuições |
| Sobrecarga de candidato único | `SINGLE_CANDIDATE_OVERLOAD` | Apenas um acólito qualificado, mas já sobrecarregado no período | Aceitar sobrecarga pontual; buscar novo acólito para treinar |
| Todos indisponíveis | `ALL_UNAVAILABLE` | Todos os acólitos qualificados marcaram indisponibilidade nesta data | Contatar acólitos para verificar disponibilidade; reagendar celebração |
| Lacuna de qualificação | `QUALIFICATION_GAP` | A função existe na celebração, mas nenhum acólito possui a qualificação | Treinar acólitos na função; remover requisito da celebração |

### 1.3 Impacto no Fluxo de Publicação

```
Algoritmo executa
    │
    ├── Todas as vagas preenchidas → DRAFT pronto para publicação
    │
    └── Vagas com conflito → DRAFT com conflitos pendentes
            │
            ├── Coordenadora resolve todos → DRAFT pronto para publicação
            ├── Coordenadora aceita lacunas → DRAFT publicável com aviso
            └── Conflitos não tratados → Publicação bloqueada
```

---

## 2. Interface de Resolução Manual

### 2.1 Painel de Conflitos

Na página de detalhe da escala (`/escala/:id`), um painel lateral exibe a lista de conflitos pendentes. O painel aparece automaticamente quando a escala possui conflitos, e pode ser recolhido pela coordenadora.

**Estrutura do painel:**

```
┌─────────────────────────────────────────────┐
│  ⚠ Conflitos (5 pendentes)            [▾]  │
├─────────────────────────────────────────────┤
│                                             │
│  1. Missa Dominical — 05/04                 │
│     Função: Turiferário                     │
│     Tipo: QUALIFICATION_GAP                 │
│     "Nenhum acólito possui qualificação     │
│      de Turiferário"                        │
│     Sugestão: Treinar acólitos na função    │
│                                             │
│     [Atribuir Manualmente] [Deixar Vago]    │
│                                             │
├─────────────────────────────────────────────┤
│  2. Missa Vespertina — 06/04                │
│     Função: Cerimoniário                    │
│     Tipo: ALL_UNAVAILABLE                   │
│     "Todos os 3 acólitos qualificados       │
│      estão indisponíveis nesta data"        │
│     Sugestão: Contatar acólitos             │
│                                             │
│     [Atribuir Manualmente] [Deixar Vago]    │
│                                             │
├─────────────────────────────────────────────┤
│  ...                                        │
└─────────────────────────────────────────────┘
```

### 2.2 Informações por Conflito

Cada item no painel de conflitos exibe:

1. **Celebração**: nome e data da celebração afetada
2. **Função**: a função litúrgica que ficou sem atribuição
3. **Tipo de conflito**: badge colorido com o código do conflito
4. **Descrição**: texto explicativo gerado pelo algoritmo
5. **Ações sugeridas**: texto orientativo para a coordenadora
6. **Botões de ação**: as opções de resolução disponíveis

### 2.3 Ações Disponíveis

A coordenadora pode tomar três ações para cada conflito:

#### a) Atribuir Manualmente

Ao clicar em "Atribuir Manualmente", um modal é exibido com a lista de acólitos disponíveis para aquela função naquela data. A lista inclui:

- Acólitos qualificados para a função, ordenados por pontuação
- Para cada candidato:
  - Nome completo
  - Pontuação total (composite score)
  - Detalhamento da pontuação:
    - Pontuação de contagem (quantas vezes já serviu no período)
    - Pontuação de rotação (dias desde última vez nesta função)
    - Pontuação de intervalo (dias desde último serviço qualquer)
  - Indicador se já está atribuído a outra vaga na mesma celebração
  - Indicador se marcou indisponibilidade (com possibilidade de override)

A coordenadora seleciona um candidato e confirma. A atribuição é criada e automaticamente travada (ver seção 3).

#### b) Deixar Vago

A coordenadora marca explicitamente a vaga como aceita sem preenchimento. Isso:

- Remove o conflito da lista de pendências
- Marca a vaga com flag `acceptedVacant = true`
- Permite que a escala avance para publicação (com aviso)
- Registra na auditoria quem aceitou a lacuna e quando

#### c) Re-gerar

A coordenadora pode acionar uma re-geração parcial do algoritmo (ver seção 5). O botão de re-geração fica disponível no topo do painel de conflitos e afeta toda a escala (não apenas um conflito individual).

---

## 3. Mecanismo de Travamento e Destravamento

### 3.1 Conceito

O sistema de travamento (lock/unlock) permite que a coordenadora proteja atribuições específicas contra alterações do algoritmo durante re-gerações. Uma atribuição travada permanece intacta independentemente de quantas vezes o algoritmo for executado novamente.

### 3.2 Travamento (Lock)

- Na grade de atribuições da escala, cada atribuição exibe um ícone de cadeado
- Clicar no ícone de cadeado aberto trava a atribuição
- Atribuições travadas recebem:
  - Ícone de cadeado fechado (🔒)
  - Cor de fundo diferenciada (tom dourado suave, remetendo à estética eclesiástica do design system)
- O travamento é persistido no banco de dados (`locked = true` no `ScheduleAssignment`)

### 3.3 Destravamento (Unlock)

- Clicar no ícone de cadeado fechado destrava a atribuição
- A atribuição volta ao pool do algoritmo — na próxima re-geração, pode ser substituída
- O fundo volta à cor padrão e o ícone volta a cadeado aberto
- O destravamento é registrado na trilha de auditoria

### 3.4 Regras de Travamento

| Cenário | Comportamento |
|---------|---------------|
| Atribuição feita pelo algoritmo | Destravada por padrão |
| Atribuição feita manualmente pela coordenadora | **Travada automaticamente** |
| Atribuição criada via troca (swap) | **Travada automaticamente** |
| Coordenadora destrava atribuição manual | Volta ao pool do algoritmo |
| Re-geração executada | Atribuições travadas preservadas; destravadas recalculadas |

### 3.5 Indicadores Visuais

Na grade da escala, as atribuições são diferenciadas visualmente:

| Estado | Fundo | Ícone | Borda |
|--------|-------|-------|-------|
| Atribuição do algoritmo (destravada) | Branco padrão | Cadeado aberto (cinza) | Padrão |
| Atribuição travada | Pergaminho dourado | Cadeado fechado (bordô) | Bordô sutil |
| Vaga não resolvida | Vermelho claro | Alerta (⚠) | Vermelha |
| Vaga aceita como lacuna | Cinza claro | Traço (—) | Cinza |

---

## 4. Troca entre Acólitos (Swap)

### 4.1 Fluxo de Troca

1. Na página de detalhe da escala, a coordenadora localiza a atribuição que deseja alterar
2. Clica no botão de troca (ícone de setas cruzadas) na atribuição
3. O sistema exibe um modal com os candidatos alternativos

### 4.2 Modal de Troca

O modal apresenta:

```
┌───────────────────────────────────────────────────┐
│  Trocar atribuição                          [X]   │
│                                                   │
│  Celebração: Missa Dominical — 12/04              │
│  Função: Naviculário                              │
│  Atribuído atualmente: João Pedro                 │
│                                                   │
│  ─── Candidatos disponíveis ─────────────────     │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ Maria Clara           Pontuação: 87        │  │
│  │ Contagem: 92 │ Rotação: 85 │ Intervalo: 78│  │
│  │                          [Selecionar]       │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ Lucas Gabriel          Pontuação: 74        │  │
│  │ Contagem: 80 │ Rotação: 70 │ Intervalo: 68│  │
│  │ ⚠ Já atribuído como Ceroferário            │  │
│  │                          [Selecionar]       │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ Ana Beatriz            Pontuação: 61        │  │
│  │ Contagem: 55 │ Rotação: 72 │ Intervalo: 60│  │
│  │                          [Selecionar]       │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│                               [Cancelar]          │
└───────────────────────────────────────────────────┘
```

**Informações de cada candidato:**

- Nome completo
- Pontuação total calculada pelo algoritmo
- Detalhamento das três dimensões de pontuação (contagem, rotação, intervalo)
- Avisos relevantes:
  - Se já está atribuído a outra função na mesma celebração
  - Se marcou indisponibilidade nesta data
  - Se está próximo do limiar de sobrecarga

### 4.3 Execução da Troca

Ao selecionar um candidato e confirmar:

1. A atribuição antiga é removida (soft delete, preservada na auditoria)
2. Uma nova atribuição é criada com o acólito selecionado
3. A nova atribuição é **automaticamente travada**
4. A trilha de auditoria registra:
   - Quem executou a troca (coordenadora)
   - Data e hora
   - Acólito anterior e novo acólito
   - Celebração e função afetadas
   - Pontuação do novo acólito no momento da troca

### 4.4 Restrições da Troca

- Só é possível trocar atribuições em escalas com status **DRAFT**
- Se a atribuição estiver travada, a coordenadora deve destravá-la primeiro ou pode trocar diretamente (a troca implica ciência da alteração)
- Não é possível trocar para um acólito que já ocupa a mesma função em outra celebração no mesmo horário

---

## 5. Re-geração Parcial

### 5.1 Conceito

Após a coordenadora fazer edições manuais (atribuições, trocas, aceitação de lacunas), pode ser necessário re-executar o algoritmo para preencher vagas remanescentes. A re-geração parcial respeita todas as decisões manuais travadas.

### 5.2 Comportamento

1. A coordenadora clica em "Re-gerar Escala" na página de detalhe
2. O sistema exibe um resumo antes da execução:
   - Quantidade de atribuições travadas (serão preservadas)
   - Quantidade de vagas destravadas (serão recalculadas)
   - Quantidade de lacunas aceitas (serão preservadas)
3. Após confirmação, o algoritmo executa considerando:
   - **Atribuições travadas**: tratadas como restrições fixas. O acólito travado não é considerado disponível para outras vagas que conflitem no mesmo horário
   - **Vagas destravadas**: entram no pool normal do algoritmo
   - **Lacunas aceitas**: preservadas como estão
4. Novos conflitos podem surgir da re-geração (por exemplo, um acólito que estava disponível agora está travado em outra vaga)
5. A trilha de auditoria registra a re-geração com:
   - Timestamp
   - Coordenadora responsável
   - Número de atribuições preservadas vs. recalculadas
   - Novos conflitos gerados

### 5.3 Limitações

- Não é possível re-gerar apenas um trecho da escala (por exemplo, apenas um dia). A re-geração afeta todas as vagas destravadas
- Se a re-geração gerar novos conflitos, a coordenadora precisa resolvê-los antes de publicar
- A re-geração não altera celebrações ou requisitos de função — apenas recalcula atribuições

---

## 6. Casos Extremos (Edge Cases)

### 6.1 Todos os Slots Resolvidos Manualmente

Quando a coordenadora resolve todas as vagas com conflito via atribuição manual ou aceitação de lacuna:

- O painel de conflitos exibe "Nenhum conflito pendente"
- O botão "Publicar Escala" fica habilitado
- Todas as atribuições manuais estão travadas por padrão

### 6.2 Vagas Vagas Aceitas

Quando a coordenadora aceita lacunas em uma ou mais vagas:

- A escala pode ser publicada, mas com um aviso explícito:
  > "Esta escala possui X vaga(s) sem atribuição aceita(s) como lacuna. Deseja publicar mesmo assim?"
- Na escala publicada, vagas aceitas como lacunas aparecem como "Sem acólito designado" (sem alarme visual, apenas texto informativo)
- A página pública também exibe a lacuna de forma discreta

### 6.3 Re-geração Após Publicação

**Não é permitida.** Uma vez que a escala é publicada (status `PUBLISHED`), ela se torna imutável. Para gerar uma nova versão:

1. A coordenadora acessa a escala publicada
2. Clica em "Duplicar como Rascunho"
3. O sistema cria uma nova escala com status `DRAFT`, copiando:
   - Mesmo período e celebrações
   - Todas as atribuições da escala original (destravadas por padrão)
   - Nenhum conflito (os conflitos são recalculados na re-geração)
4. A escala original permanece publicada até que a nova seja publicada
5. Ao publicar a nova versão, a anterior é automaticamente arquivada (`ARCHIVED`)

### 6.4 Escala sem Nenhum Acólito Disponível

Se para todas as vagas o algoritmo retornar conflito:

- A escala é criada com 0 atribuições e N conflitos
- A coordenadora recebe uma mensagem de orientação:
  > "O algoritmo não conseguiu preencher nenhuma vaga. Verifique se os acólitos possuem qualificações e disponibilidade no período selecionado."
- A resolução é inteiramente manual

### 6.5 Conflitos em Cascata

Uma re-geração pode resolver conflitos antigos mas criar novos. Exemplo:

- Conflito original: Ana indisponível em 12/04 para Ceroferário
- Coordenadora atualiza disponibilidade de Ana e re-gera
- Ana é atribuída ao Ceroferário em 12/04, mas isso remove Ana de outra vaga onde ela era a única opção
- Novo conflito criado na vaga anterior de Ana

O sistema sempre exibe o estado atualizado de conflitos após cada re-geração.

---

## 7. Exemplo Completo de Fluxo de Trabalho

A seguir, um cenário realista que demonstra o ciclo completo de geração, resolução e publicação.

### Passo 1 — Geração Inicial

A coordenadora acessa "Nova Escala", seleciona o período de abril (01/04 a 30/04) e dispara a geração automática. O algoritmo processa 10 celebrações com 5 vagas cada (50 vagas no total).

**Resultado**: 45 vagas preenchidas, 5 conflitos gerados.

### Passo 2 — Análise dos Conflitos

A coordenadora abre a escala e revisa o painel de conflitos:

| # | Celebração | Função | Tipo | Descrição |
|---|------------|--------|------|-----------|
| 1 | Missa Dominical 06/04 | Cerimoniário | `ALL_UNAVAILABLE` | Todos os 3 acólitos qualificados estão indisponíveis |
| 2 | Missa Dominical 13/04 | Cerimoniário | `ALL_UNAVAILABLE` | Todos os 3 acólitos qualificados estão indisponíveis |
| 3 | Missa Vespertina 10/04 | Naviculário | `INSUFFICIENT_CANDIDATES` | Único candidato (Lucas) já está atribuído como Ceroferário |
| 4 | Missa Vespertina 17/04 | Naviculário | `INSUFFICIENT_CANDIDATES` | Único candidato (Lucas) já está atribuído como Ceroferário |
| 5 | Missa Solene 20/04 | Turiferário | `QUALIFICATION_GAP` | Nenhum acólito possui qualificação de Turiferário |

### Passo 3 — Resolução dos Conflitos de Indisponibilidade

Para os conflitos 1 e 2 (`ALL_UNAVAILABLE`), a coordenadora:

1. Contata os acólitos qualificados como Cerimoniário por fora do sistema
2. Dois deles atualizam sua disponibilidade no sistema (removem a indisponibilidade)
3. A coordenadora volta à escala e clica em "Re-gerar Escala"
4. O algoritmo re-executa, preservando as 45 atribuições (nenhuma foi travada, mas todas são recalculadas)
5. Os conflitos 1 e 2 são resolvidos — os acólitos agora disponíveis são atribuídos

### Passo 4 — Resolução dos Conflitos de Candidatos Insuficientes

Para os conflitos 3 e 4 (`INSUFFICIENT_CANDIDATES`), a coordenadora:

1. Clica em "Atribuir Manualmente" no conflito 3
2. O modal exibe Lucas como único candidato qualificado, com a nota de que já serve como Ceroferário
3. A coordenadora decide atribuir Lucas como Naviculário e remove manualmente a atribuição de Ceroferário dele (que será preenchida na re-geração)
4. Repete o processo para o conflito 4
5. Ambas as atribuições são automaticamente travadas

### Passo 5 — Resolução da Lacuna de Qualificação

Para o conflito 5 (`QUALIFICATION_GAP`), a coordenadora:

1. Reconhece que nenhum acólito está treinado para Turiferário
2. Clica em "Deixar Vago"
3. Adiciona uma nota mental (ou registro externo): "Precisamos treinar alguém para Turiferário antes do próximo mês"
4. A vaga é aceita como lacuna

### Passo 6 — Re-geração Final

A coordenadora clica em "Re-gerar Escala":

- 2 atribuições manuais (Naviculário) permanecem travadas
- 1 lacuna aceita (Turiferário) permanece como está
- As vagas de Ceroferário liberadas pela redistribuição de Lucas entram no algoritmo
- O algoritmo preenche as vagas restantes

### Passo 7 — Revisão Final

A coordenadora revisa a escala completa:

- **49 vagas preenchidas** (45 do algoritmo original + 2 manuais + 2 da re-geração)
- **1 lacuna aceita** (Turiferário em 20/04)
- **0 conflitos pendentes**
- O botão "Publicar" está habilitado

### Passo 8 — Publicação

A coordenadora clica em "Publicar Escala":

1. O sistema exibe o aviso: "Esta escala possui 1 vaga sem atribuição aceita como lacuna. Deseja publicar mesmo assim?"
2. A coordenadora confirma
3. A escala muda para status `PUBLISHED`
4. Um link público é gerado (`/p/:token`)
5. O link pode ser compartilhado com os acólitos e a comunidade

---

## 8. Resumo das Regras

| Regra | Descrição |
|-------|-----------|
| Escala com `userId = NULL` | Permanece em DRAFT até resolução |
| Publicação com conflitos não tratados | Bloqueada |
| Publicação com lacunas aceitas | Permitida, com aviso |
| Atribuição manual | Travada automaticamente |
| Atribuição por troca | Travada automaticamente |
| Atribuição do algoritmo | Destravada por padrão |
| Re-geração | Preserva travadas, recalcula destravadas |
| Re-geração após publicação | Não permitida — duplicar como DRAFT |
| Troca de acólito | Registrada na auditoria, nova atribuição travada |
| Duplicação de escala publicada | Cria DRAFT com atribuições destravadas |
| Arquivamento automático | Escala anterior arquivada ao publicar nova versão do mesmo período |

---

## Referências Internas

- `docs/08-algoritmo-escala.md` — Especificação completa do algoritmo de geração e tipos de conflito
- `docs/04-regras-negocio.md` — Regras de transição de status (DRAFT, PUBLISHED, ARCHIVED)
- `docs/05-fluxos-usuario.md` — Fluxos de resolução de conflito e publicação
- `docs/09-especificacao-api.md` — Endpoints de escala, atribuições e auditoria
- `docs/12-mapa-telas.md` — Wireframes da página de detalhe da escala
