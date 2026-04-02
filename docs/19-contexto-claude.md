# 19 - Padrao de Documentacao Continua

## Objetivo

Este documento define o padrao de manutencao do `CLAUDE.md` e dos documentos em `docs/`, garantindo que o Claude (assistente de IA) tenha contexto completo e atualizado a cada nova conversa. O `CLAUDE.md` funciona como ponto de entrada unico: ele resume o estado atual do projeto e aponta para documentos detalhados em `docs/`.

---

## Estrutura Obrigatoria do CLAUDE.md

O `CLAUDE.md` deve sempre conter as 10 secoes abaixo, nesta ordem:

### 1. Visao geral do projeto (1 paragrafo)

Descricao concisa do Liturgix: o que e, para quem, qual problema resolve. Atualizar quando o escopo mudar significativamente.

> Exemplo: "Liturgix e um sistema de geracao automatica de escalas para acolitos e funcoes liturgicas em igrejas. Permite que acolitos informem disponibilidade, coordenadoras gerem escalas justas e auditaveis, e que escalas sejam consultadas publicamente."

### 2. Tabela de arquitetura (servico | stack | porta | status)

Tabela com todos os servicos Docker e seu estado atual:

```markdown
| Servico  | Stack                          | Porta | Status       |
|----------|--------------------------------|-------|--------------|
| **app**  | Fastify 5 (TS) + React 19      | 3000  | scaffold     |
| **db**   | PostgreSQL 16 Alpine           | 5432  | operacional  |
| **redis**| Redis 7 Alpine                 | 6379  | operacional  |
| **worker**| Celery (Python 3.12)          | --    | scaffold     |
```

A coluna **Status** deve refletir: `scaffold`, `em desenvolvimento`, `operacional`, `desabilitado`.

### 3. Estrutura do projeto (tree)

Arvore de diretorios atualizada. Sempre que um arquivo ou pasta for adicionado, atualizar a tree. Usar comentarios inline para descrever arquivos nao obvios.

### 4. Endpoints da API (agrupados por dominio, com papeis)

Listar todos os endpoints implementados, agrupados por dominio (auth, users, servers, guardians, celebrations, schedules, public, admin). Cada endpoint deve indicar:

- Metodo e caminho
- Descricao breve
- Papel minimo necessario (ACOLYTE, GUARDIAN, COORDINATOR, ADMIN, publico)

Endpoints nao implementados devem ser removidos ou marcados com `[pendente]`.

### 5. Resumo do schema do banco (entidades e relacionamentos-chave)

Lista das entidades Prisma com campos-chave e relacionamentos principais. Nao precisa ser o schema completo -- para isso, referenciar `docs/07-modelagem-dados.md`. Incluir a versao da migracao atual.

> Exemplo:
> - **User** (id, name, email, role, active) -- tem muitas UserFunction, Unavailability
> - **Schedule** (id, status, startDate, endDate) -- tem muitas ScheduleAssignment
> - Migracao atual: `20260401_initial`

### 6. Comandos

Todos os comandos necessarios para operar o projeto:

```bash
# Subir tudo
docker compose up --build

# Testes
npm test --prefix backend

# Migracoes Prisma
npx prisma migrate dev --name descricao

# Seed
npx prisma db seed

# Ver logs
docker compose logs -f [app|db|redis|worker]

# Parar
docker compose down
```

Atualizar conforme novos comandos forem adicionados (lint, format, build, etc.).

### 7. Variaveis de ambiente

Lista completa de variaveis com valores default ou descricao. Referenciar `.env.example` quando existir.

### 8. Status de implementacao (half-loops completos)

Indicar quais half-loops (conforme `docs/13-plano-implementacao.md`) estao completos, em andamento ou pendentes:

```markdown
| Half-loop | Descricao                        | Status     |
|-----------|----------------------------------|------------|
| HL-01     | Prisma + schema + migracao       | pendente   |
| HL-02     | Autenticacao JWT                 | pendente   |
| HL-03     | Layout base + tema               | pendente   |
| ...       | ...                              | ...        |
```

### 9. Problemas conhecidos / TODOs

Lista de issues conhecidos, dividas tecnicas, ou itens pendentes que afetam o desenvolvimento. Remover itens conforme forem resolvidos.

### 10. Notas tecnicas (gotchas, workarounds)

Informacoes que o Claude precisa saber para nao cometer erros:

- Importacoes especificas (ex.: `{ Redis }` named import do ioredis)
- Limitacoes do Dockerfile (ex.: `npm install` em vez de `npm ci`)
- Comportamentos inesperados (ex.: Celery roda como root)
- Convencoes de nomenclatura (camelCase no Prisma, snake_case no PostgreSQL)

---

## Quando Atualizar o CLAUDE.md

O `CLAUDE.md` deve ser atualizado **ao final de cada half-loop** e sempre que houver mudanca estrutural. A regra geral:

| Evento                          | Atualizar no CLAUDE.md               |
|---------------------------------|--------------------------------------|
| Half-loop concluido             | Secoes 4, 5, 8 (endpoints, schema, status) |
| Novo arquivo/pasta criado       | Secao 3 (tree)                       |
| Novo endpoint implementado      | Secao 4 (endpoints)                  |
| Migracao de banco executada     | Secao 5 (schema)                     |
| Nova dependencia instalada      | Secao 10 (notas tecnicas)            |
| Nova variavel de ambiente       | Secao 7 (variaveis)                  |
| Novo comando adicionado         | Secao 6 (comandos)                   |
| Bug conhecido identificado      | Secao 9 (problemas)                  |
| Servico Docker alterado         | Secao 2 (arquitetura)                |
| Desvio do plano original        | Secao 10 (notas tecnicas)            |

---

## Quando Atualizar Documentos em docs/

Alem do `CLAUDE.md`, os documentos em `docs/` devem ser atualizados quando sua area de responsabilidade for afetada:

| Evento                          | Documento a atualizar                |
|---------------------------------|--------------------------------------|
| Alteracao no schema do banco    | `07-modelagem-dados.md`              |
| Novo endpoint criado            | `09-especificacao-api.md`            |
| Nova tela implementada          | `12-mapa-telas.md`                   |
| Mudanca no algoritmo de escala  | `08-algoritmo-escala.md`             |
| Nova regra de negocio           | `04-regras-negocio.md`               |
| Mudanca de permissoes           | `03-perfis-permissoes.md`            |
| Novo componente de UI           | `11-design-system.md`                |
| Nova rota frontend              | `10-convencao-rotas.md`              |
| Mudanca na estrutura de pastas  | `18-estrutura-pastas.md`             |
| Novo risco ou decisao tecnica   | `16-riscos-decisoes.md`              |
| Half-loop concluido             | `CLAUDE.md` (sempre)                 |

---

## Mapa de Dependencias entre Documentos

Os documentos em `docs/` possuem dependencias cruzadas. Ao alterar um documento, verificar se os que dependem dele precisam de atualizacao.

```
07-modelagem-dados
  |-- referenciado por --> 08-algoritmo-escala
  |-- referenciado por --> 09-especificacao-api
  |-- referenciado por --> 13-plano-implementacao

03-perfis-permissoes
  |-- referenciado por --> 09-especificacao-api
  |-- referenciado por --> 10-convencao-rotas
  |-- referenciado por --> 12-mapa-telas

04-regras-negocio
  |-- referenciado por --> 08-algoritmo-escala
  |-- referenciado por --> 09-especificacao-api
  |-- referenciado por --> 15-criterios-aceite

11-design-system
  |-- referenciado por --> 12-mapa-telas

08-algoritmo-escala
  |-- referenciado por --> 15-criterios-aceite
  |-- referenciado por --> 17-fallback-manual
```

### Diagrama resumido de dependencias

```
                    +---------+
                    |   07    |
                    | dados   |
                    +----+----+
                         |
            +------------+------------+
            |            |            |
       +----v----+  +----v----+  +----v----+
       |   08    |  |   09    |  |   13    |
       | algo    |  |   API   |  | impl    |
       +----+----+  +----+----+  +---------+
            |            |
     +------+------+     |
     |             |     |
+----v----+  +-----v-----v----+
|   15    |  |       03       |
| aceite  |  |   permissoes   |
+---------+  +----+------+----+
                  |      |
             +----v-+ +--v-------+
             |  10  | |    12    |
             |rotas | |  telas   |
             +------+ +----+-----+
                            |
                       +----v----+
                       |   11    |
                       | design  |
                       +---------+

04-regras-negocio ---> 08, 09, 15
08-algoritmo     ---> 17-fallback
```

---

## Convencoes de Terminologia

Para manter consistencia entre documentos e no codigo, usar sempre os termos padronizados:

| Termo padrao       | Nao usar                              | Contexto                    |
|--------------------|---------------------------------------|-----------------------------|
| acolito            | coroinha, servidor, ministro          | Usuario que serve na liturgia |
| celebracao         | missa, evento, cerimonia              | Evento liturgico agendado   |
| escala             | agenda, programacao, tabela           | Conjunto de atribuicoes     |
| funcao (liturgica) | ministerio, servico, cargo            | Papel exercido na celebracao |
| coordenadora       | administradora, responsavel de escala | Quem gera e publica escalas |
| responsavel        | tutor, guardiao, pai/mae              | Adulto vinculado ao acolito menor |
| indisponibilidade  | folga, ausencia, impedimento          | Data em que o acolito nao pode servir |
| atribuicao         | alocacao, designacao                  | Vinculo acolito-funcao-celebracao na escala |
| conflito           | erro, problema, excecao               | Vaga nao preenchida pelo algoritmo |
| half-loop          | sprint, iteracao, ciclo               | Unidade de trabalho de desenvolvimento |
| publicar           | liberar, ativar, compartilhar         | Transicao DRAFT -> PUBLISHED |

---

## Convencoes para Contexto do Claude

### CLAUDE.md como ponto de entrada

O `CLAUDE.md` deve funcionar como indice. Para detalhes, referenciar documentos especificos:

```markdown
<!-- Exemplo de referencia no CLAUDE.md -->
Schema completo: ver `docs/07-modelagem-dados.md`
Algoritmo de escala: ver `docs/08-algoritmo-escala.md`
Endpoints detalhados: ver `docs/09-especificacao-api.md`
```

### Concisao com completude

O `CLAUDE.md` deve ser conciso o suficiente para o Claude processar rapidamente, mas completo o suficiente para que ele nao precise adivinhar:

- Listar **todos** os endpoints implementados (nao apenas os novos)
- Listar **todas** as entidades do banco (nao apenas as recentes)
- Manter a tree **completa** (nao parcial)
- Indicar o status **real** de cada half-loop

### Desvios do plano original

Quando uma decisao de implementacao divergir do que esta documentado em `docs/`, registrar no `CLAUDE.md` secao 10 (Notas tecnicas):

```markdown
## Notas Tecnicas

- **Desvio do plano**: 08-algoritmo-escala especifica peso 0.50 para contagem,
  mas implementacao usa 0.45 apos testes mostrarem melhor distribuicao.
  Ver commit abc1234.
```

### Papeis no sistema

Ao mencionar endpoints ou permissoes, sempre usar os nomes dos papeis conforme definidos no enum:

- `ACOLYTE` -- acolito
- `GUARDIAN` -- responsavel
- `COORDINATOR` -- coordenadora
- `ADMIN` -- administrador

---

## Checklist de Atualizacao pos-Half-Loop

Ao concluir cada half-loop, verificar todos os itens:

- [ ] `CLAUDE.md` secao 3 (tree) reflete novos arquivos
- [ ] `CLAUDE.md` secao 4 (endpoints) lista todos os endpoints implementados
- [ ] `CLAUDE.md` secao 5 (schema) reflete o estado atual do banco
- [ ] `CLAUDE.md` secao 6 (comandos) inclui novos comandos se houver
- [ ] `CLAUDE.md` secao 7 (variaveis) inclui novas variaveis se houver
- [ ] `CLAUDE.md` secao 8 (status) marca o half-loop como completo
- [ ] `CLAUDE.md` secao 9 (problemas) atualizada com novos issues ou removendo resolvidos
- [ ] `CLAUDE.md` secao 10 (notas) registra gotchas descobertos
- [ ] Documentos em `docs/` afetados foram atualizados conforme tabela de eventos
- [ ] Nenhuma inconsistencia cruzada entre `CLAUDE.md` e `docs/`

---

## Exemplo de Fluxo de Atualizacao

Cenario: half-loop HL-04 (CRUD de funcoes liturgicas) foi concluido.

1. **Tree** -- adicionar `backend/src/routes/admin.routes.ts`, `backend/src/services/function.service.ts`, `frontend/src/pages/admin-funcoes.tsx`
2. **Endpoints** -- adicionar `GET /api/admin/functions`, `POST /api/admin/functions`, `PATCH /api/admin/functions/:id`
3. **Schema** -- atualizar se houve migracao (ex.: campo novo em `LiturgicalFunction`)
4. **Status** -- marcar HL-04 como `completo`
5. **Notas tecnicas** -- registrar se houve algum workaround
6. **docs/09-especificacao-api.md** -- atualizar secao de endpoints de administracao com detalhes de request/response
7. **docs/07-modelagem-dados.md** -- atualizar se houve alteracao no schema

---

## Documentos de Referencia

| Documento | Conteudo | Quando consultar |
|-----------|----------|------------------|
| `docs/00-plano-mestre.md` | Visao geral do planejamento e lista de todos os documentos | Inicio de projeto, duvidas sobre escopo |
| `docs/01-visao-geral.md` | Proposito, publico-alvo, premissas | Contexto de negocio |
| `docs/03-perfis-permissoes.md` | Matriz RBAC completa | Implementar autorizacao |
| `docs/04-regras-negocio.md` | Regras rigidas e flexiveis | Implementar validacoes |
| `docs/07-modelagem-dados.md` | Schema Prisma completo | Migracoes, queries |
| `docs/08-algoritmo-escala.md` | Formula de pontuacao, desempate, conflitos | Implementar gerador |
| `docs/09-especificacao-api.md` | Endpoints detalhados com payloads | Implementar rotas |
| `docs/10-convencao-rotas.md` | Mapeamento frontend-backend | Implementar navegacao |
| `docs/11-design-system.md` | Cores, tipografia, componentes | Implementar UI |
| `docs/12-mapa-telas.md` | Wireframes textuais, 23 telas | Implementar paginas |
| `docs/13-plano-implementacao.md` | 19 half-loops em 6 fases | Planejar proximo trabalho |
| `docs/17-fallback-manual.md` | Resolucao de conflitos | Implementar UI de conflitos |
| `docs/18-estrutura-pastas.md` | Organizacao de arquivos | Criar novos arquivos |
| `docs/20-plano-half-loops.md` | Definicao e regras de half-loop | Processo de desenvolvimento |
