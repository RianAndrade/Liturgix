# Escopo Funcional — Liturgix v1.0

## 1. Visao Geral dos Modulos

O Liturgix v1.0 esta organizado em 7 modulos funcionais:

| Modulo | Descricao | Publico Principal |
|--------|-----------|-------------------|
| **Auth** | Cadastro, autenticacao e gestao de sessao | Todos |
| **Acolitos** | Perfil, disponibilidade, funcoes e historico | ACOLYTE, COORDINATOR |
| **Celebracoes** | Cadastro e configuracao de celebracoes liturgicas | COORDINATOR, ADMIN |
| **Escalas** | Geracao automatica, atribuicoes manuais, publicacao | COORDINATOR, ADMIN |
| **Responsaveis** | Vinculo responsavel-acolito e visualizacao | GUARDIAN, COORDINATOR |
| **Admin** | Gestao de usuarios, funcoes, auditoria e estatisticas | ADMIN |
| **Publico** | Consulta de escalas publicadas via token | Qualquer pessoa |

---

## 2. Papeis do Sistema (RBAC)

| Papel | Codigo | Descricao |
|-------|--------|-----------|
| Acolito | `ACOLYTE` | Informa disponibilidade, consulta sua escala e historico |
| Responsavel | `GUARDIAN` | Vinculado a um ou mais acolitos, visualiza escalas dos vinculados |
| Coordenador(a) | `COORDINATOR` | Gera escalas, gerencia celebracoes, atribui funcoes, resolve conflitos |
| Administrador(a) | `ADMIN` | Acesso total: gestao de usuarios, papeis, funcoes liturgicas, auditoria |

---

## 3. Features por Modulo

### 3.1 Auth

| ID | Feature | Descricao | Endpoint |
|----|---------|-----------|----------|
| AUTH-01 | Cadastro | Registro de novo usuario (apenas ACOLYTE ou GUARDIAN) | `POST /api/auth/register` |
| AUTH-02 | Login | Autenticacao por email+senha, retorna JWT | `POST /api/auth/login` |
| AUTH-03 | Logout | Invalidacao do token via lista negra no Redis | `POST /api/auth/logout` |
| AUTH-04 | Perfil | Consulta dos dados do usuario autenticado | `GET /api/auth/me` |

**Criterios de Aceite:**

- **AUTH-01 — Cadastro**
  - [ ] Usuario pode se registrar informando nome, email, senha e papel (ACOLYTE ou GUARDIAN)
  - [ ] Email deve ser unico; retornar erro 409 se ja existir
  - [ ] Senha deve ter no minimo 8 caracteres
  - [ ] Senha eh armazenada com hash bcrypt (nunca em texto plano)
  - [ ] Papeis COORDINATOR e ADMIN nao podem ser auto-atribuidos no cadastro
  - [ ] Retorna o usuario criado (sem senha) e um JWT valido

- **AUTH-02 — Login**
  - [ ] Usuario envia email e senha
  - [ ] Se credenciais validas, retorna JWT com `userId`, `role` e `exp`
  - [ ] Se credenciais invalidas, retorna erro 401 com mensagem generica (sem revelar se email existe)
  - [ ] Token JWT tem expiracao configuravel (padrao: 24h)

- **AUTH-03 — Logout**
  - [ ] Token eh adicionado a uma lista negra no Redis com TTL igual ao tempo restante de expiracao
  - [ ] Requisicoes subsequentes com o token invalidado retornam 401
  - [ ] Funciona mesmo com token ainda dentro da validade

- **AUTH-04 — Perfil**
  - [ ] Retorna dados do usuario autenticado (id, nome, email, papel, dataCriacao)
  - [ ] Nao retorna a senha
  - [ ] Retorna 401 se token invalido ou na lista negra

---

### 3.2 Acolitos

| ID | Feature | Descricao | Endpoint |
|----|---------|-----------|----------|
| ACO-01 | Listar acolitos | Lista de acolitos com filtros | `GET /api/servers` |
| ACO-02 | Detalhe do acolito | Dados completos de um acolito | `GET /api/servers/:id` |
| ACO-03 | Gerenciar disponibilidade | Calendario de datas disponiveis/indisponiveis | `GET/PUT /api/servers/:id/availability` |
| ACO-04 | Gerenciar funcoes habilitadas | Funcoes liturgicas que o acolito pode exercer | `GET/PUT /api/servers/:id/functions` |
| ACO-05 | Historico de servicos | Registro de participacoes passadas | `GET /api/servers/:id/history` |

**Criterios de Aceite:**

- **ACO-01 — Listar acolitos**
  - [ ] COORDINATOR+ ve todos os acolitos ativos
  - [ ] ACOLYTE ve apenas seu proprio perfil na lista
  - [ ] GUARDIAN ve apenas seus acolitos vinculados
  - [ ] Suporta paginacao e filtro por nome
  - [ ] Retorna: id, nome, email, funcoes habilitadas, status

- **ACO-02 — Detalhe do acolito**
  - [ ] Retorna dados completos: perfil, funcoes habilitadas, indisponibilidades do periodo, contagem de servicos
  - [ ] ACOLYTE so acessa seu proprio detalhe
  - [ ] GUARDIAN so acessa acolitos vinculados
  - [ ] COORDINATOR+ acessa qualquer acolito

- **ACO-03 — Gerenciar disponibilidade**
  - [ ] Acolito marca datas em que NAO esta disponivel (calendario visual)
  - [ ] Disponibilidade eh definida por periodo (ex: mes seguinte)
  - [ ] `PUT` substitui todas as indisponibilidades do periodo informado
  - [ ] ACOLYTE gerencia apenas sua propria disponibilidade
  - [ ] COORDINATOR+ pode gerenciar disponibilidade de qualquer acolito
  - [ ] Datas passadas nao podem ser alteradas

- **ACO-04 — Gerenciar funcoes habilitadas**
  - [ ] Apenas COORDINATOR+ pode atribuir/remover funcoes de um acolito
  - [ ] Funcao deve existir e estar ativa no sistema
  - [ ] Acolito pode ter multiplas funcoes habilitadas
  - [ ] Remover funcao nao afeta atribuicoes ja travadas em escalas existentes
  - [ ] ACOLYTE pode visualizar (GET) suas funcoes, mas nao alterar

- **ACO-05 — Historico de servicos**
  - [ ] Lista celebracoes em que o acolito serviu, com data, tipo de celebracao e funcao exercida
  - [ ] Suporta filtro por periodo
  - [ ] Ordenado por data decrescente
  - [ ] ACOLYTE ve apenas seu proprio historico
  - [ ] COORDINATOR+ ve historico de qualquer acolito

---

### 3.3 Celebracoes

| ID | Feature | Descricao | Endpoint |
|----|---------|-----------|----------|
| CEL-01 | Listar celebracoes | Lista com filtros por tipo e periodo | `GET /api/celebrations` |
| CEL-02 | Criar celebracao | Nova celebracao com tipo, data, horario, local | `POST /api/celebrations` |
| CEL-03 | Detalhe da celebracao | Dados completos incluindo funcoes necessarias | `GET /api/celebrations/:id` |
| CEL-04 | Editar celebracao | Alterar dados de uma celebracao | `PATCH /api/celebrations/:id` |
| CEL-05 | Excluir celebracao | Exclusao logica | `DELETE /api/celebrations/:id` |
| CEL-06 | Definir requisitos de funcoes | Funcoes e quantidades necessarias por celebracao | `PUT /api/celebrations/:id/requirements` |

**Tipos de celebracao:**

| Tipo | Codigo | Descricao |
|------|--------|-----------|
| Missa Dominical | `SUNDAY_MASS` | Missas regulares de domingo |
| Missa de Dia de Semana | `WEEKDAY_MASS` | Missas de segunda a sabado |
| Dia Santo | `HOLY_DAY` | Celebracoes de dias santos de obrigacao |
| Especial | `SPECIAL` | Festas, solenidades, celebracoes extraordinarias |

**Criterios de Aceite:**

- **CEL-01 — Listar celebracoes**
  - [ ] COORDINATOR+ ve todas as celebracoes
  - [ ] Suporta filtros por tipo (`CelebrationType`) e periodo (dataInicio, dataFim)
  - [ ] Suporta paginacao
  - [ ] Retorna: id, nome, tipo, data, horario, local, quantidade de funcoes necessarias

- **CEL-02 — Criar celebracao**
  - [ ] Apenas COORDINATOR+ pode criar
  - [ ] Campos obrigatorios: nome, tipo, data, horario
  - [ ] Campo opcional: local, descricao
  - [ ] Tipo deve ser um dos valores do enum `CelebrationType`
  - [ ] Nao permite data no passado

- **CEL-03 — Detalhe da celebracao**
  - [ ] Retorna todos os dados da celebracao incluindo requisitos de funcoes
  - [ ] Requisitos listam funcao liturgica e quantidade necessaria

- **CEL-04 — Editar celebracao**
  - [ ] Apenas COORDINATOR+ pode editar
  - [ ] Celebracao vinculada a escala PUBLISHED nao pode ser editada (retorna 409)
  - [ ] Permite edicao parcial (PATCH)

- **CEL-05 — Excluir celebracao**
  - [ ] Exclusao logica (soft delete)
  - [ ] Celebracao vinculada a escala PUBLISHED nao pode ser excluida (retorna 409)
  - [ ] Apenas COORDINATOR+ pode excluir

- **CEL-06 — Definir requisitos de funcoes**
  - [ ] Substitui todos os requisitos da celebracao
  - [ ] Cada requisito: funcao liturgica + quantidade (ex: "Turiferario: 1, Ceroferario: 2")
  - [ ] Funcao deve existir e estar ativa
  - [ ] Quantidade minima: 1 por funcao listada
  - [ ] Apenas COORDINATOR+ pode definir

---

### 3.4 Escalas

| ID | Feature | Descricao | Endpoint |
|----|---------|-----------|----------|
| ESC-01 | Listar escalas | Lista de escalas com filtros | `GET /api/schedules` |
| ESC-02 | Gerar escala automaticamente | Algoritmo guloso com pontuacao | `POST /api/schedules/generate` |
| ESC-03 | Detalhe da escala | Escala completa com atribuicoes | `GET /api/schedules/:id` |
| ESC-04 | Editar metadados/status | Alterar dados e transicionar status | `PATCH /api/schedules/:id` |
| ESC-05 | Publicar escala | Transicao DRAFT -> PUBLISHED com token compartilhavel | `POST /api/schedules/:id/publish` |
| ESC-06 | Atribuicao manual | Adicionar acolito a uma vaga manualmente | `POST /api/schedules/:id/assignments` |
| ESC-07 | Editar/trocar atribuicao | Alterar ou trocar acolito em uma vaga | `PATCH /api/schedules/:id/assignments/:assignmentId` |
| ESC-08 | Remover atribuicao | Remover acolito de uma vaga | `DELETE /api/schedules/:id/assignments/:assignmentId` |
| ESC-09 | Trilha de auditoria | Log de decisoes do algoritmo e acoes manuais | `GET /api/schedules/:id/audit` |

**Fluxo de status:**

```
DRAFT  ──publicar──>  PUBLISHED  ──arquivar──>  ARCHIVED
  ^                                                 
  └── re-gerar (cria nova escala DRAFT)             
```

**5 tipos de conflito detectados:**

| Codigo | Tipo | Descricao | Acao Sugerida |
|--------|------|-----------|---------------|
| C1 | `NO_CANDIDATES` | Nenhum acolito habilitado para a funcao | Habilitar acolitos para a funcao |
| C2 | `INSUFFICIENT_CANDIDATES` | Menos candidatos disponiveis do que vagas | Revisar disponibilidades ou reduzir vagas |
| C3 | `OVERLOAD_SINGLE_CANDIDATE` | Um unico candidato para multiplas vagas na mesma celebracao | Atribuir manualmente ou habilitar mais acolitos |
| C4 | `ALL_UNAVAILABLE` | Todos os habilitados estao indisponiveis na data | Negociar disponibilidade com acolitos |
| C5 | `QUALIFICATION_GAP` | Funcao exigida mas nenhum acolito qualificado no sistema | Criar programa de formacao para a funcao |

**Criterios de Aceite:**

- **ESC-01 — Listar escalas**
  - [ ] COORDINATOR+ ve todas as escalas (DRAFT, PUBLISHED, ARCHIVED)
  - [ ] ACOLYTE e GUARDIAN veem apenas escalas com status PUBLISHED
  - [ ] Suporta filtro por status e periodo
  - [ ] Suporta paginacao

- **ESC-02 — Gerar escala automaticamente**
  - [ ] Apenas COORDINATOR+ pode gerar
  - [ ] Recebe periodo (dataInicio, dataFim) e celebracoes incluidas
  - [ ] Algoritmo guloso processa celebracoes em ordem cronologica
  - [ ] Vagas mais restritas (menos candidatos) sao preenchidas primeiro
  - [ ] Formula de pontuacao: `(0.50 * pontuacaoContagem) + (0.30 * pontuacaoRotacao) + (0.20 * pontuacaoIntervalo)`
  - [ ] Desempate: menos servicos totais -> mais dias desde ultimo servico -> ordem alfabetica
  - [ ] Acolitos novos (sem historico) recebem pontuacao 100 em todos os criterios
  - [ ] Respeita indisponibilidades: acolito indisponivel nunca eh atribuido
  - [ ] Respeita qualificacoes: acolito so eh atribuido a funcao que possui
  - [ ] Sem duplicata: acolito nao eh atribuido mais de uma vez na mesma celebracao
  - [ ] Conflitos sao detectados e registrados com tipo e descricao legivel
  - [ ] Vagas nao resolvidas ficam com `userId: null`
  - [ ] Escala criada com status DRAFT
  - [ ] Atribuicoes travadas de geracao anterior sao preservadas durante re-geracao
  - [ ] Trilha de auditoria registra cada candidato avaliado para cada vaga (selecionado ou rejeitado com razao)
  - [ ] Geracao pode ser assincrona via Celery para periodos grandes

- **ESC-03 — Detalhe da escala**
  - [ ] Retorna metadados da escala (periodo, status, data de criacao)
  - [ ] Retorna lista de atribuicoes agrupadas por celebracao
  - [ ] Cada atribuicao mostra: funcao, acolito (ou vazio), pontuacao, status de travamento
  - [ ] Retorna lista de conflitos pendentes

- **ESC-04 — Editar metadados/status**
  - [ ] Apenas COORDINATOR+ pode editar
  - [ ] Escala ARCHIVED nao pode ser editada
  - [ ] Transicoes validas: DRAFT->PUBLISHED (via ESC-05), PUBLISHED->ARCHIVED

- **ESC-05 — Publicar escala**
  - [ ] Apenas COORDINATOR+ pode publicar
  - [ ] Gera token unico (nanoid) para acesso publico
  - [ ] Escala com vagas nao preenchidas (userId null) exibe alerta mas permite publicacao
  - [ ] Status muda de DRAFT para PUBLISHED
  - [ ] Escala ja publicada nao pode ser publicada novamente (retorna 409)

- **ESC-06 — Atribuicao manual**
  - [ ] Apenas COORDINATOR+ pode atribuir manualmente
  - [ ] Apenas em escalas com status DRAFT
  - [ ] Valida que o acolito esta habilitado para a funcao
  - [ ] Valida que o acolito esta disponivel na data
  - [ ] Valida que o acolito nao esta ja atribuido na mesma celebracao
  - [ ] Atribuicao manual eh automaticamente marcada como travada

- **ESC-07 — Editar/trocar atribuicao**
  - [ ] Apenas COORDINATOR+ pode editar
  - [ ] Apenas em escalas com status DRAFT
  - [ ] Permite trocar o acolito de uma atribuicao (mesmas validacoes de ESC-06)
  - [ ] Permite travar/destravar uma atribuicao

- **ESC-08 — Remover atribuicao**
  - [ ] Apenas COORDINATOR+ pode remover
  - [ ] Apenas em escalas com status DRAFT
  - [ ] Atribuicao travada nao pode ser removida (requer destravamento antes)

- **ESC-09 — Trilha de auditoria**
  - [ ] Apenas COORDINATOR+ pode acessar
  - [ ] Registra decisoes do algoritmo: para cada vaga, lista candidatos avaliados com pontuacao e motivo de selecao/rejeicao
  - [ ] Registra acoes manuais: quem fez, o que fez, quando fez

---

### 3.5 Responsaveis (Guardians)

| ID | Feature | Descricao | Endpoint |
|----|---------|-----------|----------|
| GUA-01 | Listar responsaveis | Lista de responsaveis cadastrados | `GET /api/guardians` |
| GUA-02 | Acolitos vinculados | Lista de acolitos vinculados ao responsavel | `GET /api/guardians/:id/acolytes` |
| GUA-03 | Vincular acolito | Criar vinculo responsavel-acolito | `POST /api/guardians/:id/link` |

**Criterios de Aceite:**

- **GUA-01 — Listar responsaveis**
  - [ ] Apenas COORDINATOR+ pode listar todos os responsaveis
  - [ ] Retorna: id, nome, email, quantidade de acolitos vinculados

- **GUA-02 — Acolitos vinculados**
  - [ ] GUARDIAN ve seus proprios acolitos vinculados
  - [ ] COORDINATOR+ ve acolitos de qualquer responsavel
  - [ ] Retorna dados basicos dos acolitos: id, nome, funcoes, proxima escala

- **GUA-03 — Vincular acolito**
  - [ ] Apenas COORDINATOR+ pode criar vinculos
  - [ ] Acolito deve ter papel ACOLYTE
  - [ ] Responsavel deve ter papel GUARDIAN
  - [ ] Um acolito pode ter mais de um responsavel
  - [ ] Um responsavel pode ter mais de um acolito vinculado
  - [ ] Vinculo duplicado retorna erro 409

---

### 3.6 Admin

| ID | Feature | Descricao | Endpoint |
|----|---------|-----------|----------|
| ADM-01 | Gestao de usuarios | Lista completa de usuarios com filtros | `GET /api/admin/users` |
| ADM-02 | Alterar papel | Promover/rebaixar papel de usuario | `PATCH /api/admin/users/:id/role` |
| ADM-03 | Listar funcoes liturgicas | Todas as funcoes incluindo inativas | `GET /api/admin/functions` |
| ADM-04 | Criar funcao liturgica | Nova funcao com nome e descricao | `POST /api/admin/functions` |
| ADM-05 | Editar funcao liturgica | Alterar nome, descricao ou status (ativar/desativar) | `PATCH /api/admin/functions/:id` |
| ADM-06 | Log de auditoria | Registro global de acoes no sistema | `GET /api/admin/audit-log` |
| ADM-07 | Estatisticas | Metricas do sistema | `GET /api/admin/stats` |

**Criterios de Aceite:**

- **ADM-01 — Gestao de usuarios**
  - [ ] Apenas ADMIN pode acessar
  - [ ] Lista todos os usuarios (ativos e inativos)
  - [ ] Suporta filtro por papel, status e nome
  - [ ] Suporta paginacao
  - [ ] Permite exclusao logica (soft delete)

- **ADM-02 — Alterar papel**
  - [ ] Apenas ADMIN pode alterar papeis
  - [ ] Nao pode remover o papel ADMIN do ultimo administrador do sistema (protecao do ultimo ADMIN)
  - [ ] Transicoes validas: qualquer papel para qualquer papel
  - [ ] Alteracao eh registrada no log de auditoria

- **ADM-03 — Listar funcoes liturgicas**
  - [ ] Apenas ADMIN pode ver funcoes inativas
  - [ ] COORDINATOR ve apenas funcoes ativas (via endpoint de dominio, nao admin)
  - [ ] Retorna: id, nome, descricao, status (ativa/inativa), quantidade de acolitos habilitados

- **ADM-04 — Criar funcao liturgica**
  - [ ] Apenas ADMIN pode criar
  - [ ] Nome deve ser unico
  - [ ] Campos: nome, descricao (opcional)
  - [ ] Funcao criada como ativa por padrao

- **ADM-05 — Editar funcao liturgica**
  - [ ] Apenas ADMIN pode editar
  - [ ] Permite alterar nome, descricao e status
  - [ ] Desativar funcao nao remove habilitacoes existentes, mas impede novas atribuicoes
  - [ ] Nome deve permanecer unico

- **ADM-06 — Log de auditoria**
  - [ ] Apenas ADMIN pode acessar
  - [ ] Registra: acao, usuario que executou, recurso afetado, timestamp, dados antes/depois
  - [ ] Suporta filtro por tipo de acao, usuario e periodo
  - [ ] Suporta paginacao
  - [ ] Registros sao imutaveis (apenas insercao, nunca edicao/exclusao)

- **ADM-07 — Estatisticas**
  - [ ] Apenas ADMIN pode acessar
  - [ ] Metricas incluem: total de usuarios por papel, total de celebracoes por tipo, total de escalas por status, media de servicos por acolito, funcoes mais/menos utilizadas

---

### 3.7 Publico

| ID | Feature | Descricao | Endpoint |
|----|---------|-----------|----------|
| PUB-01 | Escala publica por token | Visualizar escala publicada sem autenticacao | `GET /api/public/schedules/:token` |
| PUB-02 | Escalas do periodo | Listar escalas publicadas de um periodo via token | `GET /api/public/schedules/:token/period` |

**Criterios de Aceite:**

- **PUB-01 — Escala publica por token**
  - [ ] Nao requer autenticacao
  - [ ] Token invalido ou expirado retorna 404
  - [ ] Exibe apenas o primeiro nome dos acolitos (privacidade)
  - [ ] Mostra celebracoes com data, horario, local e atribuicoes
  - [ ] Apenas escalas com status PUBLISHED sao acessiveis

- **PUB-02 — Escalas do periodo**
  - [ ] Nao requer autenticacao
  - [ ] Retorna todas as escalas publicadas dentro do periodo do token
  - [ ] Mesmas regras de privacidade (primeiro nome apenas)
  - [ ] Ordenadas por data da celebracao

---

## 4. Matriz RBAC Resumida

| Recurso | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|---------|---------|----------|-------------|-------|
| Cadastro (self) | Sim | Sim | — | — |
| Login/Logout | Sim | Sim | Sim | Sim |
| Perfil proprio | Sim | Sim | Sim | Sim |
| Ver acolitos | So proprio | Vinculados | Todos | Todos |
| Gerenciar disponibilidade | Propria | — | Qualquer | Qualquer |
| Gerenciar funcoes | Ver proprias | — | Qualquer | Qualquer |
| Historico de servicos | Proprio | Vinculados | Qualquer | Qualquer |
| CRUD celebracoes | — | — | Sim | Sim |
| Requisitos de funcoes | — | — | Sim | Sim |
| Gerar escala | — | — | Sim | Sim |
| Atribuicao manual/troca | — | — | Sim | Sim |
| Publicar escala | — | — | Sim | Sim |
| Ver escala DRAFT | — | — | Sim | Sim |
| Ver escala PUBLISHED | Sim | Sim | Sim | Sim |
| Trilha de auditoria (escala) | — | — | Sim | Sim |
| Vincular responsavel-acolito | — | — | Sim | Sim |
| Gestao de usuarios | — | — | — | Sim |
| Alterar papeis | — | — | — | Sim |
| CRUD funcoes liturgicas | — | — | — | Sim |
| Log de auditoria global | — | — | — | Sim |
| Estatisticas | — | — | — | Sim |
| Escala publica (token) | Sem auth | Sem auth | Sem auth | Sem auth |

---

## 5. O Que Esta DENTRO do v1.0

| Area | Escopo |
|------|--------|
| Autenticacao | Cadastro, login JWT, logout com blacklist Redis, perfil |
| Acolitos | Perfil, calendario de disponibilidade, funcoes habilitadas, historico |
| Celebracoes | CRUD completo com 4 tipos, requisitos de funcoes por celebracao |
| Escalas | Geracao automatica (algoritmo guloso), deteccao de 5 tipos de conflito, atribuicao/troca manual, travamento/destravamento, publicacao com token, fluxo DRAFT->PUBLISHED->ARCHIVED |
| Responsaveis | Vinculo responsavel-acolito, visualizacao de escalas dos vinculados |
| Administracao | Gestao de usuarios e papeis, CRUD funcoes liturgicas, log de auditoria, estatisticas basicas |
| Acesso publico | Consulta de escala por token sem autenticacao (primeiro nome apenas) |
| Interface | SPA React com tema eclesiastico, responsivo (desktop + mobile) |
| Infraestrutura | Docker Compose com PostgreSQL, Redis, Fastify, Celery |
| Seguranca | RBAC com 4 papeis, protecao do ultimo ADMIN, JWT com blacklist |

---

## 6. O Que Esta FORA do v1.0

| Feature | Razao | Previsao |
|---------|-------|----------|
| Notificacoes (email/push) | Complexidade de integracao com servico de email; nao eh critico para MVP | v2.0 |
| Suporte a multiplas paroquias | Requer multi-tenancy; escopo de arquitetura significativo | v2.0 |
| Modo escuro (dark mode) | Escopo visual; modo claro como padrao eh suficiente para lancamento | v1.1 |
| Aplicativo mobile nativo | SPA responsivo atende; app nativo requer stack adicional | v2.0+ |
| Importacao/exportacao de dados | CSV/Excel import/export nao eh critico para operacao inicial | v1.1 |
| Relatorios e graficos | Estatisticas basicas estao incluidas; dashboards avancados ficam para depois | v1.1 |
| Integracao com calendario externo (Google Calendar, iCal) | Complexidade de OAuth e sincronizacao | v2.0 |
| Recuperacao de senha | Requer servico de email; workaround: ADMIN reseta via painel | v1.1 |
| Preferencias de funcao do acolito | Algoritmo v1 usa apenas habilitacao; preferencia eh refinamento | v1.1 |
| API publica documentada (OpenAPI/Swagger) | Documentacao interna de API existe; exposicao publica eh desnecessaria no MVP | v1.1 |

---

## 7. Resumo Quantitativo

| Metrica | Quantidade |
|---------|------------|
| Modulos | 7 |
| Features (total) | 35 |
| Endpoints de API | 42 |
| Papeis RBAC | 4 |
| Tipos de celebracao | 4 |
| Tipos de conflito | 5 |
| Status de escala | 3 (DRAFT, PUBLISHED, ARCHIVED) |
| Telas do frontend | 23 |
