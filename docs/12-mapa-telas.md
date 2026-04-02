# 12 — Mapa de Telas

Wireframes textuais das 23 telas do Liturgix, com layout, componentes, endpoints consumidos, controle de acesso e interacoes principais.

---

## Indice

1. [/login](#1-login)
2. [/cadastro](#2-cadastro)
3. [/painel](#3-painel)
4. [/escalas](#4-escalas)
5. [/escala/:id](#5-escalaid)
6. [/escala/nova](#6-escalanova)
7. [/celebracoes](#7-celebracoes)
8. [/celebracao/:id](#8-celebracaoid)
9. [/celebracao/nova](#9-celebracaonova)
10. [/acolitos](#10-acolitos)
11. [/acolito/:id](#11-acolitoid)
12. [/disponibilidade](#12-disponibilidade)
13. [/minhas-funcoes](#13-minhas-funcoes)
14. [/meu-historico](#14-meu-historico)
15. [/responsaveis](#15-responsaveis)
16. [/responsaveis/:id](#16-responsaveisid)
17. [/coordenacao](#17-coordenacao)
18. [/admin](#18-admin)
19. [/admin/usuarios](#19-adminusuarios)
20. [/admin/funcoes](#20-adminfuncoes)
21. [/admin/auditoria](#21-adminauditoria)
22. [/p/:token](#22-ptoken)
23. [/celebracao/:id/editar](#23-celebracaoideditar)

---

## Navegacao por Papel (Sidebar)

A sidebar e o elemento principal de navegacao. Seu conteudo varia conforme o papel do usuario autenticado.

```
ACOLYTE                GUARDIAN              COORDINATOR            ADMIN
+-----------------+    +-----------------+   +-----------------+    +-----------------+
| [Logo]          |    | [Logo]          |   | [Logo]          |    | [Logo]          |
| Liturgix        |    | Liturgix        |   | Liturgix        |    | Liturgix        |
+-----------------+    +-----------------+   +-----------------+    +-----------------+
| Painel          |    | Painel          |   | Painel          |    | Painel          |
| Minha Dispon.   |    | Meus Acolitos   |   | Acolitos        |    | Acolitos        |
| Minhas Funcoes  |    | Disponibilidade |   | Celebracoes     |    | Celebracoes     |
| Escalas         |    | Escalas         |   | Escalas         |    | Escalas         |
| Meu Historico   |    | Historico       |   | Responsaveis    |    | Responsaveis    |
|                 |    |                 |   | Coordenacao     |    | Coordenacao     |
|                 |    |                 |   |                 |    | Administracao > |
|                 |    |                 |   |                 |    |   Usuarios      |
|                 |    |                 |   |                 |    |   Funcoes       |
|                 |    |                 |   |                 |    |   Auditoria     |
+-----------------+    +-----------------+   +-----------------+    +-----------------+
| [Avatar] Nome   |    | [Avatar] Nome   |   | [Avatar] Nome   |    | [Avatar] Nome   |
| Sair            |    | Sair            |   | Sair            |    | Sair            |
+-----------------+    +-----------------+   +-----------------+    +-----------------+
```

### Layout Base (todas as telas autenticadas)

```
+--sidebar(240px)--+----------content(flex-1)--------------------+
|                  | +--topbar--------------------------------+ |
| [Logo]           | | PageHeader: titulo + breadcrumb + acoes| |
| Liturgix         | +----------------------------------------+ |
|                  |                                             |
| nav items...     | +--main(padding 24px)---------------------+ |
|                  | |                                         | |
|                  | |  conteudo da pagina                     | |
|                  | |                                         | |
|                  | |                                         | |
|                  | +------------------------------------------+ |
|                  |                                             |
| [Avatar] Nome    |                                             |
| Sair             |                                             |
+------------------+---------------------------------------------+
```

---

## 1. /login

**Acesso:** Publico (redireciona para /painel se ja autenticado)

### Wireframe

```
+-------------------------------------------------------+
|                                                       |
|              +--Card(400px, centralizado)--+           |
|              |                             |           |
|              |     [Cruz/Logo Liturgix]    |           |
|              |     "Escala Liturgica"      |           |
|              |                             |           |
|              |  Email                      |           |
|              |  +------------------------+ |           |
|              |  | email@exemplo.com      | |           |
|              |  +------------------------+ |           |
|              |                             |           |
|              |  Senha                      |           |
|              |  +------------------------+ |           |
|              |  | ********               | |           |
|              |  +------------------------+ |           |
|              |                             |           |
|              |  [====== Entrar ========]   |           |
|              |                             |           |
|              |  Nao tem conta?             |           |
|              |  Cadastre-se (link)         |           |
|              |                             |           |
|              +-----------------------------+           |
|                                                       |
+-------------------------------------------------------+
```

### Componentes

- Card (container centralizado)
- Input (email, type="email")
- Input (senha, type="password")
- Button (primario, "Entrar", full-width)
- Link (para /cadastro)
- Toast (erro de autenticacao)

### Endpoints

- `POST /api/auth/login` — envia `{ email, password }`, recebe JWT

### Interacoes

- Submit do formulario dispara autenticacao
- Erro 401: Toast com "Email ou senha incorretos"
- Sucesso: armazena JWT, redireciona para /painel
- Se ja autenticado (JWT valido no storage): redireciona automaticamente para /painel

---

## 2. /cadastro

**Acesso:** Publico (redireciona para /painel se ja autenticado)

### Wireframe

```
+-------------------------------------------------------+
|                                                       |
|              +--Card(400px, centralizado)--+           |
|              |                             |           |
|              |     [Cruz/Logo Liturgix]    |           |
|              |     "Criar Conta"           |           |
|              |                             |           |
|              |  Nome completo              |           |
|              |  +------------------------+ |           |
|              |  | Maria da Silva         | |           |
|              |  +------------------------+ |           |
|              |                             |           |
|              |  Email                      |           |
|              |  +------------------------+ |           |
|              |  | maria@exemplo.com      | |           |
|              |  +------------------------+ |           |
|              |                             |           |
|              |  Senha                      |           |
|              |  +------------------------+ |           |
|              |  | ********               | |           |
|              |  +------------------------+ |           |
|              |                             |           |
|              |  Confirmar senha            |           |
|              |  +------------------------+ |           |
|              |  | ********               | |           |
|              |  +------------------------+ |           |
|              |                             |           |
|              |  Eu sou:                    |           |
|              |  (o) Acolito               |           |
|              |  (o) Responsavel           |           |
|              |                             |           |
|              |  [====== Cadastrar =====]   |           |
|              |                             |           |
|              |  Ja tem conta?              |           |
|              |  Entrar (link)              |           |
|              |                             |           |
|              +-----------------------------+           |
|                                                       |
+-------------------------------------------------------+
```

### Componentes

- Card (container centralizado)
- Input (nome, type="text")
- Input (email, type="email")
- Input (senha, type="password")
- Input (confirmar senha, type="password")
- RadioGroup (papel: ACOLYTE / GUARDIAN)
- Button (primario, "Cadastrar", full-width)
- Link (para /login)
- Toast (erro de validacao ou email duplicado)

### Endpoints

- `POST /api/auth/register` — envia `{ name, email, password, role }`

### Interacoes

- Validacao client-side via Zod: nome obrigatorio, email valido, senha >= 8 caracteres, senhas coincidem
- Erro 409 (email duplicado): Toast com mensagem
- Sucesso: redireciona para /login com Toast de sucesso
- Somente papeis ACOLYTE e GUARDIAN podem se registrar (COORDINATOR e ADMIN sao promovidos internamente)

---

## 3. /painel

**Acesso:** ACOLYTE, GUARDIAN, COORDINATOR, ADMIN

### Wireframe — Visao ACOLYTE

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Painel"                                  |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card "Proximas Escalas"----+ +--Card "Resumo"---+ |
|           | | Data       Celebracao Funcao| | Servicos: 12     | |
|           | | 06/abr     Missa Dom  Turib.| | Este mes: 3      | |
|           | | 13/abr     Missa Dom  Navet.| | Funcoes: 4       | |
|           | | 20/abr     Missa Dom  Cruci.| |                  | |
|           | +-----------------------------+ +------------------+ |
|           |                                                       |
|           | +--Card "Minha Disponibilidade"----------------------+ |
|           | | Abril 2026: 2 datas indisponiveis                  | |
|           | | [Gerenciar Disponibilidade] (link)                 | |
|           | +---------------------------------------------------+ |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Wireframe — Visao GUARDIAN

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Painel"                                  |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card "Proximas Escalas dos Meus Acolitos"---------+|
|           | | Acolito    Data       Celebracao       Funcao      ||
|           | | Joao       06/abr     Missa Dom        Turiferario ||
|           | | Ana        06/abr     Missa Dom        Naveteiro   ||
|           | | Joao       13/abr     Missa Dom        Crucifero   ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Meus Acolitos"--+ +--Card "Resumo"---------+|
|           | | Joao Silva   3 func.   | | Vinculados: 2          ||
|           | | Ana Santos   5 func.   | | Escalados abr: 4       ||
|           | +------------------------+ +------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Wireframe — Visao COORDINATOR / ADMIN

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Painel"                                  |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Stat--+ +--Stat--+ +--Stat--+ +--Stat-----------+ |
|           | |Acolitos| |Celebr. | |Escalas | |Cobertura        | |
|           | | 24     | | 8 prox.| | 2 draft| | 87% preenchidas | |
|           | +--------+ +--------+ +--------+ +-----------------+ |
|           |                                                       |
|           | +--Card "Escalas Pendentes"--+ +--Card "Proximas"---+|
|           | | Abril Sem1  DRAFT  [Ver]   | | 06/abr Missa Dom  ||
|           | | Abril Sem2  DRAFT  [Ver]   | | 09/abr Semana Sant.||
|           | +----------------------------+ | 13/abr Missa Dom  ||
|           |                                +--------------------+|
|           | +--Card "Atividade Recente"-------------------------+|
|           | | Maria editou escala Abril Sem1    ha 2 horas      ||
|           | | Pedro marcou indisponibilidade    ha 5 horas      ||
|           | | Sistema gerou escala Abril Sem2   ontem           ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo "Painel")
- Card (multiplos cards de resumo)
- Table (proximas escalas, compacta)
- Badge (status da escala: DRAFT, PUBLISHED)
- Stat cards (contadores para COORDINATOR/ADMIN)
- Link buttons (navegacao para secoes relacionadas)

### Endpoints

- `GET /api/auth/me` — dados do usuario e papel
- `GET /api/schedules?status=PUBLISHED&limit=5` — proximas escalas
- `GET /api/servers/:id/history?limit=5` — historico recente (ACOLYTE)
- `GET /api/guardians/:id/acolytes` — acolitos vinculados (GUARDIAN)
- `GET /api/admin/stats` — estatisticas gerais (COORDINATOR/ADMIN)
- `GET /api/celebrations?upcoming=true&limit=5` — proximas celebracoes (COORDINATOR/ADMIN)

### Interacoes

- Cards sao clicaveis e navegam para a secao detalhada
- Dados atualizados ao entrar na pagina (sem polling)
- ACOLYTE ve apenas seus proprios dados
- GUARDIAN ve dados dos acolitos vinculados
- COORDINATOR/ADMIN ve visao geral do sistema

---

## 4. /escalas

**Acesso:** ACOLYTE, GUARDIAN, COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Escalas"                                 |
|           |   [+ Nova Escala] (so COORDINATOR+)                   |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Filtros-------------------------------------------+|
|           | | Status: [Todos v] Periodo: [01/04] a [30/04]  [F] ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Table---------------------------------------------+|
|           | | Nome           | Periodo      | Status   | Acoes  ||
|           | |----------------|--------------|----------|--------||
|           | | Abril Sem 1    | 01-07/abr    | (PUBLIS) | [Ver]  ||
|           | | Abril Sem 2    | 08-14/abr    | (DRAFT)  | [Ver]  ||
|           | | Abril Sem 3    | 15-21/abr    | (DRAFT)  | [Ver]  ||
|           | | Marco Sem 4    | 24-31/mar    | (ARCHIV) | [Ver]  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | Mostrando 1-4 de 12     [< 1 2 3 >]                  |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + botao "Nova Escala" condicional)
- Select (filtro de status: Todos, Rascunho, Publicada, Arquivada)
- Input date (periodo inicio e fim)
- Button (filtrar)
- Table (DataTable com colunas: nome, periodo, status, acoes)
- Badge (status: verde=PUBLISHED, amarelo=DRAFT, cinza=ARCHIVED)
- Button (icone olho, navega para /escala/:id)
- Pagination (componente de paginacao)

### Endpoints

- `GET /api/schedules?status=&startDate=&endDate=&page=&limit=`

### Interacoes

- ACOLYTE e GUARDIAN so veem escalas com status PUBLISHED
- COORDINATOR e ADMIN veem todos os status
- Botao "Nova Escala" visivel apenas para COORDINATOR+
- Clicar em [Ver] navega para /escala/:id
- Filtros atualizam a tabela via query params na URL
- Paginacao server-side

---

## 5. /escala/:id

**Acesso:** ACOLYTE, GUARDIAN (so PUBLISHED), COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Escala: Abril Semana 1"                  |
|           |   Breadcrumb: Escalas > Abril Semana 1                |
|           |   [Publicar] [Editar] [Re-gerar] (so COORDINATOR+)   |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card Info--+ +--Card Status--+ +--Card Stats-----+|
|           | | 01-07/abr   | | (DRAFT)       | | Preenchidas: 18 ||
|           | | 4 celebr.   | |               | | Conflitos: 2    ||
|           | +-------------+ +---------------+ +-----------------+|
|           |                                                       |
|           | +--Grade Escala (tabela principal)--------------------+|
|           | |              | Turiferario | Naveteiro | Crucifero ||
|           | |--------------|-------------|-----------|-----------|
|           | | Dom 06/abr   |             |           |           ||
|           | |  Missa 10h   | Joao S.     | Ana M.    | Pedro L.  ||
|           | |              | [lock]      |           | [!conflito||
|           | |--------------|-------------|-----------|-----------|
|           | | Qua 09/abr   |             |           |           ||
|           | |  Missa 19h   | Maria C.    | -- vazio  | Lucas R.  ||
|           | |              |             | [!sem     |           ||
|           | |              |             |  candid.] |           ||
|           | |--------------|-------------|-----------|-----------|
|           | | Sex 11/abr   |             |           |           ||
|           | |  Via Sacra   | Ana M.      | Pedro L.  | Joao S.   ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Conflitos" (se houver)----------------------+|
|           | | [!] Dom 06/abr - Crucifero: SOBRECARGA (Pedro ja  ||
|           | |     escalado 3x esta semana) [Resolver]            ||
|           | | [!] Qua 09/abr - Naveteiro: SEM_CANDIDATOS        ||
|           | |     (nenhum acolito habilitado disponivel) [Atrib.]||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb + botoes de acao)
- Card (info, status, estatisticas)
- Badge (status da escala)
- Table/Grid (grade de escala: celebracoes x funcoes)
- Badge (nome do acolito em cada celula)
- Icone de cadeado (atribuicao travada)
- IndicadorConflito (icone de alerta + tooltip com detalhes)
- Card de conflitos (lista de conflitos com acoes)
- Button ("Publicar" — primario, "Editar", "Re-gerar" — secundarios)
- Dialog (confirmacao de publicacao)
- Dialog (confirmacao de re-geracao com opcao de preservar travados)

### Endpoints

- `GET /api/schedules/:id` — detalhe com atribuicoes e conflitos
- `POST /api/schedules/:id/publish` — publicar escala
- `POST /api/schedules/:id/assignments` — atribuicao manual
- `PATCH /api/schedules/:id/assignments/:assignmentId` — editar/trocar
- `DELETE /api/schedules/:id/assignments/:assignmentId` — remover
- `GET /api/schedules/:id/audit` — trilha de auditoria (COORDINATOR+)

### Interacoes

- **Celula da grade:** clicar abre popover com opcoes (trocar acolito, travar, destravar, remover)
- **Celula vazia:** clicar abre Dialog com lista de candidatos elegiveis + pontuacao
- **Botao Publicar:** Dialog de confirmacao, apos confirmar muda status para PUBLISHED
- **Botao Re-gerar:** Dialog com checkbox "Preservar atribuicoes travadas", dispara nova geracao
- **Indicador de conflito:** hover mostra tooltip com tipo e descricao, clicar abre resolucao
- **Botao Resolver (conflito):** abre Dialog com sugestoes (atribuir manualmente, ignorar, expandir busca)
- ACOLYTE/GUARDIAN: grade somente leitura, sem botoes de acao
- COORDINATOR/ADMIN: todas as acoes disponiveis

---

## 6. /escala/nova

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Nova Escala"                             |
|           |   Breadcrumb: Escalas > Nova                          |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Wizard Steps--------------------------------------+|
|           | | (1) Informacoes   (2) Celebracoes   (3) Gerar      ||
|           | |  [ativo]            [pendente]        [pendente]    ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | === PASSO 1: Informacoes ===                          |
|           |                                                       |
|           | +--Card----------------------------------------------+|
|           | |  Nome da escala                                    ||
|           | |  +----------------------------------------------+  ||
|           | |  | Abril - Semana 1                             |  ||
|           | |  +----------------------------------------------+  ||
|           | |                                                    ||
|           | |  Data inicio          Data fim                     ||
|           | |  +----------------+   +----------------+           ||
|           | |  | 01/04/2026     |   | 07/04/2026     |           ||
|           | |  +----------------+   +----------------+           ||
|           | |                                                    ||
|           | |                              [Proximo ->]          ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | === PASSO 2: Celebracoes ===                          |
|           |                                                       |
|           | +--Card----------------------------------------------+|
|           | | Celebracoes no periodo 01/04 - 07/04:              ||
|           | |                                                    ||
|           | | [x] Dom 06/abr - Missa Dominical 10h  (3 funcoes) ||
|           | | [x] Qua 09/abr - Missa Semanal 19h   (2 funcoes) ||
|           | | [ ] Sex 11/abr - Via Sacra 18h        (2 funcoes) ||
|           | |                                                    ||
|           | | "2 celebracoes selecionadas, 5 vagas totais"       ||
|           | |                                                    ||
|           | |  [<- Anterior]                  [Proximo ->]       ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | === PASSO 3: Gerar ===                                |
|           |                                                       |
|           | +--Card----------------------------------------------+|
|           | | Resumo:                                            ||
|           | | - Escala: Abril - Semana 1                         ||
|           | | - Periodo: 01/04 a 07/04                           ||
|           | | - Celebracoes: 2                                   ||
|           | | - Vagas a preencher: 5                             ||
|           | | - Acolitos disponiveis: 18                         ||
|           | |                                                    ||
|           | |  [<- Anterior]    [=== Gerar Escala ===]           ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Loading (apos clicar Gerar)------------------------+|
|           | | [spinner] Gerando escala... Isso pode levar         ||
|           | |           alguns segundos.                          ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb)
- Wizard/Stepper (3 etapas com indicador visual)
- Card (conteudo de cada etapa)
- Input (nome da escala)
- DatePicker (data inicio e fim)
- Checkbox list (celebracoes no periodo)
- Resumo textual (passo 3)
- Button ("Proximo", "Anterior", "Gerar Escala")
- Loading spinner (durante geracao assincrona)
- Toast (sucesso ou erro)

### Endpoints

- `GET /api/celebrations?startDate=&endDate=` — celebracoes no periodo (passo 2)
- `POST /api/schedules/generate` — envia `{ name, startDate, endDate, celebrationIds }` (passo 3)
- (worker Celery processa a geracao, API retorna ID da escala)

### Interacoes

- Navegacao entre passos com validacao em cada transicao
- Passo 1: nome obrigatorio, datas validas, fim >= inicio
- Passo 2: pelo menos 1 celebracao selecionada, exibe funcoes/vagas de cada uma
- Passo 3: botao "Gerar Escala" dispara geracao assincrona
- Apos geracao: redireciona para /escala/:id com Toast de sucesso
- Se erro na geracao: Toast de erro com descricao
- Botao "Anterior" preserva dados ja preenchidos

---

## 7. /celebracoes

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Celebracoes"                             |
|           |   [+ Nova Celebracao]                                 |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Filtros-------------------------------------------+|
|           | | Tipo: [Todos v]  Periodo: [01/04] a [30/04]  [F]  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Table---------------------------------------------+|
|           | | Data       | Nome              | Tipo     | Req.  ||
|           | |------------|-------------------|----------|-------||
|           | | 06/abr 10h | Missa Dominical   | (DOMIN.) | 3    ||
|           | | 09/abr 19h | Missa Semanal     | (SEMAN.) | 2    ||
|           | | 11/abr 18h | Via Sacra         | (ESPECI) | 2    ||
|           | | 13/abr 10h | Missa Dominical   | (DOMIN.) | 3    ||
|           | | 17/abr 20h | Missa Ceia Senhor | (ESPECI) | 5    ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | Mostrando 1-5 de 23     [< 1 2 3 4 5 >]              |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + botao "Nova Celebracao")
- Select (filtro por tipo: Dominical, Semanal, Especial, etc.)
- DatePicker (periodo inicio e fim)
- Button (filtrar)
- Table (DataTable: data/hora, nome, tipo, requisitos)
- Badge (tipo de celebracao com cor distinta)
- Pagination

### Endpoints

- `GET /api/celebrations?type=&startDate=&endDate=&page=&limit=`

### Interacoes

- Clicar na linha navega para /celebracao/:id
- Botao "Nova Celebracao" navega para /celebracao/nova
- Badge de tipo com cores: Dominical=bordo, Semanal=cinza, Especial=dourado
- Coluna "Req." mostra quantidade total de funcoes necessarias

---

## 8. /celebracao/:id

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Missa Dominical - 06/abr"                |
|           |   Breadcrumb: Celebracoes > Missa Dominical           |
|           |   [Editar] [Excluir]                                  |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card Informacoes----------------------------------+|
|           | | Nome:     Missa Dominical                          ||
|           | | Data:     06/04/2026 as 10:00                      ||
|           | | Tipo:     (DOMINICAL)                              ||
|           | | Local:    Igreja Matriz                            ||
|           | | Notas:    Domingo de Ramos                         ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Funcoes Necessarias"------------------------+|
|           | | Funcao           | Quantidade                      ||
|           | |------------------|---------------------------------||
|           | | Turiferario      | 1                               ||
|           | | Naveteiro        | 1                               ||
|           | | Crucifero        | 1                               ||
|           | |                                                    ||
|           | | Total: 3 vagas                                     ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Escalas Vinculadas"-------------------------+|
|           | | Abril Sem 1 - (DRAFT)    [Ver escala]              ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb + botoes Editar/Excluir)
- Card (informacoes da celebracao)
- Badge (tipo de celebracao)
- Table (funcoes necessarias: funcao + quantidade)
- Card (escalas que incluem esta celebracao)
- Button (link para escala)
- Dialog (confirmacao de exclusao)

### Endpoints

- `GET /api/celebrations/:id` — detalhe com requisitos
- `DELETE /api/celebrations/:id` — exclusao logica

### Interacoes

- Botao "Editar" navega para /celebracao/:id/editar
- Botao "Excluir" abre Dialog de confirmacao; ao confirmar, exclusao logica e redireciona para /celebracoes
- Link "Ver escala" navega para /escala/:id

---

## 9. /celebracao/nova

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Nova Celebracao"                         |
|           |   Breadcrumb: Celebracoes > Nova                      |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card Formulario-----------------------------------+|
|           | |  Nome                                              ||
|           | |  +----------------------------------------------+  ||
|           | |  | Missa Dominical                              |  ||
|           | |  +----------------------------------------------+  ||
|           | |                                                    ||
|           | |  Data                  Horario                     ||
|           | |  +----------------+    +----------------+          ||
|           | |  | 06/04/2026     |    | 10:00          |          ||
|           | |  +----------------+    +----------------+          ||
|           | |                                                    ||
|           | |  Tipo                                              ||
|           | |  +----------------------------------------------+  ||
|           | |  | Dominical                              [v]   |  ||
|           | |  +----------------------------------------------+  ||
|           | |                                                    ||
|           | |  Local                                             ||
|           | |  +----------------------------------------------+  ||
|           | |  | Igreja Matriz                                |  ||
|           | |  +----------------------------------------------+  ||
|           | |                                                    ||
|           | |  Notas                                             ||
|           | |  +----------------------------------------------+  ||
|           | |  | Domingo de Ramos                             |  ||
|           | |  +----------------------------------------------+  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Funcoes Necessarias"------------------------+|
|           | |  Funcao              Quantidade                    ||
|           | |  [Turiferario  v]    [1]   [x remover]            ||
|           | |  [Naveteiro    v]    [1]   [x remover]            ||
|           | |  [Crucifero    v]    [1]   [x remover]            ||
|           | |                                                    ||
|           | |  [+ Adicionar funcao]                              ||
|           | |                                                    ||
|           | |  Total: 3 vagas                                    ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           |  [Cancelar]                  [=== Salvar ===]         |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb)
- Card (formulario principal)
- Input (nome)
- DatePicker (data)
- Input time (horario)
- Select (tipo: Dominical, Semanal, Especial, etc.)
- Input (local)
- Textarea (notas)
- Card (funcoes necessarias — lista dinamica)
- Select (funcao litugica, de lista de funcoes ativas)
- Input number (quantidade)
- Button ("Adicionar funcao", "Remover", icone)
- Button ("Cancelar" — secundario, "Salvar" — primario)
- Toast (sucesso/erro)

### Endpoints

- `GET /api/admin/functions` — lista de funcoes ativas (para popular Select)
- `POST /api/celebrations` — criar celebracao
- `PUT /api/celebrations/:id/requirements` — definir funcoes necessarias (chamado apos criar)

### Interacoes

- Validacao: nome obrigatorio, data obrigatoria, tipo obrigatorio, pelo menos 1 funcao
- "Adicionar funcao" insere nova linha de funcao + quantidade
- "Remover" remove a linha (com confirmacao se so restar 1)
- "Cancelar" navega de volta para /celebracoes
- "Salvar" cria celebracao e define requisitos, redireciona para /celebracao/:id

---

## 10. /acolitos

**Acesso:** COORDINATOR, ADMIN (GUARDIAN ve /meus-acolitos que usa a mesma interface)

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Acolitos"                                |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Busca--------------------------------------------+|
|           | | [Buscar por nome...                          ] [F] ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card Grid (ou Table toggle)------------------------+|
|           | |                                                    ||
|           | | +--CardAcolito--+ +--CardAcolito--+ +--CardAcol--+ ||
|           | | | [Avatar]      | | [Avatar]      | | [Avatar]   | ||
|           | | | Joao Silva    | | Ana Santos    | | Pedro Lima | ||
|           | | | (ACOLYTE)     | | (ACOLYTE)     | | (ACOLYTE)  | ||
|           | | | 4 funcoes     | | 5 funcoes     | | 3 funcoes  | ||
|           | | | 12 servicos   | | 8 servicos    | | 15 servicos| ||
|           | | +---------------+ +---------------+ +------------+ ||
|           | |                                                    ||
|           | | +--CardAcolito--+ +--CardAcolito--+ +--CardAcol--+ ||
|           | | | [Avatar]      | | [Avatar]      | | [Avatar]   | ||
|           | | | Maria Costa   | | Lucas Reis    | | Julia Mend.| ||
|           | | | (ACOLYTE)     | | (ACOLYTE)     | | (ACOLYTE)  | ||
|           | | | 6 funcoes     | | 2 funcoes     | | 4 funcoes  | ||
|           | | | 10 servicos   | | 3 servicos    | | 7 servicos | ||
|           | | +---------------+ +---------------+ +------------+ ||
|           | |                                                    ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | Mostrando 1-6 de 24     [< 1 2 3 4 >]                |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo)
- Input search (busca por nome)
- Toggle view (grade/tabela — icone)
- CardAcolito (avatar placeholder, nome, badge papel, contagens)
- Badge (papel do usuario)
- Pagination

### Endpoints

- `GET /api/servers?search=&page=&limit=` — lista de acolitos

### Interacoes

- Clicar no card navega para /acolito/:id
- Busca filtra em tempo real (debounce 300ms)
- Toggle entre visualizacao em cards e tabela
- GUARDIAN: ve apenas seus acolitos vinculados (rota interna diferente, mesma UI)

---

## 11. /acolito/:id

**Acesso:** COORDINATOR, ADMIN (ACOLYTE ve o proprio perfil via /painel, GUARDIAN ve via /meus-acolitos)

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Joao Silva"                              |
|           |   Breadcrumb: Acolitos > Joao Silva                   |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card Perfil------+ +--Card Resumo----------------+|
|           | | [Avatar grande]   | | Total servicos: 12          ||
|           | | Joao Silva        | | Este mes: 3                 ||
|           | | joao@email.com    | | Funcoes habilitadas: 4      ||
|           | | (ACOLYTE)         | | Ultimo servico: 30/mar      ||
|           | | Cadastro: jan/26  | |                             ||
|           | +-------------------+ +-----------------------------+|
|           |                                                       |
|           | +--Card "Funcoes Habilitadas"------------------------+|
|           | | [x] Turiferario    [x] Naveteiro                   ||
|           | | [x] Crucifero      [x] Ceroferario                 ||
|           | | [ ] Libreiro       [ ] Cerimoniario                ||
|           | | [ ] Coroinha       [ ] Leitor                      ||
|           | | [ ] Salmista                                       ||
|           | |                                                    ||
|           | | [Salvar Alteracoes] (so COORDINATOR+)              ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Disponibilidade" (mini calendario)----------+|
|           | |          Abril 2026                                ||
|           | | D  S  T  Q  Q  S  S                                ||
|           | |          1  2  3  4  5                              ||
|           | | 6  7  8  9  10 11 12                                ||
|           | | 13 14 15 16 17 18 19                                ||
|           | | 20 21 22 23 24 25 26                                ||
|           | | 27 28 29 30                                         ||
|           | |                                                    ||
|           | | [vermelho] = indisponivel (2 datas)                ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Historico de Servicos"----------------------+|
|           | | Data       | Celebracao       | Funcao    | Status ||
|           | |------------|------------------|-----------|--------||
|           | | 30/mar     | Missa Dominical  | Turiferio | Serviu ||
|           | | 23/mar     | Missa Dominical  | Naveteiro | Serviu ||
|           | | 16/mar     | Missa Dominical  | Crucifero | Faltou ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (nome + breadcrumb)
- Card (perfil com avatar, nome, email, papel, data de cadastro)
- Card (resumo estatistico)
- Card (funcoes habilitadas — checkboxes)
- Checkbox (para cada funcao liturgica)
- Button ("Salvar Alteracoes" — condicional por papel)
- Calendar mini (visualizacao do mes com datas indisponiveis destacadas)
- Table (historico de servicos: data, celebracao, funcao, status)
- Badge (status: "Serviu" verde, "Faltou" vermelho)

### Endpoints

- `GET /api/servers/:id` — dados do acolito
- `GET /api/servers/:id/functions` — funcoes habilitadas
- `PUT /api/servers/:id/functions` — atualizar funcoes (COORDINATOR+)
- `GET /api/servers/:id/availability?month=&year=` — indisponibilidades
- `GET /api/servers/:id/history?page=&limit=` — historico de servicos

### Interacoes

- Checkboxes de funcoes editaveis apenas por COORDINATOR+
- "Salvar Alteracoes" envia PUT e exibe Toast de sucesso
- Calendario mini e somente leitura nesta tela
- Clicar em "Ver tudo" no historico poderia expandir/paginar
- Badge de status indica se o acolito serviu ou faltou

---

## 12. /disponibilidade

**Acesso:** ACOLYTE (propria), GUARDIAN (dos vinculados via sidebar diferente)

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Minha Disponibilidade"                   |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Seletor de Periodo-------------------------------+|
|           | |  [< Anterior]   Abril 2026   [Proximo >]          ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Calendario Grade---------------------------------+|
|           | |                                                    ||
|           | |  Dom    Seg    Ter    Qua    Qui    Sex    Sab     ||
|           | | +------+------+------+------+------+------+------+||
|           | | |      |      |      | 1    | 2    | 3    | 4    |||
|           | | |      |      |      |      |      |      |      |||
|           | | +------+------+------+------+------+------+------+||
|           | | | 5    | 6    | 7    | 8    | 9    | 10   | 11   |||
|           | | |      |[INDS]|      |      |      |      |      |||
|           | | +------+------+------+------+------+------+------+||
|           | | | 12   | 13   | 14   | 15   | 16   | 17   | 18   |||
|           | | |      |      |      |      |      |[INDS]|      |||
|           | | +------+------+------+------+------+------+------+||
|           | | | 19   | 20   | 21   | 22   | 23   | 24   | 25   |||
|           | | |      |      |      |      |      |      |      |||
|           | | +------+------+------+------+------+------+------+||
|           | | | 26   | 27   | 28   | 29   | 30   |      |      |||
|           | | |      |      |      |      |      |      |      |||
|           | | +------+------+------+------+------+------+------+||
|           | |                                                    ||
|           | |  [vermelho/INDS] = Indisponivel                    ||
|           | |  Clique em uma data para alternar disponibilidade   ||
|           | |                                                    ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Resumo-------------------------------------------+|
|           | | 2 datas indisponiveis em abril                     ||
|           | | Datas: 06/abr, 17/abr                              ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           |  [======== Salvar Disponibilidade ========]           |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo)
- Button (navegacao de mes: anterior/proximo)
- Calendar grid (grade mensal completa, celulas clicaveis)
- Badge/marcador visual (datas indisponiveis em vermelho/bordo)
- Card (resumo de indisponibilidades do mes)
- Button ("Salvar Disponibilidade" — primario, full-width)
- Toast (sucesso ao salvar)

### Endpoints

- `GET /api/servers/:id/availability?month=4&year=2026` — indisponibilidades do mes
- `PUT /api/servers/:id/availability` — envia `{ month, year, unavailableDates: ["2026-04-06", ...] }`

### Interacoes

- Clicar em uma data alterna entre disponivel (padrao) e indisponivel (vermelho)
- Navegacao entre meses carrega indisponibilidades do mes selecionado
- Alteracoes sao locais ate clicar "Salvar"
- Ao salvar: PUT substitui todas as indisponibilidades do periodo
- Datas passadas nao sao clicaveis (visualmente opacas)
- GUARDIAN: ve um seletor de acolito no topo para alternar entre vinculados

---

## 13. /minhas-funcoes

**Acesso:** ACOLYTE (somente leitura), COORDINATOR/ADMIN (via /acolito/:id para editar)

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Minhas Funcoes"                          |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card "Funcoes Liturgicas"-------------------------+|
|           | |                                                    ||
|           | | +--funcao------------------------------------------+||
|           | | | [x] Turiferario                                 |||
|           | | |     Responsavel pelo turibulo e incensacao.      |||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | +--funcao------------------------------------------+||
|           | | | [x] Naveteiro                                   |||
|           | | |     Auxilia o turiferario com a naveta.          |||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | +--funcao------------------------------------------+||
|           | | | [x] Crucifero                                   |||
|           | | |     Carrega a cruz processional.                 |||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | +--funcao------------------------------------------+||
|           | | | [x] Ceroferario                                 |||
|           | | |     Carrega os cirios/casticais.                 |||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | +--funcao------------------------------------------+||
|           | | | [ ] Libreiro                                    |||
|           | | |     Carrega o livro liturgico.                   |||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | +--funcao------------------------------------------+||
|           | | | [ ] Cerimoniario                                |||
|           | | |     Coordena as acoes liturgicas.                |||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | ... (demais funcoes)                                ||
|           | |                                                    ||
|           | | Nota: Suas funcoes sao gerenciadas pela            ||
|           | | coordenacao. Entre em contato para solicitar       ||
|           | | alteracoes.                                        ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo)
- Card (container da lista)
- Checkbox list (funcoes com descricao — desabilitado para ACOLYTE)
- Texto descritivo (explicacao de cada funcao)
- Nota informativa (sobre quem gerencia as funcoes)

### Endpoints

- `GET /api/servers/:id/functions` — funcoes habilitadas do acolito
- `GET /api/admin/functions` — lista completa de funcoes ativas

### Interacoes

- ACOLYTE: visualizacao somente leitura, checkboxes desabilitados
- Exibe todas as funcoes do sistema, com check nas habilitadas para o usuario
- Descricao de cada funcao visivel abaixo do nome
- Sem botao de salvar (ACOLYTE nao pode alterar)

---

## 14. /meu-historico

**Acesso:** ACOLYTE, GUARDIAN (dos vinculados)

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Meu Historico"                           |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Filtros-------------------------------------------+|
|           | | Periodo: [01/01/2026] a [03/04/2026]          [F]  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Resumo-------------------------------------------+|
|           | | Total de servicos: 12  |  Presencas: 11  |  Falta: 1|
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Table---------------------------------------------+|
|           | | Data       | Celebracao         | Funcao    |Status||
|           | |------------|--------------------|-----------|------||
|           | | 30/mar     | Missa Dominical    | Turiferio |(Srv)||
|           | | 23/mar     | Missa Dominical    | Naveteiro |(Srv)||
|           | | 16/mar     | Missa Dominical    | Crucifero |(Flt)||
|           | | 09/mar     | Missa Dominical    | Ceroferio |(Srv)||
|           | | 02/mar     | Missa Dominical    | Turiferio |(Srv)||
|           | | 23/fev     | Missa Dominical    | Naveteiro |(Srv)||
|           | | 16/fev     | Via Sacra          | Crucifero |(Srv)||
|           | | 09/fev     | Missa Dominical    | Turiferio |(Srv)||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | Mostrando 1-8 de 12     [< 1 2 >]                    |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo)
- DatePicker (periodo inicio e fim)
- Button (filtrar)
- Card (resumo: total, presencas, faltas)
- Table (DataTable: data, celebracao, funcao, status)
- Badge (status: "Serviu" verde, "Faltou" vermelho)
- Pagination

### Endpoints

- `GET /api/servers/:id/history?startDate=&endDate=&page=&limit=`

### Interacoes

- Filtro por periodo atualiza tabela e resumo
- ACOLYTE: ve apenas proprio historico
- GUARDIAN: ve historico dos vinculados (seletor de acolito no topo)
- Ordenacao padrao: mais recente primeiro
- Badge de status com cores distintas

---

## 15. /responsaveis

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Responsaveis"                            |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Busca--------------------------------------------+|
|           | | [Buscar por nome ou email...               ] [F]  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Table---------------------------------------------+|
|           | | Nome            | Email              | Acolitos   ||
|           | |-----------------|--------------------|-----------||
|           | | Sandra Oliveira | sandra@email.com   | 3          ||
|           | | Carlos Mendes   | carlos@email.com   | 2          ||
|           | | Rita Souza      | rita@email.com     | 1          ||
|           | | Paulo Ferreira  | paulo@email.com    | 4          ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | Mostrando 1-4 de 8     [< 1 2 >]                     |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo)
- Input search (busca por nome ou email)
- Table (DataTable: nome, email, quantidade de acolitos vinculados)
- Pagination

### Endpoints

- `GET /api/guardians?search=&page=&limit=`

### Interacoes

- Clicar na linha navega para /responsaveis/:id
- Busca com debounce
- Coluna "Acolitos" mostra contagem de vinculados

---

## 16. /responsaveis/:id

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Sandra Oliveira"                         |
|           |   Breadcrumb: Responsaveis > Sandra Oliveira          |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card Perfil--------------------------------------+|
|           | | Nome:   Sandra Oliveira                            ||
|           | | Email:  sandra@email.com                           ||
|           | | Papel:  (GUARDIAN)                                  ||
|           | | Desde:  Janeiro 2026                                ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Acolitos Vinculados"------------------------+|
|           | |                                                    ||
|           | | +--linha------------------------------------------+  ||
|           | | | [Avatar] Joao Silva  | 4 funcoes | 12 servicos|  ||
|           | | |                                    [Ver perfil]|  ||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | +--linha------------------------------------------+  ||
|           | | | [Avatar] Ana Santos  | 5 funcoes | 8 servicos |  ||
|           | | |                                    [Ver perfil]|  ||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | +--linha------------------------------------------+  ||
|           | | | [Avatar] Pedro Lima  | 3 funcoes | 15 servicos|  ||
|           | | |                                    [Ver perfil]|  ||
|           | | +--------------------------------------------------+||
|           | |                                                    ||
|           | | [+ Vincular Acolito]                               ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (nome + breadcrumb)
- Card (perfil do responsavel)
- Badge (papel GUARDIAN)
- Card/List (acolitos vinculados com avatar, nome, funcoes, servicos)
- Button ("Ver perfil" — navega para /acolito/:id)
- Button ("Vincular Acolito" — abre Dialog)
- Dialog (selecionar acolito para vincular — Select com busca)

### Endpoints

- `GET /api/guardians/:id/acolytes` — acolitos vinculados
- `POST /api/guardians/:id/link` — vincular acolito `{ acolyteId }`

### Interacoes

- "Ver perfil" navega para /acolito/:id
- "Vincular Acolito" abre Dialog com Select searchable de acolitos nao vinculados
- Ao vincular: Toast de sucesso, lista atualizada
- Opcao de desvincular (icone X ao lado de cada acolito, com Dialog de confirmacao)

---

## 17. /coordenacao

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Coordenacao"                             |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Stat--+ +--Stat--+ +--Stat--+ +--Stat-----------+ |
|           | |Rascunhos| |Proximas| |Cobertura| |Conflitos      | |
|           | | 3 pend. | | 5 cele.| | 87%     | | 4 abertos     | |
|           | +--------+ +--------+ +--------+ +-----------------+ |
|           |                                                       |
|           | +--Card "Escalas em Rascunho"-----------------------+|
|           | | Nome           | Periodo    | Cobertura | Acoes   ||
|           | |----------------|------------|-----------|---------|
|           | | Abril Sem 1    | 01-07/abr  | 85%       | [Ver]   ||
|           | | Abril Sem 2    | 08-14/abr  | 72%       | [Ver]   ||
|           | | Abril Sem 3    | 15-21/abr  | 90%       | [Ver]   ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Proximas Celebracoes sem Escala"------------+|
|           | | Data       | Nome              | Funcoes | Acao   ||
|           | |------------|-------------------|---------|--------|
|           | | 22/abr     | Missa Dominical   | 3       | [Nova] ||
|           | | 25/abr     | Missa Semanal     | 2       | [Nova] ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Acolitos com Pouca Disponibilidade"---------+|
|           | | Joao Silva    - 8 datas indisponiveis em abril      ||
|           | | Maria Costa   - 6 datas indisponiveis em abril      ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Distribuicao de Servicos (mes atual)"-------+|
|           | | Acolito        | Servicos | Media | Desvio        ||
|           | |----------------|----------|-------|---------------|
|           | | Pedro Lima     | 5        | 3.2   | +1.8          ||
|           | | Joao Silva     | 4        | 3.2   | +0.8          ||
|           | | Ana Santos     | 2        | 3.2   | -1.2          ||
|           | | Lucas Reis     | 1        | 3.2   | -2.2          ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo)
- Stat cards (rascunhos pendentes, proximas celebracoes, cobertura, conflitos)
- Card/Table (escalas em rascunho com % de cobertura)
- Card/Table (celebracoes sem escala vinculada)
- Card/List (acolitos com muitas indisponibilidades — alerta)
- Card/Table (distribuicao de servicos — desvio da media)
- Button ("Ver" — navega para /escala/:id)
- Button ("Nova" — navega para /escala/nova pre-selecionando celebracao)

### Endpoints

- `GET /api/schedules?status=DRAFT` — escalas em rascunho
- `GET /api/celebrations?upcoming=true&unscheduled=true` — celebracoes sem escala
- `GET /api/admin/stats` — estatisticas de cobertura e distribuicao

### Interacoes

- Dashboard operacional para coordenadoras
- "Ver" navega para detalhe da escala
- "Nova" navega para wizard de nova escala
- Cards de alerta destacam problemas que precisam atencao
- Desvio de servicos ajuda a identificar distribuicao desigual

---

## 18. /admin

**Acesso:** ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Administracao"                           |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Stat--+ +--Stat--+ +--Stat--+ +--Stat-----------+ |
|           | |Usuarios| |Acolitos| |Guardia.| |Coordena.        | |
|           | | 32     | | 24     | | 6      | | 2               | |
|           | +--------+ +--------+ +--------+ +-----------------+ |
|           |                                                       |
|           | +--Card "Usuarios por Papel"-------------------------+|
|           | |                                                    ||
|           | |  ACOLYTE     ████████████████████  24 (75%)        ||
|           | |  GUARDIAN    ██████                 6 (19%)         ||
|           | |  COORDINATOR ██                     2 (6%)          ||
|           | |  ADMIN       █                      1 (3%)          ||
|           | |                                                    ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Estatisticas do Sistema"--------------------+|
|           | | Funcoes ativas:      9                              ||
|           | | Celebracoes (mes):   12                             ||
|           | | Escalas publicadas:  8                              ||
|           | | Servicos registrados: 156                           ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Auditoria Recente"--------------------------+|
|           | | 03/abr 14:22  Maria   Publicou escala Abril Sem 1  ||
|           | | 03/abr 10:15  Admin   Alterou papel de Carlos      ||
|           | | 02/abr 18:30  Sistema Gerou escala Abril Sem 2     ||
|           | | 02/abr 16:00  Joao    Marcou indisponibilidade     ||
|           | |                                [Ver auditoria completa]|
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Links Rapidos------------------------------------+|
|           | | [Gerenciar Usuarios]  [Gerenciar Funcoes]          ||
|           | | [Ver Auditoria]                                    ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo)
- Stat cards (contagens por papel)
- Card (grafico de barras textual — distribuicao por papel)
- Card (estatisticas do sistema)
- Card/List (auditoria recente — ultimas entradas)
- Button links (atalhos para sub-paginas admin)

### Endpoints

- `GET /api/admin/stats` — estatisticas gerais
- `GET /api/admin/audit-log?limit=5` — ultimas entradas de auditoria

### Interacoes

- Dashboard administrativo com visao geral
- Links rapidos navegam para /admin/usuarios, /admin/funcoes, /admin/auditoria
- Cards informativos sem acoes diretas (exceto links)

---

## 19. /admin/usuarios

**Acesso:** ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Gerenciamento de Usuarios"               |
|           |   Breadcrumb: Administracao > Usuarios                |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Filtros-------------------------------------------+|
|           | | Busca: [nome/email...    ]  Papel: [Todos v]  [F]  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Table---------------------------------------------+|
|           | | Nome          | Email            |Papel    |Ativo|A||
|           | |---------------|------------------|---------|-----|--||
|           | | Joao Silva    | joao@email.com   |(ACOLYTE)| Sim |.|||
|           | | Ana Santos    | ana@email.com    |(ACOLYTE)| Sim |.|||
|           | | Sandra Oliv.  | sandra@email.com |(GUARD.) | Sim |.|||
|           | | Maria Costa   | maria@email.com  |(COORD.) | Sim |.|||
|           | | Admin         | admin@email.com  |(ADMIN)  | Sim |.|||
|           | | Carlos M.     | carlos@email.com |(GUARD.) | Nao |.|||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | Mostrando 1-6 de 32     [< 1 2 3 4 5 6 >]            |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+

Coluna "A" (Acoes) abre menu dropdown:
+------------------+
| Editar papel     |
| Desativar        |
| Reativar         |
+------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb)
- Input search (busca por nome ou email)
- Select (filtro por papel)
- Table (DataTable: nome, email, papel, status ativo, acoes)
- Badge (papel com cor: ACOLYTE=azul, GUARDIAN=verde, COORDINATOR=bordo, ADMIN=dourado)
- Badge (ativo: Sim=verde, Nao=cinza)
- DropdownMenu (acoes: editar papel, desativar/reativar)
- Dialog (confirmacao de alteracao de papel — Select com novo papel)
- Dialog (confirmacao de desativacao)
- Pagination

### Endpoints

- `GET /api/admin/users?search=&role=&page=&limit=`
- `PATCH /api/admin/users/:id/role` — mudar papel `{ role }`
- `PATCH /api/users/:id` — desativar/reativar `{ active: false }`

### Interacoes

- "Editar papel" abre Dialog com Select de papel — nao pode rebaixar o ultimo ADMIN
- "Desativar" abre Dialog de confirmacao — desativacao logica, nao exclui dados
- "Reativar" aparece apenas para usuarios inativos
- Protecao: nao pode desativar o proprio usuario ADMIN
- Protecao: nao pode rebaixar se for o ultimo ADMIN
- Toast de sucesso/erro apos cada acao

---

## 20. /admin/funcoes

**Acesso:** ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Gerenciamento de Funcoes"                |
|           |   Breadcrumb: Administracao > Funcoes                 |
|           |   [+ Nova Funcao]                                     |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Lista Ordenavel-----------------------------------+|
|           | |                                                    ||
|           | | [drag] 1. Turiferario                  [Ativa]  [.]||
|           | |        Responsavel pelo turibulo                   ||
|           | |                                                    ||
|           | | [drag] 2. Naveteiro                    [Ativa]  [.]||
|           | |        Auxilia com a naveta                        ||
|           | |                                                    ||
|           | | [drag] 3. Crucifero                    [Ativa]  [.]||
|           | |        Carrega a cruz processional                 ||
|           | |                                                    ||
|           | | [drag] 4. Ceroferario                  [Ativa]  [.]||
|           | |        Carrega cirios/casticais                    ||
|           | |                                                    ||
|           | | [drag] 5. Libreiro                     [Ativa]  [.]||
|           | |        Carrega o livro liturgico                   ||
|           | |                                                    ||
|           | | [drag] 6. Cerimoniario                 [Ativa]  [.]||
|           | |        Coordena acoes liturgicas                   ||
|           | |                                                    ||
|           | | [drag] 7. Coroinha                     [Ativa]  [.]||
|           | |        Auxilia no altar                            ||
|           | |                                                    ||
|           | | [drag] 8. Leitor                       [Ativa]  [.]||
|           | |        Proclama as leituras                        ||
|           | |                                                    ||
|           | | [drag] 9. Salmista                     [Inativa][.]||
|           | |        Canta o salmo responsorial                  ||
|           | |                                                    ||
|           | +---------------------------------------------------+|
|           |                                                       |
+--sidebar--+-------------------------------------------------------+

Menu [.] (tres pontos):
+------------------+
| Editar           |
| Desativar        |
+------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb + botao "Nova Funcao")
- Sortable list (drag and drop para reordenar)
- Card/item (nome da funcao + descricao + badge status)
- Badge (Ativa=verde, Inativa=cinza)
- DropdownMenu (editar, desativar/reativar)
- Dialog (criar/editar funcao: nome + descricao)
- Dialog (confirmacao de desativacao)
- Button ("Nova Funcao")

### Endpoints

- `GET /api/admin/functions` — lista completa (incluindo inativas)
- `POST /api/admin/functions` — criar `{ name, description }`
- `PATCH /api/admin/functions/:id` — editar `{ name, description, active, order }`

### Interacoes

- Drag and drop para reordenar funcoes (salva automaticamente nova ordem)
- "Nova Funcao" abre Dialog com campos nome e descricao
- "Editar" abre Dialog pre-preenchido
- "Desativar" marca funcao como inativa — nao aparece em novos formularios, mas dados historicos preservados
- Funcao inativa exibida com opacidade reduzida e badge "Inativa"
- Nao permite excluir funcao que esta em uso (apenas desativar)

---

## 21. /admin/auditoria

**Acesso:** ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Auditoria"                               |
|           |   Breadcrumb: Administracao > Auditoria               |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Filtros-------------------------------------------+|
|           | | Usuario: [Todos     v]  Acao: [Todas       v]     ||
|           | | Periodo: [01/03/2026] a [03/04/2026]          [F]  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Table---------------------------------------------+|
|           | | Data/Hora       | Usuario  | Acao        | Detalhe ||
|           | |-----------------|----------|-------------|---------|
|           | | 03/abr 14:22    | Maria C. | PUBLISH     | Escala  ||
|           | |                 |          | _SCHEDULE   | Abril S1||
|           | |-----------------|----------|-------------|---------|
|           | | 03/abr 10:15    | Admin    | CHANGE_ROLE | Carlos: ||
|           | |                 |          |             | GUARD→  ||
|           | |                 |          |             | ACOLYTE ||
|           | |-----------------|----------|-------------|---------|
|           | | 02/abr 18:30    | Sistema  | GENERATE    | Escala  ||
|           | |                 |          | _SCHEDULE   | Abril S2||
|           | |-----------------|----------|-------------|---------|
|           | | 02/abr 16:00    | Joao S.  | SET_UNAVAIL | 06/abr, ||
|           | |                 |          |             | 17/abr  ||
|           | |-----------------|----------|-------------|---------|
|           | | 01/abr 09:00    | Maria C. | CREATE      | Missa   ||
|           | |                 |          | _CELEBR.    | 22/abr  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | Mostrando 1-5 de 156     [< 1 2 3 ... 32 >]          |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb)
- Select (filtro por usuario)
- Select (filtro por tipo de acao)
- DatePicker (periodo inicio e fim)
- Button (filtrar)
- Table (DataTable: data/hora, usuario, acao, detalhes)
- Badge (tipo de acao com cor)
- Pagination
- Expand row (clicar na linha expande JSON com detalhes completos)

### Endpoints

- `GET /api/admin/audit-log?userId=&action=&startDate=&endDate=&page=&limit=`

### Interacoes

- Filtros combinaveis (usuario + acao + periodo)
- Clicar na linha expande detalhes completos (JSON formatado)
- Tipos de acao: PUBLISH_SCHEDULE, GENERATE_SCHEDULE, CHANGE_ROLE, SET_UNAVAILABILITY, CREATE_CELEBRATION, EDIT_ASSIGNMENT, etc.
- Ordenacao padrao: mais recente primeiro
- Sem acoes de edicao (auditoria e somente leitura)

---

## 22. /p/:token

**Acesso:** Publico (sem autenticacao)

### Wireframe

```
+---------------------------------------------------------------+
|                                                               |
| +--Header (centralizado)-----------------------------------+ |
| |     [Cruz/Logo]                                          | |
| |     Paroquia Sao Jose                                    | |
| |     "Escala Liturgica — Abril Semana 1"                   | |
| |     01/04/2026 a 07/04/2026                               | |
| +----------------------------------------------------------+ |
|                                                               |
| +--Grade Escala--------------------------------------------+ |
| |              | Turiferario | Naveteiro | Crucifero        | |
| |--------------|-------------|-----------|------------------| |
| | Domingo      |             |           |                  | |
| | 06/abr 10h   | Joao        | Ana       | Pedro            | |
| | Missa Domin. |             |           |                  | |
| |--------------|-------------|-----------|------------------| |
| | Quarta       |             |           |                  | |
| | 09/abr 19h   | Maria       | Lucas     | Julia            | |
| | Missa Seman. |             |           |                  | |
| |--------------|-------------|-----------|------------------| |
| | Sexta        |             |           |                  | |
| | 11/abr 18h   | Ana         | Pedro     | Joao             | |
| | Via Sacra    |             |           |                  | |
| +----------------------------------------------------------+ |
|                                                               |
| +--Rodape--------------------------------------------------+ |
| |  Gerado em 03/04/2026 | Liturgix                         | |
| +----------------------------------------------------------+ |
|                                                               |
+---------------------------------------------------------------+
```

### Componentes

- Header (logo, nome da paroquia, titulo da escala, periodo)
- Table/Grid (celebracoes x funcoes, somente primeiro nome dos acolitos)
- Footer (data de geracao, marca Liturgix)
- Sem sidebar, sem navegacao, sem botoes de acao

### Endpoints

- `GET /api/public/schedules/:token` — escala publica

### Interacoes

- Pagina totalmente estatica, somente leitura
- Layout limpo, otimizado para impressao (CSS @media print)
- Somente primeiro nome dos acolitos (privacidade)
- Sem autenticacao necessaria
- Token aleatorio no URL (nao adivinhavel)
- Se token invalido ou escala nao publicada: pagina 404 amigavel
- Responsivo: em telas pequenas, tabela rola horizontalmente

---

## 23. /celebracao/:id/editar

**Acesso:** COORDINATOR, ADMIN

### Wireframe

```
+--sidebar--+--content---------------------------------------------+
|           | PageHeader: "Editar Celebracao"                       |
|           |   Breadcrumb: Celebracoes > Missa Dominical > Editar  |
|           +-------------------------------------------------------+
|           |                                                       |
|           | +--Card Formulario-----------------------------------+|
|           | |  Nome                                              ||
|           | |  +----------------------------------------------+  ||
|           | |  | Missa Dominical                              |  ||
|           | |  +----------------------------------------------+  ||
|           | |                                                    ||
|           | |  Data                  Horario                     ||
|           | |  +----------------+    +----------------+          ||
|           | |  | 06/04/2026     |    | 10:00          |          ||
|           | |  +----------------+    +----------------+          ||
|           | |                                                    ||
|           | |  Tipo                                              ||
|           | |  +----------------------------------------------+  ||
|           | |  | Dominical                              [v]   |  ||
|           | |  +----------------------------------------------+  ||
|           | |                                                    ||
|           | |  Local                                             ||
|           | |  +----------------------------------------------+  ||
|           | |  | Igreja Matriz                                |  ||
|           | |  +----------------------------------------------+  ||
|           | |                                                    ||
|           | |  Notas                                             ||
|           | |  +----------------------------------------------+  ||
|           | |  | Domingo de Ramos                             |  ||
|           | |  +----------------------------------------------+  ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Card "Funcoes Necessarias"------------------------+|
|           | |  Funcao              Quantidade                    ||
|           | |  [Turiferario  v]    [1]   [x remover]            ||
|           | |  [Naveteiro    v]    [1]   [x remover]            ||
|           | |  [Crucifero    v]    [1]   [x remover]            ||
|           | |                                                    ||
|           | |  [+ Adicionar funcao]                              ||
|           | |                                                    ||
|           | |  Total: 3 vagas                                    ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           | +--Alerta (se celebracao ja esta em escalas)---------+|
|           | | [!] Esta celebracao esta vinculada a 1 escala.      ||
|           | |     Alteracoes nos requisitos podem afetar          ||
|           | |     atribuicoes existentes.                         ||
|           | +---------------------------------------------------+|
|           |                                                       |
|           |  [Cancelar]                  [=== Salvar ===]         |
|           |                                                       |
+--sidebar--+-------------------------------------------------------+
```

### Componentes

- PageHeader (titulo + breadcrumb)
- Card (formulario pre-preenchido — identico ao de criacao)
- Input (nome, pre-preenchido)
- DatePicker (data, pre-preenchido)
- Input time (horario, pre-preenchido)
- Select (tipo, pre-preenchido)
- Input (local, pre-preenchido)
- Textarea (notas, pre-preenchido)
- Card (funcoes necessarias — lista dinamica, pre-preenchida)
- Select (funcao liturgica)
- Input number (quantidade)
- Button ("Adicionar funcao", "Remover")
- Alert (aviso se celebracao ja vinculada a escalas)
- Button ("Cancelar" — secundario, "Salvar" — primario)
- Toast (sucesso/erro)

### Endpoints

- `GET /api/celebrations/:id` — dados atuais (para pre-preencher)
- `GET /api/admin/functions` — lista de funcoes ativas
- `PATCH /api/celebrations/:id` — atualizar dados
- `PUT /api/celebrations/:id/requirements` — atualizar funcoes necessarias

### Interacoes

- Formulario identico ao de criacao (/celebracao/nova), mas pre-preenchido
- Alerta se a celebracao ja esta vinculada a escalas existentes
- "Cancelar" navega de volta para /celebracao/:id
- "Salvar" atualiza celebracao e requisitos, redireciona para /celebracao/:id
- Validacao identica a criacao

---

## Resumo de Acesso por Tela

| # | Rota | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|---|------|---------|----------|-------------|-------|
| 1 | /login | Publico | Publico | Publico | Publico |
| 2 | /cadastro | Publico | Publico | Publico | Publico |
| 3 | /painel | Sim | Sim | Sim | Sim |
| 4 | /escalas | Sim (so PUBLISHED) | Sim (so PUBLISHED) | Sim | Sim |
| 5 | /escala/:id | Sim (so PUBLISHED, leitura) | Sim (so PUBLISHED, leitura) | Sim | Sim |
| 6 | /escala/nova | - | - | Sim | Sim |
| 7 | /celebracoes | - | - | Sim | Sim |
| 8 | /celebracao/:id | - | - | Sim | Sim |
| 9 | /celebracao/nova | - | - | Sim | Sim |
| 10 | /acolitos | - | - | Sim | Sim |
| 11 | /acolito/:id | - | - | Sim | Sim |
| 12 | /disponibilidade | Sim (propria) | Sim (vinculados) | - | - |
| 13 | /minhas-funcoes | Sim (leitura) | - | - | - |
| 14 | /meu-historico | Sim | Sim (vinculados) | - | - |
| 15 | /responsaveis | - | - | Sim | Sim |
| 16 | /responsaveis/:id | - | - | Sim | Sim |
| 17 | /coordenacao | - | - | Sim | Sim |
| 18 | /admin | - | - | - | Sim |
| 19 | /admin/usuarios | - | - | - | Sim |
| 20 | /admin/funcoes | - | - | - | Sim |
| 21 | /admin/auditoria | - | - | - | Sim |
| 22 | /p/:token | Publico | Publico | Publico | Publico |
| 23 | /celebracao/:id/editar | - | - | Sim | Sim |

---

## Fluxo entre Telas

```
/login ←→ /cadastro
  |
  v
/painel ──→ /escalas ──→ /escala/:id ──→ (publicar, editar, re-gerar)
  |            |              |
  |            |              └──→ /escala/nova (wizard 3 passos)
  |            |
  |          /celebracoes ──→ /celebracao/:id ──→ /celebracao/:id/editar
  |            |                                      |
  |            └──→ /celebracao/nova ←────────────────┘
  |
  |──→ /acolitos ──→ /acolito/:id
  |
  |──→ /disponibilidade (ACOLYTE/GUARDIAN)
  |
  |──→ /minhas-funcoes (ACOLYTE, leitura)
  |
  |──→ /meu-historico (ACOLYTE/GUARDIAN)
  |
  |──→ /responsaveis ──→ /responsaveis/:id ──→ /acolito/:id
  |
  |──→ /coordenacao ──→ /escala/:id
  |                  ──→ /escala/nova
  |
  |──→ /admin ──→ /admin/usuarios
  |           ──→ /admin/funcoes
  |           ──→ /admin/auditoria
  |
  └──→ (logout) ──→ /login

/p/:token (acesso direto, sem navegacao interna)
```

---

## Componentes Compartilhados do Design System

Componentes reutilizados em multiplas telas:

| Componente | Telas onde aparece |
|---|---|
| **PageHeader** | Todas as telas autenticadas (3-21, 23) |
| **Sidebar** | Todas as telas autenticadas (3-21, 23) |
| **Card** | 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 23 |
| **Table/DataTable** | 4, 5, 7, 10, 14, 15, 19, 21 |
| **Badge** | 4, 5, 7, 8, 10, 11, 14, 19, 20, 21 |
| **Button** | Todas |
| **Input** | 1, 2, 6, 9, 10, 15, 19, 23 |
| **Select** | 2, 4, 7, 9, 19, 20, 21, 23 |
| **DatePicker** | 4, 6, 7, 9, 14, 21, 23 |
| **Calendar grid** | 11, 12 |
| **Dialog** | 5, 8, 16, 19, 20 |
| **Toast** | 1, 2, 5, 6, 9, 11, 12, 16, 19, 20, 23 |
| **Pagination** | 4, 7, 10, 14, 15, 19, 21 |
| **DropdownMenu** | 19, 20 |
| **Checkbox** | 6, 11, 13 |
| **RadioGroup** | 2 |
| **Stat cards** | 3, 17, 18 |
| **Loading/Spinner** | 6 |
| **Alert** | 23 |
