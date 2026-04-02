# 11 - Design System

> *Sobriedade, reverencia, clareza.* O design do Liturgix se inspira na estetica eclesiastica: o tom quente do pergaminho envelhecido, o vinho profundo das vestes liturgicas, o dourado discreto dos calices e candelabros. Cada decisao visual busca dignidade sem ornamentacao excessiva.

**Modo claro apenas** (v1.0 -- sem dark mode).

---

## Sumario

1. [Paleta de Cores](#1-paleta-de-cores)
2. [Tipografia](#2-tipografia)
3. [Espacamento](#3-espacamento)
4. [Bordas e Raios](#4-bordas-e-raios)
5. [Sombras](#5-sombras)
6. [Estados Interativos](#6-estados-interativos)
7. [Componentes Base](#7-componentes-base)
8. [Padroes de Tela](#8-padroes-de-tela)
9. [Configuracao Tailwind](#9-configuracao-tailwind)

---

## 1. Paleta de Cores

Todas as cores utilizam o espaco **oklch** para perceptual uniformity.

### Custom Properties (CSS)

```css
:root {
  /* --- Fundo (Background) --- */
  --color-background:         oklch(0.98 0.005 80);   /* branco quente, pergaminho */
  --color-background-subtle:  oklch(0.96 0.008 80);   /* pergaminho levemente mais escuro */

  /* --- Primaria (Primary) --- vinho/borgonha liturgico */
  --color-primary:            oklch(0.40 0.15 25);
  --color-primary-hover:      oklch(0.46 0.14 25);
  --color-primary-active:     oklch(0.36 0.16 25);
  --color-primary-foreground:  oklch(0.98 0.005 80);   /* texto sobre primaria */

  /* --- Destaque (Accent) --- dourado discreto */
  --color-accent:             oklch(0.75 0.12 85);
  --color-accent-hover:       oklch(0.70 0.13 85);
  --color-accent-foreground:  oklch(0.25 0.01 250);

  /* --- Texto (Text) --- */
  --color-text:               oklch(0.25 0.01 250);    /* carvao escuro, nunca preto puro */
  --color-text-secondary:     oklch(0.45 0.01 250);    /* carvao mais claro */
  --color-text-muted:         oklch(0.55 0.008 250);   /* texto terciario */

  /* --- Suave (Muted) --- */
  --color-muted:              oklch(0.94 0.01 80);     /* pergaminho discreto */
  --color-muted-foreground:   oklch(0.45 0.01 250);

  /* --- Borda (Border) --- */
  --color-border:             oklch(0.88 0.01 80);     /* cinza quente sutil */
  --color-border-strong:      oklch(0.80 0.015 80);    /* para divisores mais visiveis */

  /* --- Destrutivo (Destructive) --- vermelho abafado */
  --color-destructive:        oklch(0.50 0.15 25);
  --color-destructive-hover:  oklch(0.45 0.16 25);
  --color-destructive-foreground: oklch(0.98 0.005 80);

  /* --- Sucesso (Success) --- verde abafado */
  --color-success:            oklch(0.55 0.12 155);
  --color-success-hover:      oklch(0.50 0.13 155);
  --color-success-foreground: oklch(0.98 0.005 80);

  /* --- Info --- azul discreto */
  --color-info:               oklch(0.55 0.10 240);
  --color-info-foreground:    oklch(0.98 0.005 80);

  /* --- Warning --- ambar */
  --color-warning:            oklch(0.70 0.14 70);
  --color-warning-foreground: oklch(0.25 0.01 250);

  /* --- Ring (focus) --- */
  --color-ring:               oklch(0.40 0.15 25);     /* mesma primaria */

  /* --- Card --- */
  --color-card:               oklch(0.99 0.003 80);    /* branco ligeiramente quente */
  --color-card-foreground:    oklch(0.25 0.01 250);
}
```

### Resumo Visual

| Token               | Cor                          | Uso                                      |
|----------------------|------------------------------|------------------------------------------|
| `background`         | Branco pergaminho quente      | Fundo geral da aplicacao                 |
| `primary`            | Borgonha profundo             | Botoes principais, links, cabecalhos     |
| `accent`             | Dourado discreto              | Destaques, badges, icones decorativos    |
| `text`               | Carvao escuro                 | Texto principal                          |
| `text-secondary`     | Carvao claro                  | Labels, textos auxiliares                |
| `muted`              | Pergaminho suave              | Fundos de secoes, linhas alternadas      |
| `border`             | Cinza quente sutil            | Bordas de cards, inputs, tabelas         |
| `destructive`        | Vermelho abafado              | Acoes destrutivas, erros                 |
| `success`            | Verde abafado                 | Confirmacoes, status ativo               |

---

## 2. Tipografia

### Familias

| Uso        | Fonte          | Categoria  | Carater                              |
|------------|----------------|------------|--------------------------------------|
| Titulos    | **Crimson Pro** | Serif      | Tradicao, dignidade eclesiastica     |
| Corpo      | **Inter**       | Sans-serif | Legibilidade, modernidade discreta   |
| Codigo     | **JetBrains Mono** | Monospace | Clareza tecnica                     |

```css
:root {
  --font-heading: 'Crimson Pro', Georgia, 'Times New Roman', serif;
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}
```

### Importacao (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Escala de Tamanhos

| Token    | Tamanho | Uso tipico                            |
|----------|---------|---------------------------------------|
| `xs`     | 12px    | Captions, footnotes                   |
| `sm`     | 14px    | Labels, texto auxiliar                |
| `base`   | 16px    | Corpo de texto                        |
| `lg`     | 18px    | Texto em destaque, leads              |
| `xl`     | 20px    | Subtitulos de secao                   |
| `2xl`    | 24px    | Titulos de card/secao (h3)            |
| `3xl`    | 30px    | Titulos de pagina (h2)                |
| `4xl`    | 36px    | Titulos principais (h1)              |
| `5xl`    | 48px    | Display, titulos hero                 |

### Alturas de Linha

| Token      | Valor | Uso                                     |
|------------|-------|-----------------------------------------|
| `tight`    | 1.2   | Titulos, textos curtos                  |
| `normal`   | 1.5   | Corpo de texto, paragrafos             |
| `relaxed`  | 1.75  | Textos longos, areas de leitura ampla  |

### Hierarquia Tipografica

```
h1  — Crimson Pro 700, 36px, tight, color-primary
h2  — Crimson Pro 600, 30px, tight, color-text
h3  — Crimson Pro 600, 24px, tight, color-text
h4  — Inter 600, 20px, tight, color-text
h5  — Inter 600, 18px, normal, color-text
h6  — Inter 500, 16px, normal, color-text-secondary

body   — Inter 400, 16px, normal, color-text
small  — Inter 400, 14px, normal, color-text-secondary
caption — Inter 400, 12px, normal, color-text-muted
```

---

## 3. Espacamento

Base de **4px**. O sistema segue multiplos consistentes para manter ritmo vertical e horizontal.

| Token  | Valor | Uso                                          |
|--------|-------|----------------------------------------------|
| `1`    | 4px   | Espacamento minimo entre icones e texto      |
| `2`    | 8px   | Padding interno de badges, gaps pequenos     |
| `3`    | 12px  | Padding de inputs, gaps de formulario        |
| `4`    | 16px  | Padding de cards, margens entre elementos    |
| `6`    | 24px  | Separacao entre secoes dentro de um card     |
| `8`    | 32px  | Margens entre cards, separacao de secoes     |
| `12`   | 48px  | Espacamento entre blocos de conteudo         |
| `16`   | 64px  | Margens de pagina, espacamento hero          |

### Aplicacao

- **Cards**: padding `16px` (token `4`), gap interno `24px` (token `6`)
- **Formularios**: gap entre campos `16px`, gap entre label e input `8px`
- **Tabelas**: padding de celula `12px` horizontal, `8px` vertical
- **Pagina**: margem lateral `32px` em desktop, `16px` em mobile

---

## 4. Bordas e Raios

### Border Radius

| Token      | Valor | Uso                                     |
|------------|-------|-----------------------------------------|
| `sm`       | 4px   | Badges, chips                           |
| `DEFAULT`  | 6px   | Botoes, inputs, cards -- padrao geral   |
| `md`       | 8px   | Modals, popovers                        |
| `lg`       | 12px  | Cards grandes, imagens                  |
| `full`     | 9999px| Avatares, indicadores circulares        |

O raio padrao de **6px** e deliberadamente contido: evita a aparencia excessivamente arredondada e "amigavel" de interfaces consumer, mantendo a sobriedade eclesiastica.

### Bordas

- Espessura padrao: `1px`
- Cor padrao: `var(--color-border)`
- Bordas mais fortes (divisores): `var(--color-border-strong)`

---

## 5. Sombras

Sombras sutis que evocam a profundidade discreta de uma pagina sobre uma mesa de madeira. Sem elevacoes exageradas.

```css
:root {
  --shadow-sm:   0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-md:   0 2px 4px oklch(0 0 0 / 0.08);
  --shadow-lg:   0 4px 8px oklch(0 0 0 / 0.10);
  --shadow-none: 0 0 0 oklch(0 0 0 / 0);
}
```

| Token | Uso                                                |
|-------|----------------------------------------------------|
| `sm`  | Cards em repouso, dropdowns                        |
| `md`  | Cards em hover, modals pequenos                    |
| `lg`  | Modals grandes, elementos flutuantes               |

---

## 6. Estados Interativos

Cada estado deve ser claramente perceptivel sem ser agressivo, mantendo a sobriedade do tema.

### Hover

- **Botoes**: a luminosidade da cor aumenta levemente (ex: `primary` passa de `0.40` para `0.46` em oklch L)
- **Links**: sublinhado aparece (`text-decoration: underline`)
- **Cards clicaveis**: sombra sobe de `sm` para `md`, borda ganha `border-strong`
- **Linhas de tabela**: fundo muda para `muted`
- **Transicao**: `transition: all 150ms ease`

### Focus

- **Ring**: `2px solid var(--color-ring)` com `offset 2px`
- Ring usa a cor primaria (borgonha) para consistencia
- **Inputs**: borda muda para `primary`
- Todo elemento focavel via teclado deve ter ring visivel (acessibilidade)

```css
.focus-ring {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

### Disabled

- **Opacidade**: `0.50`
- **Cursor**: `not-allowed`
- **Interacao**: `pointer-events: none`
- Cores desaturam levemente, fundo tende a `muted`

### Loading

- **Skeleton**: fundo `muted` com animacao de pulso suave (`animate-pulse`)
- **Botoes em loading**: texto substituido por spinner, largura mantida para evitar layout shift
- **Spinner**: cor `primary`, tamanho proporcional ao contexto

### Error

- **Borda de input**: `var(--color-destructive)`
- **Mensagem de erro**: texto `destructive`, tamanho `sm` (14px), posicionada abaixo do campo
- **Icone**: circulo com exclamacao, cor `destructive`

### Success

- **Borda de input**: `var(--color-success)` (temporario, volta ao normal apos 2s)
- **Mensagem**: texto `success`, tamanho `sm`
- **Icone**: checkmark, cor `success`

---

## 7. Componentes Base

Todos os componentes utilizam **shadcn/ui** como base, customizados para o tema eclesiastico.

### 7.1 Button

Cinco variantes. Todos os botoes usam `font-family: var(--font-body)`, `font-weight: 500`, `border-radius: 6px`, `padding: 8px 16px`, transicao suave.

| Variante       | Fundo                  | Texto                       | Borda           | Descricao                              |
|----------------|------------------------|-----------------------------|-----------------|----------------------------------------|
| **Primary**    | `primary`              | `primary-foreground`        | nenhuma         | Acao principal -- borgonha solido       |
| **Secondary**  | `muted`                | `text`                      | `border`        | Acao secundaria -- pergaminho com borda|
| **Outline**    | transparente           | `primary`                   | `primary`       | Acao terciaria -- apenas contorno      |
| **Ghost**      | transparente           | `text-secondary`            | nenhuma         | Acao minima -- sem fundo nem borda     |
| **Destructive**| `destructive`          | `destructive-foreground`    | nenhuma         | Exclusao, cancelamento -- vermelho     |

**Tamanhos:**

| Tamanho | Padding       | Font size | Altura minima |
|---------|---------------|-----------|---------------|
| `sm`    | 4px 12px      | 14px      | 32px          |
| `DEFAULT` | 8px 16px   | 14px      | 40px          |
| `lg`    | 12px 24px     | 16px      | 48px          |
| `icon`  | 8px           | --        | 40px (quadrado)|

**Tratamento visual**: o botao primary em borgonha remete as vestes liturgicas do sacerdote. O efeito hover levemente mais claro simula o reflexo da luz sobre o tecido.

### 7.2 Card

Container principal de conteudo. Evoca a aparencia de um cartao de papel sobre o pergaminho.

```
+-------------------------------------------+
|  Card Header                    [Actions] |  <- padding 16px, border-bottom
|-------------------------------------------|
|                                           |
|  Card Content                             |  <- padding 16px 16px 24px
|                                           |
|-------------------------------------------|
|  Card Footer                              |  <- padding 16px, border-top, bg muted
+-------------------------------------------+
```

- **Fundo**: `card` (branco ligeiramente quente)
- **Borda**: `1px solid var(--color-border)`
- **Sombra**: `shadow-sm`
- **Raio**: `6px`
- **Header**: titulo em `Crimson Pro 600`, tamanho `xl` (20px)
- **Footer**: fundo levemente `muted`, botoes de acao alinhados a direita

### 7.3 Dialog / Modal

Sobreposicao com backdrop semi-transparente. O dialog emerge do centro como um pergaminho desenrolado.

- **Backdrop**: `oklch(0.25 0.01 250 / 0.60)` -- escurecimento suave
- **Container**: fundo `card`, borda `border`, raio `md` (8px), sombra `lg`
- **Largura**: `480px` padrao, `640px` para formularios complexos
- **Padding**: `24px`
- **Titulo**: `Crimson Pro 600`, tamanho `2xl` (24px)
- **Animacao**: fade-in do backdrop + scale-in sutil do container (95% -> 100%)
- **Fechamento**: botao X no canto superior direito, click no backdrop, tecla Escape

### 7.4 Table

Tabelas claras e legíveis, com linhas alternadas que lembram as paginas de um livro contabil paroquial.

- **Header**: fundo `muted`, texto `text-secondary`, `Inter 600` tamanho `sm`, uppercase com `letter-spacing: 0.05em`
- **Linhas alternadas (striped)**: fundo alternando entre `background` e `muted` com opacidade 0.5
- **Borda**: `1px solid var(--color-border)` nas divisoes horizontais
- **Hover em linha**: fundo `muted`
- **Celulas**: padding `12px horizontal`, `8px vertical`
- **Paginacao**: posicionada abaixo da tabela, alinhada a direita, botoes `ghost` com numeros de pagina

```
+------+---------------------+----------+---------+
| #    | Acólito             | Funcao   | Status  |
+------+---------------------+----------+---------+
|  1   | Joao Pedro Silva    | Cerimoniario | Ativo |  <- fundo background
|  2   | Maria das Gracas    | Turiferário  | Ativo |  <- fundo muted/50
|  3   | Antonio Carlos      | Cruciferário | Inativo| <- fundo background
+------+---------------------+----------+---------+
                                    < 1  2  3  >
```

### 7.5 Form Fields

#### Input

- **Fundo**: `background`
- **Borda**: `1px solid var(--color-border)`, raio `6px`
- **Padding**: `8px 12px`
- **Fonte**: `Inter 400`, `base` (16px)
- **Placeholder**: `text-muted`
- **Focus**: borda `primary`, ring `primary` com offset
- **Error**: borda `destructive`, mensagem de erro abaixo
- **Label**: `Inter 500`, `sm` (14px), `text-secondary`, posicionada acima com gap `8px`

#### Textarea

- Mesmas propriedades do Input
- Altura minima: `120px`
- Resize: `vertical`

#### Select

- Aparencia nativa substituida por componente customizado
- Trigger: mesma aparencia do Input, com seta (chevron) a direita em `text-secondary`
- Dropdown: fundo `card`, borda `border`, sombra `md`, raio `6px`
- Item hover: fundo `muted`
- Item selecionado: fundo `primary` com opacidade 0.1, texto `primary`

### 7.6 Calendar

Componente central para definicao de disponibilidade dos acolitos. Inspirado visualmente em um calendario liturgico.

- **Header do mes**: `Crimson Pro 600`, `xl`, com setas de navegacao `ghost`
- **Dias da semana**: `Inter 500`, `xs`, `text-muted`, uppercase
- **Celulas de dia**: `40px x 40px`, `Inter 400`, `sm`
- **Dia atual**: ring `accent` (dourado)
- **Dia selecionado**: fundo `primary`, texto `primary-foreground`
- **Dia indisponivel**: texto `text-muted`, opacidade `0.4`
- **Dia com celebracao**: indicador circular dourado (`accent`) abaixo do numero
- **Range selecionado**: fundo `primary` com opacidade 0.1 nos dias intermediarios

```
        Abril 2026
  Dom  Seg  Ter  Qua  Qui  Sex  Sab
               1    2   [3]   4
   5    6    7    8    9   10   11
  12  [13]  14   15   16   17   18
  19   20   21   22   23   24   25
  26   27   28   29   30

  [3]  = hoje (ring dourado)
  [13] = selecionado (fundo borgonha)
  Dias com ponto dourado = celebracoes agendadas
```

### 7.7 Badge

Pequenos indicadores para funcoes liturgicas e status.

**Variantes:**

| Variante       | Fundo              | Texto            | Uso                                   |
|----------------|---------------------|------------------|---------------------------------------|
| **Default**    | `muted`            | `text`           | Informacao neutra                     |
| **Primary**    | `primary/15`       | `primary`        | Funcao liturgica principal            |
| **Accent**     | `accent/20`        | `text`           | Destaque especial, solenidade         |
| **Success**    | `success/15`       | `success`        | Confirmado, disponivel                |
| **Destructive**| `destructive/15`   | `destructive`    | Indisponivel, conflito                |
| **Outline**    | transparente       | `text-secondary`  | Informacao secundaria com borda       |

- **Tamanho**: padding `4px 8px`, raio `4px`, `Inter 500`, `xs` (12px)
- **Badges de funcao**: Ex: `Cerimoniario` em primary, `Turiferario` em accent, `Cruciferario` em default

### 7.8 Toast

Notificacoes temporarias no canto inferior direito.

| Variante     | Icone        | Borda esquerda    | Descricao                |
|--------------|--------------|-------------------|--------------------------|
| **Success**  | Checkmark    | `success` 3px     | Acao concluida           |
| **Error**    | X circulo    | `destructive` 3px | Falha na operacao        |
| **Info**     | Info circulo | `info` 3px        | Informacao contextual    |
| **Warning**  | Alerta       | `warning` 3px     | Atencao necessaria       |

- **Fundo**: `card`
- **Sombra**: `md`
- **Raio**: `6px`
- **Duracao**: 5 segundos (auto-dismiss)
- **Animacao**: slide-in da direita + fade-out na saida
- **Acao opcional**: link ou botao `ghost` para desfazer

### 7.9 Skeleton

Placeholders de carregamento que mantem o layout estavel.

- **Fundo**: `muted`
- **Animacao**: pulso suave (opacidade oscila entre `1.0` e `0.5`)
- **Formas**: retangulos arredondados (raio `4px`) que mimetizam o conteudo final
- **Duracao do ciclo**: `1.5s`

Skeletons devem corresponder fielmente ao layout do conteudo que substituem: linhas de texto, avatares circulares, colunas de tabela.

---

## 8. Padroes de Tela

### 8.1 Lista com Filtros

Layout classico de gestao: barra lateral de filtros a esquerda + tabela a direita.

```
+------------------+------------------------------------------+
|                  |  Titulo da Pagina              [+ Novo]  |
|  FILTROS         |  ----------------------------------------|
|                  |                                          |
|  Funcao          |  +------+----------+--------+---------+  |
|  [x] Cerimoniario|  | #   | Nome     | Funcao | Status  |  |
|  [ ] Turiferário |  +------+----------+--------+---------+  |
|  [ ] Cruciferário|  | 1   | Joao P.  | Cer.   | Ativo   |  |
|                  |  | 2   | Maria G. | Tur.   | Ativo   |  |
|  Status          |  | 3   | Antonio  | Cru.   | Inativo |  |
|  [x] Ativo       |  +------+----------+--------+---------+  |
|  [ ] Inativo     |  |                     < 1  2  3  >  |  |
|                  |  +------+----------+--------+---------+  |
|  [Limpar filtros]|                                          |
+------------------+------------------------------------------+
```

- **Sidebar de filtros**: largura `240px`, fundo `background-subtle`, padding `16px`, checkboxes e selects
- **Area principal**: tabela com paginacao, header com titulo (`Crimson Pro`) e botao de acao primaria
- **Responsividade**: em telas < 768px, filtros colapsam para um botao que abre drawer/modal

### 8.2 Visualizacao de Detalhe

Card central com informacoes do registro, cards secundarios ao lado.

```
+------------------------------------------+------------------+
|                                          |                  |
|  Card Principal                          |  Card Lateral    |
|  ----------------------------------------|                  |
|  Nome: Joao Pedro Silva                  |  Proximas        |
|  Funcao: Cerimoniario                    |  Escalas         |
|  Paroquia: Sao Jose                      |  ----------      |
|  Desde: Mar/2024                         |  12/04 - Missa   |
|                                          |  19/04 - Missa   |
|  [Editar]  [Remover]                     |  26/04 - Missa   |
|                                          |                  |
+------------------------------------------+------------------+
```

- **Card principal**: largura `2/3`, todas as informacoes do registro
- **Card lateral**: largura `1/3`, informacoes contextuais (proximas escalas, historico)
- **Acoes**: botoes no footer do card principal

### 8.3 Formulario

Layout vertical, labels acima dos campos, agrupamentos logicos com divisores.

```
+------------------------------------------+
|  Novo Acolito                            |  <- Crimson Pro h2
|  ----------------------------------------|
|                                          |
|  Dados Pessoais                          |  <- Secao com divider
|  ...........................................|
|                                          |
|  Nome completo *                         |
|  [_________________________________]     |
|                                          |
|  Email                                   |
|  [_________________________________]     |
|                                          |
|  Telefone                                |
|  [_________________________________]     |
|                                          |
|  Funcao Liturgica                        |  <- Secao
|  ...........................................|
|                                          |
|  Funcao *                                |
|  [ Selecione...              v ]         |
|                                          |
|  Experiencia                             |
|  [ Textarea                         ]    |
|  [                                   ]   |
|                                          |
|  --------------------------------------- |
|              [Cancelar]  [Salvar]        |  <- Footer com acoes
+------------------------------------------+
```

- **Largura maxima**: `640px`, centralizado
- **Secoes**: titulo `Inter 600`, `lg`, com linha divisora `border` abaixo
- **Campos obrigatorios**: asterisco `destructive` ao lado do label
- **Footer**: alinhado a direita, `Cancelar` como `ghost`, `Salvar` como `primary`
- **Validacao**: inline, mensagens abaixo do campo em `destructive`

### 8.4 Visualizacao de Calendario

Grade mensal para gestao de disponibilidade e visualizacao de celebracoes.

```
+--------------------------------------------------+
|  <  Abril 2026  >                    [Semana|Mes] |
|--------------------------------------------------|
|  Dom    Seg    Ter    Qua    Qui    Sex    Sab   |
|--------------------------------------------------|
|               |  1   |  2   | [3]  |  4   |     |
|               |      |      |      |  *   |     |
|--------------------------------------------------|
|   5   |  6   |  7   |  8   |  9   | 10   | 11  |
|       |      |      |      |      |  *   |     |
|--------------------------------------------------|
|  12   |[13]  | 14   | 15   | 16   | 17   | 18  |
|  *    |      |      |      |      |  *   |     |
|--------------------------------------------------|

  * = celebracao agendada (ponto dourado)
```

- **Celulas**: altura minima `80px`, permitindo exibir ate 2-3 eventos
- **Eventos dentro da celula**: badges pequenos com cor conforme tipo
- **Hover na celula**: fundo `muted`, click abre detalhe do dia
- **Navegacao**: setas para mes anterior/proximo, toggle semana/mes

### 8.5 Grade de Escala

Matriz celebracoes x funcoes -- a tela principal do sistema.

```
+--------------------------------------------------+
|  Escala: Abril 2026                              |
|--------------------------------------------------|
|  Celebracao          | Cerim. | Turif. | Crucif.|
|--------------------------------------------------|
|  05/04 - Domingo     | Joao   | Maria  | --     |
|  Missa 9h            |        |        |        |
|--------------------------------------------------|
|  12/04 - Domingo     | --     | Antonio| Joao   |
|  Missa 9h            |        |        |        |
|--------------------------------------------------|
|  12/04 - Domingo     | Maria  | --     | --     |
|  Missa 19h           |        |        |        |
|--------------------------------------------------|

  Joao  = [Badge primary]
  --    = celula vazia, click para atribuir
```

- **Coluna de celebracao**: fixa a esquerda, largura `200px`, fundo `muted`
- **Celulas de funcao**: centralizadas, contendo badge do acolito ou indicador vazio
- **Celula vazia**: borda `dashed`, click abre selector de acolitos disponiveis
- **Conflitos**: celula com fundo `destructive/10` e icone de alerta
- **Header sticky**: acompanha o scroll vertical

---

## 9. Configuracao Tailwind

Trecho de configuracao para `tailwind.config.ts` integrando todo o design system.

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./frontend/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "oklch(0.98 0.005 80)",
          subtle: "oklch(0.96 0.008 80)",
        },
        primary: {
          DEFAULT: "oklch(0.40 0.15 25)",
          hover: "oklch(0.46 0.14 25)",
          active: "oklch(0.36 0.16 25)",
          foreground: "oklch(0.98 0.005 80)",
        },
        accent: {
          DEFAULT: "oklch(0.75 0.12 85)",
          hover: "oklch(0.70 0.13 85)",
          foreground: "oklch(0.25 0.01 250)",
        },
        text: {
          DEFAULT: "oklch(0.25 0.01 250)",
          secondary: "oklch(0.45 0.01 250)",
          muted: "oklch(0.55 0.008 250)",
        },
        muted: {
          DEFAULT: "oklch(0.94 0.01 80)",
          foreground: "oklch(0.45 0.01 250)",
        },
        border: {
          DEFAULT: "oklch(0.88 0.01 80)",
          strong: "oklch(0.80 0.015 80)",
        },
        destructive: {
          DEFAULT: "oklch(0.50 0.15 25)",
          hover: "oklch(0.45 0.16 25)",
          foreground: "oklch(0.98 0.005 80)",
        },
        success: {
          DEFAULT: "oklch(0.55 0.12 155)",
          hover: "oklch(0.50 0.13 155)",
          foreground: "oklch(0.98 0.005 80)",
        },
        info: {
          DEFAULT: "oklch(0.55 0.10 240)",
          foreground: "oklch(0.98 0.005 80)",
        },
        warning: {
          DEFAULT: "oklch(0.70 0.14 70)",
          foreground: "oklch(0.25 0.01 250)",
        },
        card: {
          DEFAULT: "oklch(0.99 0.003 80)",
          foreground: "oklch(0.25 0.01 250)",
        },
        ring: "oklch(0.40 0.15 25)",
      },
      fontFamily: {
        heading: [
          "Crimson Pro",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        body: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "monospace",
        ],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.2" }],
        "2xl": ["24px", { lineHeight: "1.2" }],
        "3xl": ["30px", { lineHeight: "1.2" }],
        "4xl": ["36px", { lineHeight: "1.2" }],
        "5xl": ["48px", { lineHeight: "1.2" }],
      },
      lineHeight: {
        tight: "1.2",
        normal: "1.5",
        relaxed: "1.75",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px oklch(0 0 0 / 0.05)",
        md: "0 2px 4px oklch(0 0 0 / 0.08)",
        lg: "0 4px 8px oklch(0 0 0 / 0.10)",
        none: "0 0 0 oklch(0 0 0 / 0)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## Principios Gerais

1. **Sobriedade sobre expressividade.** Cada elemento visual deve justificar sua presenca. Sem gradientes, sem sombras dramaticas, sem animacoes exuberantes.

2. **Tradicao com legibilidade.** Crimson Pro traz a dignidade da tipografia eclesiastica; Inter garante que formularios e tabelas sejam perfeitamente legiveis em qualquer tamanho.

3. **Cor como significado.** Borgonha e a cor de acao e autoridade. Dourado e reservado para destaques especiais. Cores semanticas (destructive, success) sao abafadas, nunca gritantes.

4. **Espacamento consistente.** A grade de 4px cria ritmo visual previsivel. Nunca usar valores arbitrarios fora do sistema.

5. **Acessibilidade.** Todos os contrastes entre texto e fundo atendem WCAG AA (minimo 4.5:1 para texto normal). Focus rings visiveis em todos os elementos interativos.

6. **Pergaminho, nao papel.** O fundo quente e as bordas suaves criam a sensacao de um documento cuidadosamente preparado, nao de uma interface generica de SaaS.
