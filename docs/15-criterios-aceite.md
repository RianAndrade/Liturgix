# 15 - Criterios de Aceite

Criterios de aceite para cada funcionalidade principal do Liturgix.
Formato **Given/When/Then** (Dado/Quando/Entao) utilizado onde aplicavel.

---

## 1. Autenticacao

### 1.1 Registro de Usuario

**CA-AUTH-01: Registro com dados validos**

- **Dado** que um visitante acessa o endpoint de registro
- **Quando** envia email valido, senha com minimo de caracteres e role ACOLYTE ou GUARDIAN
- **Entao** o usuario e criado no banco de dados, um JWT e retornado no corpo da resposta e o status HTTP e 201

**CA-AUTH-02: Registro com email invalido**

- **Dado** que um visitante tenta se registrar
- **Quando** envia um email em formato invalido (ex.: "fulano@", "fulano.com", "")
- **Entao** a API retorna status 400 com mensagem indicando formato de email invalido
- **E** nenhum usuario e criado no banco

**CA-AUTH-03: Registro com email duplicado**

- **Dado** que ja existe um usuario cadastrado com o email "joao@igreja.com"
- **Quando** outro visitante tenta se registrar com o mesmo email
- **Entao** a API retorna status 409 com mensagem "Email ja cadastrado"
- **E** nenhum registro duplicado e criado

**CA-AUTH-04: Registro com role nao permitido**

- **Dado** que um visitante tenta se registrar
- **Quando** envia role diferente de ACOLYTE ou GUARDIAN (ex.: ADMIN, PRIEST, ou valor inexistente)
- **Entao** a API retorna status 400 com mensagem indicando roles permitidos
- **E** nenhum usuario e criado

---

### 1.2 Login

**CA-AUTH-05: Login com credenciais corretas**

- **Dado** que existe um usuario cadastrado com email "joao@igreja.com" e senha "Senha123!"
- **Quando** envia email e senha corretos no endpoint de login
- **Entao** a API retorna status 200 com JWT valido contendo userId, email e role no payload

**CA-AUTH-06: Login com senha incorreta**

- **Dado** que existe um usuario cadastrado com email "joao@igreja.com"
- **Quando** envia o email correto mas senha errada
- **Entao** a API retorna status 401 com mensagem generica "Credenciais invalidas"
- **E** nenhuma informacao sobre a existencia do email e revelada

**CA-AUTH-07: Login com email inexistente**

- **Dado** que nao existe usuario com email "inexistente@igreja.com"
- **Quando** tenta login com esse email
- **Entao** a API retorna status 401 com a mesma mensagem "Credenciais invalidas" do CA-AUTH-06
- **E** nao e possivel distinguir entre email inexistente e senha errada (prevencao de enumeracao)

---

### 1.3 Logout

**CA-AUTH-08: Logout com token valido**

- **Dado** que o usuario esta autenticado com um JWT valido
- **Quando** envia requisicao de logout com o token no header Authorization
- **Entao** o token e adicionado a blacklist no Redis
- **E** a API retorna status 200 com confirmacao de logout

**CA-AUTH-09: Requisicao com token em blacklist**

- **Dado** que o usuario fez logout e o token foi adicionado a blacklist
- **Quando** tenta acessar qualquer endpoint protegido usando o mesmo token
- **Entao** a API retorna status 401 com mensagem "Token invalido ou expirado"

---

### 1.4 Perfil

**CA-AUTH-10: Consulta de perfil autenticado**

- **Dado** que o usuario esta autenticado com JWT valido
- **Quando** acessa o endpoint de perfil (GET /api/profile)
- **Entao** a API retorna status 200 com: id, nome, email, role, funcoes liturgicas atribuidas e data de criacao

**CA-AUTH-11: Consulta de perfil sem autenticacao**

- **Dado** que a requisicao nao contem header Authorization
- **Quando** tenta acessar o endpoint de perfil
- **Entao** a API retorna status 401

---

## 2. Gestao de Disponibilidade

### 2.1 Marcar Indisponibilidade (Acolito)

**CA-DISP-01: Marcar datas futuras como indisponivel**

- **Dado** que o acolito esta autenticado
- **Quando** seleciona datas no futuro (ex.: proximos 3 domingos) e salva
- **Entao** as indisponibilidades sao salvas no banco vinculadas ao acolito
- **E** a API retorna status 200 com as datas confirmadas

**CA-DISP-02: Rejeitar datas no passado**

- **Dado** que o acolito esta autenticado
- **Quando** tenta marcar uma data que ja passou (ex.: ontem)
- **Entao** a API retorna status 400 com mensagem "Nao e possivel marcar indisponibilidade para datas passadas"
- **E** nenhuma indisponibilidade e salva

**CA-DISP-03: Salvar substitui todo o periodo**

- **Dado** que o acolito ja marcou indisponibilidade para os dias 10, 12 e 15 de maio
- **Quando** envia nova requisicao para o mesmo periodo com apenas os dias 10 e 15
- **Entao** a indisponibilidade do dia 12 e removida
- **E** apenas os dias 10 e 15 ficam registrados (substituicao completa, nao incremental)

---

### 2.2 Responsavel Marca para Acolito Vinculado

**CA-DISP-04: Guardian marca para acolito vinculado**

- **Dado** que o guardian esta autenticado e tem um acolito menor vinculado a sua conta
- **Quando** marca datas futuras de indisponibilidade em nome do acolito vinculado
- **Entao** as indisponibilidades sao salvas vinculadas ao acolito (nao ao guardian)
- **E** as mesmas regras de datas futuras se aplicam

**CA-DISP-05: Guardian tenta marcar para acolito nao vinculado**

- **Dado** que o guardian esta autenticado mas o acolito informado nao esta vinculado a ele
- **Quando** tenta marcar indisponibilidade para esse acolito
- **Entao** a API retorna status 403 com mensagem "Sem permissao para gerenciar este acolito"

---

## 3. Gestao de Celebracoes

### 3.1 Criar Celebracao

**CA-CEL-01: Criar celebracao com dados validos**

- **Dado** que o usuario com permissao de gestao esta autenticado
- **Quando** envia nome ("Missa Dominical"), data futura, tipo valido (ex.: MISSA, ADORACAO, NOVENA)
- **Entao** a celebracao e criada com status ATIVA e a API retorna status 201 com os dados da celebracao

**CA-CEL-02: Rejeitar celebracao com data no passado**

- **Dado** que o usuario tenta criar uma celebracao
- **Quando** informa uma data que ja passou
- **Entao** a API retorna status 400 com mensagem "Data da celebracao deve ser futura"

**CA-CEL-03: Rejeitar celebracao sem nome**

- **Dado** que o usuario tenta criar uma celebracao
- **Quando** envia sem nome ou com nome vazio
- **Entao** a API retorna status 400 com indicacao de campo obrigatorio

---

### 3.2 Requisitos de Funcoes por Celebracao

**CA-CEL-04: Definir funcoes necessarias**

- **Dado** que a celebracao "Missa Dominical" foi criada
- **Quando** o gestor define que precisa de: 2 Ceriferiarios, 1 Cruciferario, 1 Turiferario
- **Entao** os requisitos sao salvos vinculados a celebracao

**CA-CEL-05: Alerta ao definir zero funcoes**

- **Dado** que a celebracao "Missa Dominical" existe
- **Quando** o gestor tenta salvar a celebracao sem nenhuma funcao definida
- **Entao** a API retorna status 200 com warning: "Celebracao salva sem funcoes definidas. A escala nao tera atribuicoes para esta celebracao."
- **E** a celebracao e salva mas com flag de aviso

---

## 4. Geracao de Escala (Algoritmo)

### 4.1 Geracao Basica

**CA-ALGO-01: Geracao bem-sucedida com dados completos**

- **Dado** que existem 5 acolitos cadastrados, 3 funcoes liturgicas configuradas e 2 celebracoes futuras com requisitos definidos
- **Quando** o gestor solicita geracao da escala para o periodo
- **Entao** o sistema gera uma escala com status DRAFT
- **E** cada slot de funcao de cada celebracao possui um acolito atribuido
- **E** a resposta inclui o id da escala e resumo das atribuicoes

**CA-ALGO-02: Acolito nao e atribuido a funcao sem qualificacao**

- **Dado** que o acolito "Maria" so tem qualificacao para Ceriferiario
- **Quando** a escala e gerada
- **Entao** "Maria" nunca aparece atribuida a Cruciferario, Turiferario ou qualquer outra funcao para a qual nao e qualificada

**CA-ALGO-03: Acolito nao e atribuido em data de indisponibilidade**

- **Dado** que o acolito "Pedro" marcou indisponibilidade para 15/05
- **E** existe uma celebracao em 15/05
- **Quando** a escala e gerada
- **Entao** "Pedro" nao e atribuido a nenhuma funcao na celebracao de 15/05

**CA-ALGO-04: Acolito nao e atribuido duas vezes na mesma celebracao**

- **Dado** que a celebracao precisa de 2 Ceriferiarios e 1 Cruciferario
- **E** o acolito "Ana" e qualificada para ambas as funcoes
- **Quando** a escala e gerada
- **Entao** "Ana" aparece no maximo uma vez nessa celebracao, independente de quantas funcoes ela domine

---

### 4.2 Balanceamento e Priorizacao

**CA-ALGO-05: Acolito com menos servicos tem prioridade**

- **Dado** que "Joao" serviu 5 vezes no periodo anterior e "Lucas" serviu 1 vez
- **E** ambos sao qualificados para a funcao e estao disponiveis
- **Quando** a escala e gerada
- **Entao** "Lucas" recebe pontuacao mais alta (score) e e preferido para atribuicao
- **E** ao final, a distribuicao de servicos tende ao equilibrio entre os acolitos

**CA-ALGO-06: Cold start para novo acolito**

- **Dado** que o acolito "Novo" acabou de ser cadastrado e tem 0 servicos historicos
- **Quando** a escala e gerada
- **Entao** "Novo" recebe score de prioridade 100 (maximo)
- **E** e preferido para atribuicao quando ha multiplos candidatos disponiveis

---

### 4.3 Atribuicoes Travadas

**CA-ALGO-07: Atribuicoes travadas sao preservadas na re-geracao**

- **Dado** que na escala DRAFT o gestor travou (locked) a atribuicao "Pedro como Cruciferario em 15/05"
- **Quando** solicita re-geracao da escala
- **Entao** a atribuicao de Pedro permanece intacta
- **E** apenas os slots nao travados sao re-calculados pelo algoritmo

**CA-ALGO-08: Travamento nao viola regras de indisponibilidade**

- **Dado** que "Pedro" foi travado como Cruciferario em 15/05
- **Mas** posteriormente "Pedro" marcou indisponibilidade para 15/05
- **Quando** a re-geracao e executada
- **Entao** o sistema emite um aviso de conflito entre travamento e indisponibilidade
- **E** a atribuicao travada e mantida mas sinalizada para revisao manual

---

### 4.4 Cenarios de Conflito

**CA-CONF-01: NO_CANDIDATES - Nenhum candidato qualificado**

- **Dado** que a celebracao requer 1 Turiferario
- **E** nenhum acolito no sistema possui qualificacao para Turiferario
- **Quando** a escala e gerada
- **Entao** o slot fica vazio
- **E** e criado um registro de conflito com:
  - tipo: `NO_CANDIDATES`
  - funcao: "Turiferario"
  - celebracao: referencia a celebracao afetada
  - sugestao: "Adicione qualificacao de Turiferario a pelo menos um acolito"

**CA-CONF-02: INSUFFICIENT_CANDIDATES - Candidatos insuficientes**

- **Dado** que a celebracao requer 2 Ceriferiarios
- **E** apenas 1 acolito e qualificado e esta disponivel
- **Quando** a escala e gerada
- **Entao** o acolito disponivel e atribuido a 1 dos 2 slots
- **E** o segundo slot fica vazio
- **E** e criado um registro de conflito com:
  - tipo: `INSUFFICIENT_CANDIDATES`
  - necessarios: 2
  - disponiveis: 1
  - sugestao: "Apenas 1 de 2 Ceriferiarios necessarios pode ser atribuido. Considere qualificar mais acolitos."

**CA-CONF-03: ALL_UNAVAILABLE - Todos indisponiveis**

- **Dado** que 3 acolitos sao qualificados para Cruciferario
- **E** todos os 3 marcaram indisponibilidade para a data da celebracao
- **Quando** a escala e gerada
- **Entao** o slot fica vazio
- **E** e criado um registro de conflito com:
  - tipo: `ALL_UNAVAILABLE`
  - qualificados: 3
  - indisponiveis: 3
  - sugestao: "Todos os 3 acolitos qualificados para Cruciferario estao indisponiveis em DD/MM. Verifique disponibilidades ou considere trocar a data."

**CA-CONF-04: OVERLOAD_SINGLE_CANDIDATE - Sobrecarga de unico candidato**

- **Dado** que apenas 1 acolito ("Maria") e qualificado para Turiferario
- **E** "Maria" ja foi atribuida a 5 ou mais celebracoes no periodo
- **Quando** "Maria" e atribuida novamente
- **Entao** a atribuicao e feita (nao ha outro candidato)
- **E** e criado um registro de conflito com:
  - tipo: `OVERLOAD_SINGLE_CANDIDATE`
  - acolito: "Maria"
  - atribuicoes_no_periodo: 6
  - sugestao: "Maria esta sobrecarregada com 6 atribuicoes como Turiferario. Considere qualificar mais acolitos para esta funcao."

**CA-CONF-05: QUALIFICATION_GAP - Funcao sem acolitos**

- **Dado** que a funcao "Naviculario" existe no sistema
- **E** 0 acolitos possuem qualificacao para ela
- **Quando** a escala e gerada para celebracoes que requerem Naviculario
- **Entao** e criado um registro de conflito com:
  - tipo: `QUALIFICATION_GAP`
  - funcao: "Naviculario"
  - acolitos_qualificados: 0
  - sugestao: "Nenhum acolito e qualificado para Naviculario. Promova treinamento ou adicione qualificacao a acolitos existentes."

---

## 5. Publicacao da Escala

### 5.1 Publicar Escala

**CA-PUB-01: Publicar escala completa**

- **Dado** que a escala DRAFT tem todos os slots preenchidos (sem lacunas)
- **Quando** o gestor solicita publicacao
- **Entao** o status muda de DRAFT para PUBLISHED
- **E** um `publicToken` unico e gerado (UUID ou hash)
- **E** a data de publicacao e registrada
- **E** a API retorna status 200 com o publicToken e URL publica

**CA-PUB-02: Publicar escala com lacunas aceitas explicitamente**

- **Dado** que a escala DRAFT tem 2 slots vazios (conflitos registrados)
- **E** o gestor marca esses slots como "aceito com lacuna"
- **Quando** solicita publicacao
- **Entao** a escala e publicada normalmente
- **E** os slots vazios aparecem como "A definir" na visao publica

**CA-PUB-03: Bloquear publicacao com lacunas nao aceitas**

- **Dado** que a escala DRAFT tem slots vazios sem aceitacao explicita
- **Quando** o gestor tenta publicar
- **Entao** a API retorna status 400 com mensagem listando os slots pendentes
- **E** a escala permanece como DRAFT

---

### 5.2 Visao Publica

**CA-PUB-04: Acesso publico via token**

- **Dado** que a escala foi publicada com publicToken "abc123"
- **Quando** qualquer pessoa acessa a URL publica com esse token (GET /api/public/schedule/abc123)
- **Entao** a API retorna status 200 com:
  - celebracoes com data, horario e tipo
  - atribuicoes com primeiro nome do acolito e funcao
  - **sem** email, telefone, sobrenome ou qualquer dado sensivel

**CA-PUB-05: Token invalido**

- **Dado** que o token "xyz999" nao corresponde a nenhuma escala
- **Quando** tenta acessar a URL publica
- **Entao** a API retorna status 404 com mensagem "Escala nao encontrada"

---

## 6. Administracao

### 6.1 Gestao de Roles

**CA-ADM-01: ADMIN altera role de usuario**

- **Dado** que o admin esta autenticado
- **Quando** altera o role do usuario "Maria" de ACOLYTE para COORDINATOR
- **Entao** o role e atualizado no banco
- **E** a API retorna status 200 com o perfil atualizado

**CA-ADM-02: Impedir remocao do ultimo ADMIN**

- **Dado** que existe apenas 1 usuario com role ADMIN no sistema
- **Quando** esse admin (ou outro admin) tenta alterar o role desse unico admin para outro valor
- **Entao** a API retorna status 400 com mensagem "Nao e possivel remover o ultimo administrador do sistema. Promova outro usuario a ADMIN antes de alterar este."
- **E** o role permanece ADMIN

**CA-ADM-03: Apenas ADMIN altera roles**

- **Dado** que o usuario autenticado tem role ACOLYTE ou COORDINATOR
- **Quando** tenta alterar o role de qualquer usuario
- **Entao** a API retorna status 403

---

### 6.2 Auditoria

**CA-ADM-04: Toda mutacao gera log de auditoria**

- **Dado** que qualquer operacao de escrita ocorre no sistema (create, update, delete)
- **Entao** um registro de auditoria e criado contendo:
  - `userId`: id do usuario que executou a acao
  - `action`: tipo da acao (ex.: "USER_ROLE_CHANGED", "SCHEDULE_PUBLISHED", "AVAILABILITY_UPDATED")
  - `timestamp`: data e hora em UTC
  - `details`: objeto JSON com dados relevantes (valor anterior, valor novo, entidade afetada)

**CA-ADM-05: Logs de auditoria sao imutaveis**

- **Dado** que um log de auditoria foi criado
- **Quando** qualquer usuario (inclusive ADMIN) tenta alterar ou deletar o registro
- **Entao** a operacao e rejeitada
- **E** os logs so permitem leitura e insercao (append-only)

---

## 7. Criterios de Performance

### 7.1 Geracao de Escala

**CA-PERF-01: Tempo de geracao dentro do limite**

- **Dado** 50 acolitos cadastrados, 20 celebracoes no periodo e 9 funcoes liturgicas configuradas
- **Quando** a geracao da escala e solicitada
- **Entao** o processamento completo (incluindo deteccao de conflitos) deve terminar em menos de 5 segundos
- **E** o tempo e medido do inicio do request ate o retorno da resposta ao cliente

### 7.2 Operacoes CRUD

**CA-PERF-02: Tempo de resposta para operacoes simples**

- **Dado** qualquer operacao CRUD (criar, ler, atualizar, deletar) em qualquer endpoint
- **Quando** o request e processado
- **Entao** a resposta deve ser retornada em menos de 200ms (p95)
- **E** isso inclui validacao, persistencia e serializacao

### 7.3 Pagina Publica

**CA-PERF-03: Carregamento da pagina publica**

- **Dado** que um visitante acessa a URL publica da escala
- **Quando** a pagina carrega
- **Entao** o conteudo completo deve estar visivel em menos de 1 segundo
- **E** isso inclui tempo de carregamento do HTML, CSS e dados da API

---

## Matriz de Rastreabilidade

| Criterio | Funcionalidade | Prioridade |
|----------|---------------|------------|
| CA-AUTH-01 a 04 | Registro | Alta |
| CA-AUTH-05 a 07 | Login | Alta |
| CA-AUTH-08 a 09 | Logout | Alta |
| CA-AUTH-10 a 11 | Perfil | Media |
| CA-DISP-01 a 03 | Disponibilidade (acolito) | Alta |
| CA-DISP-04 a 05 | Disponibilidade (guardian) | Alta |
| CA-CEL-01 a 03 | Criar celebracao | Alta |
| CA-CEL-04 a 05 | Requisitos de funcoes | Media |
| CA-ALGO-01 a 04 | Geracao basica | Critica |
| CA-ALGO-05 a 06 | Balanceamento | Alta |
| CA-ALGO-07 a 08 | Travamento | Alta |
| CA-CONF-01 a 05 | Conflitos | Critica |
| CA-PUB-01 a 03 | Publicacao | Alta |
| CA-PUB-04 a 05 | Visao publica | Media |
| CA-ADM-01 a 03 | Gestao de roles | Alta |
| CA-ADM-04 a 05 | Auditoria | Alta |
| CA-PERF-01 a 03 | Performance | Alta |
