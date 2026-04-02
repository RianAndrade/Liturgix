# 05 - Fluxos do Usuario

Este documento descreve os fluxos de usuario do Liturgix, detalhando cada interacao desde a perspectiva do ator, com pre-condicoes, passos, pos-condicoes e cenarios de erro.

---

## Indice

1. [Fluxo de Cadastro (Acolito)](#1-fluxo-de-cadastro-acolito)
2. [Fluxo de Cadastro (Responsavel / GUARDIAN)](#2-fluxo-de-cadastro-responsavel--guardian)
3. [Fluxo de Login](#3-fluxo-de-login)
4. [Fluxo de Marcar Indisponibilidade](#4-fluxo-de-marcar-indisponibilidade)
5. [Fluxo de Gerar Escala (Coordenadora)](#5-fluxo-de-gerar-escala-coordenadora)
6. [Fluxo de Resolver Conflito](#6-fluxo-de-resolver-conflito)
7. [Fluxo de Publicar Escala](#7-fluxo-de-publicar-escala)
8. [Fluxo de Consultar Escala Publica](#8-fluxo-de-consultar-escala-publica)
9. [Fluxo de Administracao](#9-fluxo-de-administracao)

---

## 1. Fluxo de Cadastro (Acolito)

### Ator

Pessoa que deseja se registrar como acolito no sistema.

### Pre-condicoes

- O usuario nao possui conta no sistema.
- O usuario possui um email valido e unico.
- O sistema esta acessivel (servicos app, db e redis em execucao).

### Passos

1. O usuario acessa a rota `/cadastro` no navegador.
2. O sistema exibe o formulario de cadastro com os campos: nome completo, email, senha e selecao de papel.
3. O usuario preenche o nome completo.
4. O usuario preenche o email.
5. O usuario define uma senha (minimo 8 caracteres).
6. O usuario seleciona o papel **ACOLYTE** na selecao de papel.
7. O usuario clica no botao "Cadastrar".
8. O frontend envia `POST /api/auth/register` com o payload:
   ```json
   {
     "name": "Nome Completo",
     "email": "email@exemplo.com",
     "password": "senhaSegura123",
     "role": "ACOLYTE"
   }
   ```
9. O backend valida os campos (Zod schema).
10. O backend verifica se o email ja existe no banco de dados.
11. O backend faz hash da senha com bcrypt.
12. O backend cria o registro na tabela `User` com papel ACOLYTE e `isActive: true`.
13. O backend gera um JWT contendo `{ userId, role }` e retorna:
    ```json
    {
      "success": true,
      "data": {
        "token": "eyJhbGciOi...",
        "user": { "id": "uuid", "name": "Nome Completo", "email": "email@exemplo.com", "role": "ACOLYTE" }
      }
    }
    ```
14. O frontend armazena o JWT (localStorage ou memoria).
15. O frontend redireciona o usuario para `/painel`.

### Pos-condicoes

- O usuario possui uma conta ativa com papel ACOLYTE.
- O usuario esta autenticado com um JWT valido.
- O usuario esta na tela do painel (dashboard).

### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Email ja cadastrado | `409 Conflict` — `"Email ja esta em uso"` | Exibe mensagem de erro no campo de email |
| Senha menor que 8 caracteres | `400 Bad Request` — `"Senha deve ter no minimo 8 caracteres"` | Exibe mensagem de validacao no campo de senha |
| Nome em branco | `400 Bad Request` — `"Nome e obrigatorio"` | Exibe mensagem de validacao no campo de nome |
| Email com formato invalido | `400 Bad Request` — `"Email invalido"` | Exibe mensagem de validacao no campo de email |
| Papel invalido (tentativa de COORDINATOR/ADMIN) | `400 Bad Request` — `"Papel nao permitido para auto-cadastro"` | Exibe mensagem de erro generica |
| Erro interno do servidor | `500 Internal Server Error` | Exibe mensagem generica "Erro ao cadastrar. Tente novamente." |

### Diagrama

```
Visitante                    Frontend (/cadastro)              API (POST /api/auth/register)         Banco (PostgreSQL)
    |                              |                                    |                                   |
    |--- acessa /cadastro -------->|                                    |                                   |
    |                              |--- exibe formulario -------------->|                                   |
    |--- preenche campos --------->|                                    |                                   |
    |--- seleciona ACOLYTE ------->|                                    |                                   |
    |--- clica "Cadastrar" ------->|                                    |                                   |
    |                              |--- POST /api/auth/register ------->|                                   |
    |                              |                                    |--- valida campos (Zod) ---------->|
    |                              |                                    |--- verifica email unico ---------->|
    |                              |                                    |<-- email disponivel --------------|
    |                              |                                    |--- hash senha (bcrypt) ---------->|
    |                              |                                    |--- INSERT User (ACOLYTE) -------->|
    |                              |                                    |<-- usuario criado ----------------|
    |                              |                                    |--- gera JWT -------------------->|
    |                              |<-- 201 { token, user } ------------|                                   |
    |                              |--- armazena JWT ----------------->|                                   |
    |<-- redireciona /painel ------|                                    |                                   |
```

---

## 2. Fluxo de Cadastro (Responsavel / GUARDIAN)

### Ator

Pessoa responsavel por um ou mais acolitos (ex.: pai, mae, tutor) que deseja se registrar no sistema.

### Pre-condicoes

- O usuario nao possui conta no sistema.
- O usuario possui um email valido e unico.
- O sistema esta acessivel.

### Passos

1. O usuario acessa a rota `/cadastro` no navegador.
2. O sistema exibe o formulario de cadastro com os campos: nome completo, email, senha e selecao de papel.
3. O usuario preenche o nome completo.
4. O usuario preenche o email.
5. O usuario define uma senha (minimo 8 caracteres).
6. O usuario seleciona o papel **GUARDIAN** na selecao de papel.
7. O usuario clica no botao "Cadastrar".
8. O frontend envia `POST /api/auth/register` com o payload:
   ```json
   {
     "name": "Nome do Responsavel",
     "email": "responsavel@exemplo.com",
     "password": "senhaSegura123",
     "role": "GUARDIAN"
   }
   ```
9. O backend executa as mesmas validacoes do fluxo de acolito (item 1).
10. O backend cria o registro na tabela `User` com papel GUARDIAN e `isActive: true`.
11. O backend gera um JWT e retorna a resposta de sucesso.
12. O frontend armazena o JWT e redireciona para `/painel`.

### Vinculacao de Acolitos (pos-cadastro)

Apos o cadastro, o responsavel **nao** pode vincular acolitos por conta propria. O fluxo de vinculacao e:

1. O responsavel comunica a coordenadora (fora do sistema) quais acolitos estao sob sua responsabilidade.
2. A coordenadora (COORDINATOR) acessa `/responsaveis` no sistema.
3. A coordenadora localiza o responsavel na lista.
4. A coordenadora utiliza `POST /api/guardians/:id/link` para vincular cada acolito ao responsavel.
5. A partir desse momento, o responsavel pode visualizar e gerenciar a disponibilidade dos acolitos vinculados.

### Pos-condicoes

- O usuario possui uma conta ativa com papel GUARDIAN.
- O usuario esta autenticado com um JWT valido.
- O usuario esta na tela do painel, mas ainda sem acolitos vinculados.
- A vinculacao de acolitos depende de acao da coordenadora.

### Cenarios de Erro

Os mesmos cenarios de erro do fluxo de cadastro de acolito se aplicam (secao 1), alem de:

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Tentativa de vincular acolito sem ser COORDINATOR | `403 Forbidden` | Nao disponivel na interface do GUARDIAN |

### Diagrama

```
Responsavel           Frontend            API                  DB              Coordenadora
    |                    |                  |                   |                    |
    |-- cadastro ------->|                  |                   |                    |
    |  (papel: GUARDIAN) |                  |                   |                    |
    |                    |-- POST register->|                   |                    |
    |                    |                  |-- INSERT User --->|                    |
    |                    |<-- JWT + user ---|                   |                    |
    |<-- /painel --------|                  |                   |                    |
    |                    |                  |                   |                    |
    |  (comunica fora do sistema quais acolitos sao seus)      |                    |
    |                    |                  |                   |                    |
    |                    |                  |                   |    acessa /responsaveis
    |                    |                  |<-- POST link --------------------- ----|
    |                    |                  |-- INSERT GuardianLink ->|              |
    |                    |                  |<-- vinculado ----------|              |
    |                    |                  |                   |                    |
    |  (agora ve acolitos vinculados no painel)                |                    |
```

---

## 3. Fluxo de Login

### Ator

Qualquer usuario registrado no sistema (ACOLYTE, GUARDIAN, COORDINATOR ou ADMIN).

### Pre-condicoes

- O usuario possui uma conta ativa no sistema.
- O usuario conhece seu email e senha.

### Passos

1. O usuario acessa a rota `/login` no navegador.
2. O sistema exibe o formulario de login com os campos: email e senha.
3. O usuario preenche o email.
4. O usuario preenche a senha.
5. O usuario clica no botao "Entrar".
6. O frontend envia `POST /api/auth/login` com o payload:
   ```json
   {
     "email": "email@exemplo.com",
     "password": "senhaSegura123"
   }
   ```
7. O backend busca o usuario pelo email na tabela `User`.
8. O backend verifica se o usuario existe e esta ativo (`isActive: true`).
9. O backend compara a senha informada com o hash armazenado (bcrypt.compare).
10. O backend gera um JWT contendo `{ userId, role }`.
11. O backend retorna:
    ```json
    {
      "success": true,
      "data": {
        "token": "eyJhbGciOi...",
        "user": { "id": "uuid", "name": "Nome", "email": "email@exemplo.com", "role": "ACOLYTE" }
      }
    }
    ```
12. O frontend armazena o JWT.
13. O frontend redireciona o usuario para `/painel`.
14. O painel exibe conteudo e navegacao de acordo com o papel do usuario:
    - **ACOLYTE**: ve suas escalas, disponibilidade e historico.
    - **GUARDIAN**: ve escalas e disponibilidade dos acolitos vinculados.
    - **COORDINATOR**: ve gestao de escalas, celebracoes e acolitos.
    - **ADMIN**: ve tudo, incluindo administracao do sistema.

### Pos-condicoes

- O usuario esta autenticado com um JWT valido.
- O usuario esta na tela do painel com navegacao adequada ao seu papel.

### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Email nao cadastrado | `401 Unauthorized` — `"Credenciais invalidas"` | Exibe mensagem generica (nao revela se email existe) |
| Senha incorreta | `401 Unauthorized` — `"Credenciais invalidas"` | Exibe mensagem generica (nao revela se email existe) |
| Conta desativada | `401 Unauthorized` — `"Credenciais invalidas"` | Exibe mensagem generica |
| Campos vazios | `400 Bad Request` — detalhes de validacao | Exibe mensagem de validacao nos campos |

> **Nota de seguranca**: A API retorna a mesma mensagem para email inexistente, senha incorreta e conta desativada. Isso impede enumeracao de contas.

### Diagrama

```
Usuario              Frontend (/login)        API (POST /api/auth/login)       DB
    |                      |                          |                         |
    |-- acessa /login ---->|                          |                         |
    |                      |-- exibe formulario ----->|                         |
    |-- email + senha ---->|                          |                         |
    |-- clica "Entrar" --->|                          |                         |
    |                      |-- POST /api/auth/login ->|                         |
    |                      |                          |-- busca por email ----->|
    |                      |                          |<-- usuario encontrado --|
    |                      |                          |-- bcrypt.compare ------>|
    |                      |                          |-- gera JWT ------------>|
    |                      |<-- 200 { token, user } --|                         |
    |                      |-- armazena JWT --------->|                         |
    |<-- redireciona /painel (por papel) -------------|                         |
```

---

## 4. Fluxo de Marcar Indisponibilidade

### 4.1. Acolito Marca Propria Indisponibilidade

#### Ator

Acolito autenticado (papel ACOLYTE).

#### Pre-condicoes

- O acolito esta autenticado com JWT valido.
- O acolito possui conta ativa.

#### Passos

1. O acolito acessa a rota `/disponibilidade` no menu lateral.
2. O frontend requisita `GET /api/servers/:id/availability?startDate=YYYY-MM-01&endDate=YYYY-MM-31` para o mes atual.
3. O sistema exibe um calendario mensal com as datas do mes.
4. Datas ja marcadas como indisponiveis aparecem com destaque visual (ex.: fundo vermelho/cinza).
5. O acolito clica em uma data disponivel para marca-la como **indisponivel**.
6. O acolito clica em uma data indisponivel para **remover** a indisponibilidade.
7. O acolito pode navegar para meses futuros e repetir o processo.
8. O acolito clica no botao "Salvar".
9. O frontend envia `PUT /api/servers/:id/availability` com o payload:
   ```json
   {
     "startDate": "2026-04-01",
     "endDate": "2026-04-30",
     "dates": ["2026-04-05", "2026-04-12", "2026-04-19"]
   }
   ```
10. O backend recebe a requisicao e valida:
    - O usuario autenticado e o dono do perfil (ou COORDINATOR+).
    - As datas estao dentro do periodo informado.
    - O formato das datas e valido.
11. O backend **substitui** todas as indisponibilidades do periodo informado pelas datas recebidas (estrategia PUT/replace).
12. O backend retorna confirmacao de sucesso.
13. O frontend exibe mensagem de sucesso ("Disponibilidade salva").

#### Pos-condicoes

- As indisponibilidades do acolito para o periodo estao atualizadas no banco.
- Indisponibilidades fora do periodo informado permanecem inalteradas.
- A geracao de escalas futuras respeitara essas datas.

#### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Tentativa de editar disponibilidade de outro acolito | `403 Forbidden` | Nao disponivel na interface |
| Data no passado (se houver regra) | `400 Bad Request` | Exibe aviso no calendario |
| Periodo invalido (inicio > fim) | `400 Bad Request` | Validacao no frontend impede envio |
| JWT expirado | `401 Unauthorized` | Redireciona para `/login` |

### 4.2. Responsavel Marca Indisponibilidade de Acolito Vinculado

#### Ator

Responsavel autenticado (papel GUARDIAN) com acolitos vinculados.

#### Pre-condicoes

- O responsavel esta autenticado.
- O responsavel possui ao menos um acolito vinculado (via GuardianLink).

#### Passos

1. O responsavel acessa `/disponibilidade` no menu lateral.
2. O sistema exibe um seletor com os acolitos vinculados ao responsavel.
3. O responsavel seleciona o acolito desejado.
4. O sistema carrega o calendario de disponibilidade do acolito selecionado.
5. O responsavel marca/desmarca datas da mesma forma que o fluxo do acolito (secao 4.1, passos 5-8).
6. O frontend envia `PUT /api/servers/:acolyteId/availability` com as datas.
7. O backend valida que o usuario autenticado e responsavel vinculado ao acolito (via GuardianLink) ou COORDINATOR+.
8. O backend substitui as indisponibilidades do periodo.
9. O frontend exibe confirmacao de sucesso.

#### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Acolito nao vinculado ao responsavel | `403 Forbidden` | Acolito nao aparece no seletor |
| Responsavel tenta editar acolito de outro responsavel | `403 Forbidden` | Nao disponivel na interface |

### Diagrama (ambos os fluxos)

```
Acolito/Responsavel       Frontend (/disponibilidade)         API                           DB
    |                           |                               |                            |
    |-- acessa /disponibilidade->|                               |                            |
    |                           |-- GET availability (mes) ---->|                            |
    |                           |                               |-- SELECT Unavailability -->|
    |                           |<-- datas indisponiveis -------|<--------------------------|
    |                           |-- exibe calendario ---------->|                            |
    |                           |                               |                            |
    |-- clica datas (toggle) -->|                               |                            |
    |-- clica "Salvar" ------->|                               |                            |
    |                           |-- PUT availability ---------->|                            |
    |                           |                               |-- DELETE periodo antigo -->|
    |                           |                               |-- INSERT novas datas ----->|
    |                           |<-- 200 sucesso ---------------|<--------------------------|
    |<-- "Disponibilidade salva"|                               |                            |
```

---

## 5. Fluxo de Gerar Escala (Coordenadora)

### Ator

Coordenadora autenticada (papel COORDINATOR ou ADMIN).

### Pre-condicoes

- A coordenadora esta autenticada com JWT valido.
- Existem celebracoes cadastradas no periodo desejado.
- Existem acolitos ativos com funcoes liturgicas atribuidas.
- As celebracoes possuem requisitos de funcoes definidos (CelebrationFunctionRequirement).

### Passos

1. A coordenadora acessa a rota `/escala/nova` no menu lateral ou no painel.
2. O sistema exibe um assistente de geracao de escala (wizard) com os seguintes campos:
   - **Data de inicio** do periodo.
   - **Data de fim** do periodo.
3. A coordenadora seleciona a data de inicio e a data de fim.
4. O frontend exibe uma pre-visualizacao das celebracoes encontradas no periodo:
   - Lista das celebracoes com data, horario, tipo e funcoes necessarias.
   - Total de celebracoes.
   - Total de vagas a preencher.
5. A coordenadora revisa as celebracoes listadas.
6. A coordenadora clica no botao "Gerar Escala".
7. O frontend solicita confirmacao: "Gerar escala para o periodo de DD/MM a DD/MM com N celebracoes?"
8. A coordenadora confirma.
9. O frontend envia `POST /api/schedules/generate` com o payload:
   ```json
   {
     "startDate": "2026-04-01",
     "endDate": "2026-04-30"
   }
   ```
10. O backend valida o periodo e verifica que existem celebracoes.
11. O backend cria um registro de Schedule com status **DRAFT**.
12. O backend enfileira a tarefa de geracao no Celery via Redis:
    ```json
    {
      "task": "tasks.generate_schedule",
      "payload": { "scheduleId": "uuid", "startDate": "2026-04-01", "endDate": "2026-04-30" }
    }
    ```
13. O backend retorna imediatamente:
    ```json
    {
      "success": true,
      "data": { "scheduleId": "uuid", "status": "DRAFT", "message": "Geracao em andamento" }
    }
    ```
14. O frontend inicia polling (`GET /api/schedules/:id` a cada 2-3 segundos) ou escuta via WebSocket.
15. O worker Celery recebe a tarefa e executa o algoritmo de geracao:
    - Carrega celebracoes do periodo, acolitos ativos, funcoes, indisponibilidades e historico.
    - Para cada celebracao (ordem cronologica), para cada vaga (mais restrita primeiro):
      - Filtra candidatos elegiveis (funcao habilitada, disponivel, sem duplicata no dia).
      - Pontua cada candidato (contagem 50% + rotacao 30% + intervalo 20%).
      - Seleciona o candidato com maior pontuacao (desempate: menos servicos > mais dias > alfabetico).
      - Registra atribuicao e auditoria.
    - Detecta e registra conflitos (SEM_CANDIDATOS, CANDIDATOS_INSUFICIENTES, etc.).
16. O worker atualiza o Schedule no banco com as atribuicoes e conflitos.
17. O frontend detecta que a geracao foi concluida (polling retorna status atualizado).
18. O frontend exibe a escala DRAFT com:
    - Grade de atribuicoes por celebracao e funcao.
    - Indicadores visuais de conflito (vermelho) para vagas nao preenchidas ou com problemas.
    - Resumo: total de vagas, preenchidas, com conflito.

### Pos-condicoes

- Existe um registro de Schedule com status DRAFT no banco.
- As atribuicoes (ScheduleAssignment) estao registradas com pontuacao e dados de auditoria.
- Conflitos estao detectados e registrados.
- A trilha de auditoria (ScheduleAuditLog) foi gerada.

### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Nenhuma celebracao no periodo | `400 Bad Request` — `"Nenhuma celebracao encontrada no periodo"` | Exibe aviso e impede geracao |
| Periodo invalido (inicio > fim) | `400 Bad Request` | Validacao no frontend impede envio |
| Nenhum acolito ativo | `400 Bad Request` — `"Nenhum acolito ativo com funcoes atribuidas"` | Exibe aviso |
| Erro no worker Celery | Schedule permanece em estado de processamento | Frontend exibe timeout apos X segundos e sugere tentar novamente |
| Papel sem permissao | `403 Forbidden` | Rota nao disponivel na navegacao |

### Diagrama

```
Coordenadora     Frontend (/escala/nova)    API (POST generate)     Redis/Celery        DB
    |                  |                         |                      |                |
    |-- /escala/nova ->|                         |                      |                |
    |-- periodo ------>|                         |                      |                |
    |                  |-- busca celebracoes --->|                      |                |
    |                  |<-- lista celebracoes ---|                      |                |
    |-- confirma ----->|                         |                      |                |
    |                  |-- POST generate ------->|                      |                |
    |                  |                         |-- INSERT Schedule -->|                |
    |                  |                         |-- enfileira task --->|                |
    |                  |<-- 202 { scheduleId } --|                      |                |
    |                  |                         |                      |                |
    |                  |-- polling GET /:id ---->|                      |-- executa      |
    |                  |                         |                      |   algoritmo    |
    |                  |                         |                      |-- INSERT       |
    |                  |                         |                      |   assignments->|
    |                  |                         |                      |-- UPDATE       |
    |                  |                         |                      |   Schedule --->|
    |                  |-- polling GET /:id ---->|                      |                |
    |                  |<-- escala completa -----|<-------------------------------------|
    |<-- exibe DRAFT --|                         |                      |                |
```

---

## 6. Fluxo de Resolver Conflito

### Ator

Coordenadora autenticada (papel COORDINATOR ou ADMIN).

### Pre-condicoes

- Existe uma escala com status DRAFT.
- A escala possui ao menos um conflito detectado durante a geracao.

### Tipos de Conflito

| Tipo | Descricao | Acao Sugerida |
|------|-----------|---------------|
| `SEM_CANDIDATOS` | Nenhum acolito habilitado para a funcao | Habilitar acolitos para a funcao ou deixar vago |
| `CANDIDATOS_INSUFICIENTES` | Menos candidatos que vagas | Habilitar mais acolitos ou aceitar com menos |
| `SOBRECARGA_CANDIDATO_UNICO` | Unico candidato ja esta sobrecarregado | Aceitar sobrecarga ou deixar vago |
| `TODOS_INDISPONIVEIS` | Todos os habilitados marcaram indisponibilidade | Negociar com acolitos ou deixar vago |
| `LACUNA_QUALIFICACAO` | Funcao existe mas nenhum acolito tem qualificacao | Cadastrar qualificacoes ou remover requisito |

### Passos

1. A coordenadora acessa a escala DRAFT via `/escala/:id`.
2. O sistema exibe a grade de atribuicoes.
3. Vagas com conflito aparecem destacadas em vermelho com um icone de alerta.
4. A coordenadora clica em uma vaga com conflito.
5. O sistema exibe um painel lateral ou modal com:
   - **Tipo do conflito** (ex.: SEM_CANDIDATOS).
   - **Descricao legivel** do conflito.
   - **Sugestoes** de resolucao.
   - **Lista de acolitos disponiveis** (se houver), com pontuacao.
6. A coordenadora escolhe uma das acoes:

   **a) Atribuir manualmente:**
   - Seleciona um acolito da lista (ou busca fora da lista).
   - Confirma a atribuicao.
   - O frontend envia `POST /api/schedules/:id/assignments` com:
     ```json
     {
       "celebrationId": "uuid",
       "functionId": "uuid",
       "userId": "uuid"
     }
     ```
   - O backend cria a atribuicao e marca como `isLocked: true` (travada para proteger de re-geracao).
   - O conflito e resolvido.

   **b) Deixar vago:**
   - A coordenadora reconhece o conflito e opta por deixar a vaga sem atribuicao.
   - A vaga permanece com `userId: null`.
   - O conflito permanece registrado, mas a coordenadora pode publicar a escala se nao for bloqueante.

   **c) Re-gerar a escala:**
   - A coordenadora pode solicitar re-geracao (apos ajustar indisponibilidades ou qualificacoes).
   - Atribuicoes marcadas como `isLocked: true` sao preservadas.
   - Apenas vagas nao travadas sao re-processadas pelo algoritmo.

7. A coordenadora repete o processo para cada conflito restante.

### Pos-condicoes

- Conflitos foram tratados (resolvidos, aceitos ou re-gerados).
- Atribuicoes manuais estao travadas (`isLocked: true`).
- A escala pode estar pronta para publicacao (se nao houver conflitos bloqueantes).

### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Acolito indisponivel na data (atribuicao forcada) | `200` com aviso | Exibe alerta: "Acolito marcado como indisponivel nesta data" |
| Acolito ja atribuido na mesma celebracao | `409 Conflict` | Exibe erro: "Acolito ja possui atribuicao nesta celebracao" |
| Acolito nao habilitado para a funcao | `200` com aviso | Exibe alerta: "Acolito nao possui qualificacao para esta funcao" |
| Escala nao esta em DRAFT | `400 Bad Request` | Exibe erro: "Apenas escalas em rascunho podem ser editadas" |

### Diagrama

```
Coordenadora         Frontend (/escala/:id)          API                        DB
    |                       |                          |                         |
    |-- acessa escala ----->|                          |                         |
    |                       |-- GET /schedules/:id --->|                         |
    |                       |<-- escala + conflitos ---|                         |
    |<-- exibe grade -------|                          |                         |
    |   (conflitos em vermelho)                        |                         |
    |                       |                          |                         |
    |-- clica conflito ---->|                          |                         |
    |<-- painel de detalhe -|                          |                         |
    |                       |                          |                         |
    |  [opcao A: atribuir manualmente]                 |                         |
    |-- seleciona acolito ->|                          |                         |
    |                       |-- POST assignment ------>|                         |
    |                       |                          |-- INSERT (locked) ----->|
    |                       |<-- 201 atribuicao -------|<------------------------|
    |<-- conflito resolvido-|                          |                         |
    |                       |                          |                         |
    |  [opcao B: deixar vago]                          |                         |
    |-- aceita vago ------->|                          |                         |
    |<-- vaga permanece nula|                          |                         |
    |                       |                          |                         |
    |  [opcao C: re-gerar]                             |                         |
    |-- solicita re-geracao>|                          |                         |
    |                       |-- POST generate -------->|                         |
    |                       |                          |-- preserva locked ----->|
    |                       |                          |-- re-processa vagas --->|
    |                       |<-- escala atualizada ----|<------------------------|
```

---

## 7. Fluxo de Publicar Escala

### Ator

Coordenadora autenticada (papel COORDINATOR ou ADMIN).

### Pre-condicoes

- Existe uma escala com status DRAFT.
- A escala nao possui conflitos bloqueantes (ou a coordenadora optou por aceita-los).

### Passos

1. A coordenadora acessa a escala DRAFT via `/escala/:id`.
2. O sistema exibe a grade de atribuicoes com resumo:
   - Total de vagas preenchidas.
   - Conflitos restantes (se houver, com indicacao de que nao sao bloqueantes).
3. O botao "Publicar" esta habilitado (nao ha conflitos bloqueantes).
4. A coordenadora clica no botao "Publicar".
5. O sistema exibe um dialogo de confirmacao:
   - "Deseja publicar a escala do periodo DD/MM a DD/MM?"
   - "Apos publicada, a escala sera visivel para todos os acolitos e podera ser compartilhada publicamente."
6. A coordenadora confirma.
7. O frontend envia `POST /api/schedules/:id/publish`.
8. O backend valida:
   - A escala esta em status DRAFT.
   - O usuario tem permissao (COORDINATOR ou ADMIN).
9. O backend atualiza o status da escala para **PUBLISHED**.
10. O backend gera um token de compartilhamento unico (nanoid) e armazena no campo `publicToken`.
11. O backend retorna:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "status": "PUBLISHED",
        "publicToken": "abc123xyz",
        "publicUrl": "/p/abc123xyz"
      }
    }
    ```
12. O frontend exibe mensagem de sucesso: "Escala publicada com sucesso!"
13. O frontend exibe o link publico para compartilhamento: `https://dominio/p/abc123xyz`.
14. A coordenadora pode copiar o link e compartilhar (WhatsApp, email, etc.).

### Pos-condicoes

- A escala possui status PUBLISHED.
- Um token de compartilhamento publico foi gerado.
- Acolitos e responsaveis podem ver a escala em seus paineis.
- Qualquer pessoa com o link publico pode consultar a escala (sem login).
- A escala nao pode mais ser editada (exceto por re-abertura, se implementada).

### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Escala nao esta em DRAFT | `400 Bad Request` — `"Apenas escalas em rascunho podem ser publicadas"` | Botao "Publicar" desabilitado |
| Escala com conflitos bloqueantes | `400 Bad Request` — `"Escala possui conflitos nao resolvidos"` | Botao "Publicar" desabilitado, lista conflitos |
| Papel sem permissao | `403 Forbidden` | Botao "Publicar" nao exibido |

### Diagrama

```
Coordenadora       Frontend (/escala/:id)        API (POST publish)           DB
    |                     |                            |                       |
    |-- acessa escala --->|                            |                       |
    |<-- exibe DRAFT -----|                            |                       |
    |                     |                            |                       |
    |-- clica "Publicar"->|                            |                       |
    |<-- confirmacao? ----|                            |                       |
    |-- confirma -------->|                            |                       |
    |                     |-- POST /:id/publish ------>|                       |
    |                     |                            |-- valida status ----->|
    |                     |                            |-- UPDATE PUBLISHED -->|
    |                     |                            |-- gera publicToken -->|
    |                     |                            |<-- atualizado --------|
    |                     |<-- 200 { publicUrl } ------|                       |
    |<-- "Publicada!" ----|                            |                       |
    |<-- link: /p/token --|                            |                       |
```

---

## 8. Fluxo de Consultar Escala Publica

### Ator

Qualquer pessoa com acesso ao link publico (nao necessita autenticacao).

### Pre-condicoes

- Uma escala com status PUBLISHED possui um `publicToken` valido.
- A pessoa possui o link de compartilhamento (ex.: `https://dominio/p/abc123xyz`).

### Passos

1. A pessoa acessa o link `/p/:token` no navegador.
2. O frontend renderiza a pagina publica de escala.
3. O frontend requisita `GET /api/public/schedules/:token`.
4. O backend busca a escala pelo token.
5. O backend verifica que a escala esta com status PUBLISHED.
6. O backend retorna os dados da escala com **apenas o primeiro nome** dos acolitos (privacidade):
   ```json
   {
     "success": true,
     "data": {
       "period": { "startDate": "2026-04-01", "endDate": "2026-04-30" },
       "celebrations": [
         {
           "date": "2026-04-05",
           "time": "09:00",
           "type": "SUNDAY_MASS",
           "assignments": [
             { "function": "Turiferario", "acolyte": "Pedro" },
             { "function": "Cerimoniario", "acolyte": "Maria" }
           ]
         }
       ]
     }
   }
   ```
7. O frontend exibe a escala em formato de lista ou grade, organizada por data.
8. A pessoa pode utilizar o filtro de data para navegar entre semanas ou datas especificas.
9. A pessoa pode acessar `GET /api/public/schedules/:token/period?startDate=...&endDate=...` para filtrar por periodo.

### Pos-condicoes

- A pessoa visualizou a escala sem necessidade de login.
- Nenhum dado sensivel (sobrenome, email, telefone) foi exposto.

### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Token invalido/inexistente | `404 Not Found` | Exibe pagina "Escala nao encontrada" |
| Escala nao esta PUBLISHED (ex.: ARCHIVED) | `404 Not Found` | Exibe pagina "Escala nao disponivel" |
| Escala sem atribuicoes | `200` com lista vazia | Exibe mensagem "Nenhuma atribuicao para este periodo" |

### Diagrama

```
Visitante            Frontend (/p/:token)         API (GET /api/public/schedules/:token)    DB
    |                      |                                |                                 |
    |-- acessa link ------>|                                |                                 |
    |                      |-- GET /public/schedules/:token>|                                 |
    |                      |                                |-- busca por token ------------->|
    |                      |                                |<-- escala PUBLISHED ------------|
    |                      |                                |-- filtra: so primeiro nome ---->|
    |                      |<-- 200 { celebrations } -------|                                 |
    |<-- exibe escala -----|                                |                                 |
    |                      |                                |                                 |
    |-- filtra por data -->|                                |                                 |
    |                      |-- GET .../period?dates ------->|                                 |
    |                      |<-- dados filtrados ------------|                                 |
    |<-- exibe filtrado ---|                                |                                 |
```

---

## 9. Fluxo de Administracao

### Ator

Administrador autenticado (papel ADMIN).

### Pre-condicoes

- O administrador esta autenticado com JWT valido e papel ADMIN.
- O sistema possui dados (usuarios, escalas, funcoes) para gerenciar.

### 9.1. Acesso ao Painel Administrativo

1. O administrador acessa `/admin` no menu lateral.
2. O frontend requisita `GET /api/admin/stats`.
3. O sistema exibe um dashboard com estatisticas:
   - Total de usuarios por papel (ACOLYTE, GUARDIAN, COORDINATOR, ADMIN).
   - Total de acolitos ativos.
   - Total de escalas (DRAFT, PUBLISHED, ARCHIVED).
   - Total de celebracoes cadastradas.
   - Total de funcoes liturgicas ativas.

### 9.2. Gerenciar Usuarios

#### Passos

1. O administrador acessa `/admin/usuarios`.
2. O frontend requisita `GET /api/admin/users`.
3. O sistema exibe uma tabela com todos os usuarios:
   - Nome, email, papel, status (ativo/inativo), data de cadastro.
4. O administrador pode **alterar o papel** de um usuario:
   - Clica no papel atual do usuario.
   - Seleciona o novo papel no dropdown.
   - O frontend envia `PATCH /api/admin/users/:id/role` com `{ "role": "COORDINATOR" }`.
   - O backend valida:
     - Nao permite remover o ultimo ADMIN do sistema (protecao).
     - Registra a alteracao no log de auditoria.
   - O papel e atualizado.
5. O administrador pode **desativar** um usuario:
   - Clica no botao de desativar.
   - O frontend envia `DELETE /api/users/:id` (exclusao logica, `isActive: false`).
   - O usuario perde acesso ao sistema no proximo login.

#### Cenarios de Erro

| Cenario | Resposta da API | Comportamento no Frontend |
|---------|-----------------|---------------------------|
| Tentativa de remover ultimo ADMIN | `400 Bad Request` — `"Nao e possivel remover o ultimo administrador"` | Exibe erro e impede acao |
| Tentativa de desativar a si mesmo | `400 Bad Request` — `"Nao e possivel desativar sua propria conta"` | Exibe erro |

### 9.3. Gerenciar Funcoes Liturgicas (CRUD)

#### Passos

1. O administrador acessa `/admin/funcoes`.
2. O frontend requisita `GET /api/admin/functions`.
3. O sistema exibe a lista de funcoes liturgicas (incluindo inativas):
   - Nome, descricao, quantidade minima por celebracao, status (ativa/inativa).
4. O administrador pode:

   **Criar funcao:**
   - Clica em "Nova Funcao".
   - Preenche nome, descricao e quantidade minima.
   - O frontend envia `POST /api/admin/functions`.
   - A funcao e criada como ativa.

   **Editar funcao:**
   - Clica no botao de editar.
   - Altera os campos desejados.
   - O frontend envia `PATCH /api/admin/functions/:id`.

   **Desativar funcao:**
   - Clica no botao de desativar.
   - A funcao e marcada como inativa.
   - Funcoes inativas nao aparecem para atribuicao em novas escalas, mas permanecem em escalas existentes.

### 9.4. Consultar Auditoria Global

#### Passos

1. O administrador acessa `/admin/auditoria`.
2. O frontend requisita `GET /api/admin/audit-log`.
3. O sistema exibe o log de auditoria com:
   - Data/hora, usuario que executou, acao, recurso afetado, detalhes.
4. O administrador pode filtrar por:
   - Periodo (data inicio / data fim).
   - Tipo de acao (criacao, edicao, exclusao, publicacao, etc.).
   - Usuario.

### Pos-condicoes

- As alteracoes administrativas estao registradas no banco e no log de auditoria.
- Alteracoes de papel surtem efeito no proximo login do usuario afetado (ou imediatamente se o JWT for re-validado).

### Diagrama

```
Administrador       Frontend (/admin)          API (/api/admin/*)          DB
    |                    |                          |                       |
    |-- /admin --------->|                          |                       |
    |                    |-- GET /admin/stats ------>|                       |
    |                    |<-- estatisticas ----------|<----------------------|
    |<-- dashboard ------|                          |                       |
    |                    |                          |                       |
    |-- /admin/usuarios->|                          |                       |
    |                    |-- GET /admin/users ------>|                       |
    |                    |<-- lista usuarios --------|<----------------------|
    |                    |                          |                       |
    |-- muda papel ----->|                          |                       |
    |                    |-- PATCH .../role -------->|                       |
    |                    |                          |-- valida (ultimo ADMIN?) ->|
    |                    |                          |-- UPDATE User -------->|
    |                    |                          |-- INSERT AuditLog ---->|
    |                    |<-- 200 atualizado --------|<----------------------|
    |<-- papel alterado -|                          |                       |
    |                    |                          |                       |
    |-- /admin/funcoes ->|                          |                       |
    |                    |-- GET /admin/functions -->|                       |
    |                    |<-- lista funcoes ---------|<----------------------|
    |                    |                          |                       |
    |-- cria funcao ---->|                          |                       |
    |                    |-- POST /admin/functions ->|                       |
    |                    |                          |-- INSERT Function ---->|
    |                    |<-- 201 criada ------------|<----------------------|
    |                    |                          |                       |
    |-- /admin/auditoria>|                          |                       |
    |                    |-- GET /admin/audit-log -->|                       |
    |                    |<-- log de auditoria ------|<----------------------|
    |<-- exibe log ------|                          |                       |
```

---

## Resumo dos Fluxos por Papel

| Papel | Fluxos Disponiveis |
|-------|--------------------|
| **Visitante (sem login)** | Cadastro, Login, Consulta publica de escala |
| **ACOLYTE** | Login, Marcar propria indisponibilidade, Consultar escalas publicadas, Ver historico |
| **GUARDIAN** | Login, Marcar indisponibilidade de acolitos vinculados, Consultar escalas publicadas |
| **COORDINATOR** | Login, Gerar escala, Resolver conflitos, Publicar escala, Vincular acolitos a responsaveis, Gerenciar celebracoes |
| **ADMIN** | Todos os fluxos de COORDINATOR + Gerenciar usuarios, Mudar papeis, CRUD funcoes liturgicas, Auditoria global |

---

## Navegacao entre Fluxos

```
                                    +--------------+
                                    |   Visitante  |
                                    +------+-------+
                                           |
                              +------------+------------+
                              |                         |
                        +-----v-----+             +-----v-----+
                        |  Cadastro |             |   Login   |
                        +-----+-----+             +-----+-----+
                              |                         |
                              +------------+------------+
                                           |
                                    +------v-------+
                                    |    Painel    |
                                    |  (por papel) |
                                    +------+-------+
                                           |
                    +----------+-----------+-----------+----------+
                    |          |           |           |          |
              +-----v---+ +---v----+ +----v----+ +---v----+ +---v------+
              |Disponibi-| |Escalas | |Gerar   | |Publicar| |  Admin   |
              |lidade    | |        | |Escala   | |Escala  | |          |
              |(ACOLYTE/ | |(todos) | |(COORD+) | |(COORD+)| | (ADMIN)  |
              | GUARDIAN)| |        | |         | |        | |          |
              +----------+ +---+----+ +----+----+ +---+----+ +----+-----+
                               |           |           |           |
                               |      +----v----+     |    +------v-------+
                               |      |Resolver |     |    | Usuarios     |
                               |      |Conflito |     |    | Funcoes      |
                               |      |(COORD+) |     |    | Auditoria    |
                               |      +---------+     |    +--------------+
                               |                      |
                          +----v----------------------v----+
                          |     Escala Publica (/p/:token) |
                          |        (qualquer pessoa)       |
                          +--------------------------------+
```
