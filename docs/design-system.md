# Liturgix — Design System

Identidade visual: **Vitral Lateral Terroso** — inspiração em vitrais de catedral sobre base de tons terrosos e pergaminho.

Fontes: **Crimson Pro** (títulos, serifada) + **Inter** (corpo, sans-serif).

---

## 1. Paleta de Cores Base

### Neutros Escuros (sidebar, login, dark mode)

| Token | Hex | Uso |
|-------|-----|-----|
| `dark-900` | `#1a1210` | Fundo dark mode |
| `dark-800` | `#2d1f14` | Sidebar, cards dark |
| `dark-700` | `#3d2b1f` | Inputs login, bordas escuras |
| `dark-600` | `#4a3628` | Card login |
| `dark-500` | `#5a4636` | Bordas card login |

### Neutros Claros (conteúdo, light mode)

| Token | Hex | Uso |
|-------|-----|-----|
| `sand-100` | `#f3ece0` | Fundo conteúdo (light), inputs internos |
| `sand-200` | `#ede6d8` | Cards (light) |
| `sand-300` | `#d9cfbb` | Bordas, separadores (light) |
| `sand-400` | `#e6dcc8` | Barras de progresso bg |

### Acentos

| Token | Hex | Uso |
|-------|-----|-----|
| `gold` | `#c99560` | Logo, labels, acentos principais |
| `gold-dark` | `#b8944e` | Barras progresso, destaques |
| `burgundy` | `#7a2e1a` | Botões primários (gradiente start) |
| `burgundy-light` | `#a0413c` | Botões primários (gradiente end) |
| `green` | `#2a7a6f` | Confirmar, sucesso (gradiente start) |
| `green-light` | `#35958a` | Confirmar (gradiente end) |

### Textos

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `foreground` | `#2d1f14` | `#f0e6d8` | Texto principal |
| `muted` | `#9a8568` | `#7a5c3a` | Texto secundário |
| `muted-strong` | `#7a5c3a` | `#9a8568` | Metadata, captions |
| `link` | `#7a2e1a` | `#c99560` | Links, ações |

---

## 2. Cores por Função Litúrgica (Paleta Simbólica Quente)

Cada cor reflete o simbolismo do objeto/papel litúrgico.

| Função | Hex | Simbolismo |
|--------|-----|------------|
| Cruciferário | `#8b1a1a` | Vermelho escuro — sangue de Cristo, a cruz |
| Ceroferário | `#c99560` | Dourado — luz das velas, chama |
| Turiferário | `#7a5c3a` | Bronze — metal do turíbulo, fumaça |
| Naveteiro | `#a67c52` | Cobre — metal da naveta, incenso |
| Acólito do Missal | `#6b4226` | Marrom couro — encadernação do missal |
| Acólito das Galhetas | `#6e3044` | Vinho — água e vinho eucarístico |
| Acólito da Credência | `#5c6b4e` | Verde oliva — toalha do altar, linho |
| Acólito da Patena | `#b8944e` | Ouro — patena dourada, comunhão |
| Cerimoniário | `#3d5a6e` | Azul noturno — autoridade, coordenação |

As cores das funções **não mudam** entre light e dark mode.

---

## 3. Tokens Semânticos (Light vs Dark)

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `background` | `#f3ece0` | `#1a1210` | Fundo da área de conteúdo |
| `card` | `#ede6d8` | `#2d1f14` | Cards, containers elevados |
| `card-inner` | `#f3ece0` | `#1a1210` | Inputs e sub-cards dentro de cards |
| `border` | `#d9cfbb` | `#3d2b1f` | Bordas, separadores |
| `foreground` | `#2d1f14` | `#f0e6d8` | Texto principal |
| `muted` | `#9a8568` | `#7a5c3a` | Texto secundário |
| `muted-btn` | `#d9cfbb` | `#3d2b1f` | Botão secundário ("Não posso") |
| `accent` | `#c99560` | `#c99560` | Dourado (igual nos dois modos) |
| `primary` | `#7a2e1a` | `#7a2e1a` | Borgonha (igual nos dois modos) |
| `success` | `#2a7a6f` | `#2a7a6f` | Verde (igual nos dois modos) |

A sidebar (`#2d1f14` → `#3d2b1f`) é **igual nos dois modos**.

O login é **sempre escuro** (não muda entre modos).

---

## 4. Elementos de Vitral

### Manchas de vitral (fundo)
Gradientes radiais sobrepostos com cores das funções em opacidade muito baixa.
- **Sidebar**: opacity `0.04`
- **Login (fundo)**: opacity `0.06`
- **Dark mode (conteúdo)**: opacity `0.03`
- **Light mode (conteúdo)**: não tem manchas

```css
/* Exemplo: manchas da sidebar */
background:
  radial-gradient(ellipse at 30% 20%, #8b1a1a 0%, transparent 50%),
  radial-gradient(ellipse at 70% 50%, #3d5a6e 0%, transparent 50%),
  radial-gradient(ellipse at 40% 80%, #c99560 0%, transparent 50%);
opacity: 0.04;
```

### Borda lateral vitral
Gradiente linear vertical com cores das funções. Usado em cards de escala.

```css
/* 4-5px de largura */
background: linear-gradient(180deg, #8b1a1a, #c99560, #5c6b4e, #3d5a6e, #6e3044);
```

### Arco dourado
Semicírculo sutil no login. Borda 1px, cor `#c9956015`.

```css
width: 220px;
height: 110px;
border: 1px solid #c9956015;
border-radius: 50% 50% 0 0;
border-bottom: none;
```

---

## 5. Componentes

### Sidebar
- Fundo: gradiente `#2d1f14` → `#3d2b1f`
- Manchas de vitral (opacity 0.04)
- Logo: texto "✦ Liturgix" em `Crimson Pro`, cor `#c99560`
- Item ativo: `border-left: 2px solid #c99560` + `background: linear-gradient(90deg, #c9956020, #c9956008)`
- Item inativo: texto `#b0a08a`
- Seção "Coordenação": label uppercase `#c9956060`
- Separador: `border-top: 1px solid #ffffff08`
- Usuário no rodapé: avatar colorido (cor da função principal) + nome + papel

### Login / Cadastro
- Fundo: gradiente `#2d1f14` → `#3d2b1f` (full page)
- Manchas de vitral (opacity 0.06)
- Arco dourado sutil atrás do logo
- Logo: "✦ Liturgix" em `Crimson Pro 28px`, cor `#c99560`
- Subtítulo: "ESCALAS LITÚRGICAS", `11px`, `letter-spacing: 2px`, cor `#7a5c3a`
- Citação: "*Servi ao Senhor com alegria*" — Sl 100,2, `Crimson Pro italic`, cor `#9a856860`
- Card: `#4a3628`, `border-radius: 12px`, `border: 1px solid #5a4636`, `box-shadow: 0 8px 32px #00000040`
- Inputs: `background: #3d2b1f`, `border: 1px solid #5a4636`
- Labels: uppercase, `letter-spacing: 1.5px`, cor `#c99560`
- Botão: `background: linear-gradient(135deg, #7a2e1a, #a0413c)`, cor `#f3ece0`
- Link "Cadastre-se": cor `#c99560`

### Card de Escala (Vitral Lateral)
- Borda vitral esquerda (4px, gradiente de cores das funções)
- Header: label "✦ MISSA SOLENE" (uppercase, `#b8944e`) + título serif + data/local
- Separador: `border-bottom: 2px solid #c9956025`
- Grid de ministros: cards com `border-left: 3px solid [cor-da-função]`
  - Nome da função: uppercase, cor da função
  - Avatar: círculo com iniciais, background da cor da função
  - Nome do acólito
- Status: "X de Y confirmados" com dot dourado
- Link: "Ver detalhes →" em cor primária

### Confirmação de Participação
- Dentro do card de escala, na parte inferior
- Dot dourado animado + texto "Você está escalado como **[Função]**"
- Dois botões lado a lado:
  - "✓ Confirmar presença": `background: linear-gradient(135deg, #2a7a6f, #35958a)`, texto claro
  - "Não posso": `background: #d9cfbb` (light) / `#3d2b1f` (dark), texto `#7a5c3a` / `#9a8568`

### Cards de Resumo (Painel)
- `border-left: 3px solid [cor-temática]`
- Label uppercase + valor grande + descrição
- Background: `card` token

---

## 6. Tipografia

### Crimson Pro (títulos)
- `32px` `600` — Títulos de página
- `24px` `500` — Subtítulos
- `18-22px` `500` — Títulos de card, nome de celebração
- `14px` `italic` — Citações bíblicas

### Inter (corpo e UI)
- `14px` `600` — Labels bold
- `13px` `500` — Texto regular
- `12px` `400` — Texto secundário
- `11px` `400` — Captions, metadata
- `10-11px` `600` `uppercase` `letter-spacing: 1.5-3px` — Labels de seção

---

## 7. Espaçamento e Bordas

- Border radius cards: `8-12px`
- Border radius inputs: `8px`
- Border radius botões: `6-8px`
- Border radius avatares: `50%` (círculo)
- Padding cards: `16-24px`
- Gap entre cards: `8-12px`
- Borda vitral lateral: `4-5px`
- Borda de função: `3px` (border-left)

---

## 8. Referência Visual

Os mockups interativos estão em `.superpowers/brainstorm/` e podem ser visualizados no navegador:

- `design-completo.html` — Design System completo (modo claro)
- `dark-mode.html` — Design System completo (modo escuro + comparações)
- `vitral-lateral-final.html` — Card de escala aprovado
- `cores-funcoes.html` — Paleta de funções litúrgicas
