# 14. Backlog Inicial

Backlog de user stories do Liturgix, organizadas por fase de implementacao. Cada historia possui identificador unico, descricao no formato padrao, prioridade e estimativa de complexidade.

**Legenda de prioridade:**

| Sigla | Significado |
|-------|-------------|
| Obrigatorio | Funcionalidade essencial para o MVP |
| Desejavel | Agrega valor significativo, mas nao bloqueia lancamento |
| Opcional | Nice-to-have, pode ser postergado |

**Legenda de complexidade:**

| Tamanho | Descricao |
|---------|-----------|
| P | Pequeno — ate 3 story points |
| M | Medio — 5 story points |
| G | Grande — 8+ story points |

---

## Fase 1 — Fundacao

Cadastro, autenticacao e estrutura basica de navegacao.

| ID | Titulo | Descricao | Prioridade | Complexidade |
|----|--------|-----------|------------|--------------|
| US-001 | Cadastro de acolito | Como visitante, quero me cadastrar como acolito informando nome, e-mail e senha, para ter acesso ao sistema e visualizar minhas escalas. | Obrigatorio | M |
| US-002 | Cadastro de responsavel | Como visitante, quero me cadastrar como responsavel de um acolito menor de idade, para gerenciar a disponibilidade dele. | Obrigatorio | M |
| US-003 | Login com e-mail e senha | Como usuario cadastrado, quero fazer login com e-mail e senha, para acessar as funcionalidades do sistema de acordo com meu perfil. | Obrigatorio | P |
| US-004 | Logout (invalidar token) | Como usuario autenticado, quero fazer logout e invalidar meu token de sessao, para garantir que ninguem acesse minha conta apos encerrar o uso. | Obrigatorio | P |
| US-005 | Visualizar perfil proprio | Como usuario autenticado, quero visualizar meus dados de perfil (nome, e-mail, papel), para conferir e manter minhas informacoes atualizadas. | Obrigatorio | P |
| US-006 | Navegacao lateral por papel | Como usuario autenticado, quero ver um menu lateral (sidebar) com opcoes filtradas conforme meu papel (admin, coordenador, acolito, responsavel), para acessar rapidamente apenas as areas relevantes para mim. | Obrigatorio | M |
| US-007 | Rotas protegidas por papel | Como sistema, quero restringir o acesso a rotas conforme o papel do usuario, para garantir que apenas usuarios autorizados acessem funcionalidades restritas. | Obrigatorio | M |

---

## Fase 2 — Dominio Central

Funcoes liturgicas, gestao de acolitos, disponibilidade e celebracoes.

| ID | Titulo | Descricao | Prioridade | Complexidade |
|----|--------|-----------|------------|--------------|
| US-008 | Listar funcoes liturgicas | Como administrador, quero listar todas as funcoes liturgicas cadastradas (ex.: turiferario, cerimoniario, acolitado), para ter visao geral das funcoes disponiveis. | Obrigatorio | P |
| US-009 | Criar funcao liturgica | Como administrador, quero cadastrar uma nova funcao liturgica com nome e descricao, para ampliar as opcoes de atribuicao nas escalas. | Obrigatorio | P |
| US-010 | Editar/desativar funcao liturgica | Como administrador, quero editar os dados ou desativar uma funcao liturgica, para manter o cadastro atualizado sem perder historico. | Obrigatorio | P |
| US-011 | Listar acolitos | Como coordenador, quero listar todos os acolitos cadastrados com filtros por nome e status, para gerenciar o grupo de forma eficiente. | Obrigatorio | M |
| US-012 | Visualizar detalhe do acolito | Como coordenador, quero ver o perfil completo de um acolito (dados pessoais, funcoes habilitadas, disponibilidade), para tomar decisoes informadas sobre escala. | Obrigatorio | P |
| US-013 | Atribuir funcoes a acolito | Como coordenador, quero atribuir uma ou mais funcoes liturgicas a um acolito, para definir quais papeis ele pode exercer nas celebracoes. | Obrigatorio | M |
| US-014 | Visualizar minhas funcoes | Como acolito, quero ver quais funcoes liturgicas estao atribuidas a mim, para saber em quais papeis posso ser escalado. | Obrigatorio | P |
| US-015 | Marcar datas indisponiveis | Como acolito, quero marcar datas em que nao estarei disponivel, para que o sistema nao me escale nesses dias. | Obrigatorio | M |
| US-016 | Visualizar calendario de disponibilidade | Como acolito, quero ver meu calendario com as datas marcadas como indisponiveis, para ter controle sobre minha agenda. | Obrigatorio | M |
| US-017 | Responsavel gerencia disponibilidade | Como responsavel, quero gerenciar a disponibilidade do(s) acolito(s) vinculado(s) a mim, para garantir que a escala respeite os compromissos do menor. | Obrigatorio | M |
| US-018 | Listar celebracoes | Como coordenador, quero listar todas as celebracoes cadastradas com filtros por data e tipo, para ter visao geral da agenda liturgica. | Obrigatorio | M |
| US-019 | Criar celebracao | Como coordenador, quero criar uma celebracao informando data, horario, tipo e local, para alimentar a agenda liturgica. | Obrigatorio | M |
| US-020 | Editar celebracao | Como coordenador, quero editar os dados de uma celebracao existente, para corrigir informacoes ou atualizar detalhes. | Obrigatorio | P |
| US-021 | Definir requisitos de funcoes por celebracao | Como coordenador, quero definir quantos acolitos sao necessarios para cada funcao em uma celebracao (ex.: 2 turiferarios, 1 cerimoniario), para que o motor de escala saiba quantos slots preencher. | Obrigatorio | M |
| US-022 | Excluir celebracao (soft delete) | Como coordenador, quero excluir logicamente uma celebracao, para remove-la da agenda ativa sem perder o registro historico. | Obrigatorio | P |

---

## Fase 3 — Motor de Escala

Geracao automatica de escalas, resolucao de conflitos e auditoria de pontuacao.

| ID | Titulo | Descricao | Prioridade | Complexidade |
|----|--------|-----------|------------|--------------|
| US-023 | Gerar escala automaticamente | Como coordenador, quero gerar uma escala automatica para um periodo selecionado, para distribuir acolitos nas celebracoes respeitando disponibilidade, funcoes habilitadas e equilibrio de frequencia. | Obrigatorio | G |
| US-024 | Visualizar escala gerada | Como coordenador, quero visualizar a escala gerada em formato de tabela/calendario com as atribuicoes por celebracao, para revisar o resultado antes de publicar. | Obrigatorio | M |
| US-025 | Indicadores de conflito na escala | Como coordenador, quero ver indicadores visuais de conflito (ex.: acolito indisponivel, funcao sem cobertura), para identificar rapidamente problemas na escala. | Obrigatorio | M |
| US-026 | Resolver conflito por atribuicao manual | Como coordenador, quero substituir manualmente a atribuicao de um slot com conflito, para corrigir a escala sem precisar regera-la por completo. | Obrigatorio | M |
| US-027 | Travar/destravar atribuicao | Como coordenador, quero travar uma atribuicao especifica para que ela nao seja alterada em re-geracoes, para preservar decisoes manuais. | Obrigatorio | P |
| US-028 | Trocar acolito entre atribuicoes | Como coordenador, quero trocar (swap) dois acolitos entre atribuicoes na mesma celebracao ou entre celebracoes, para ajustar a escala de forma rapida. | Desejavel | M |
| US-029 | Regerar escala preservando travas | Como coordenador, quero regerar a escala mantendo as atribuicoes travadas intactas, para refinar apenas os slots abertos. | Obrigatorio | G |
| US-030 | Visualizar auditoria de pontuacao | Como coordenador, quero ver o detalhamento da pontuacao (score) que levou a cada atribuicao, para entender e justificar as decisoes do algoritmo. | Desejavel | M |

---

## Fase 4 — Distribuicao

Publicacao e compartilhamento da escala.

| ID | Titulo | Descricao | Prioridade | Complexidade |
|----|--------|-----------|------------|--------------|
| US-031 | Publicar escala | Como coordenador, quero publicar uma escala revisada, para que ela fique visivel para todos os acolitos e responsaveis. | Obrigatorio | M |
| US-032 | Gerar link publico compartilhavel | Como coordenador, quero gerar um link publico para a escala publicada, para compartilhar via WhatsApp ou outros meios sem exigir login. | Desejavel | P |
| US-033 | Visualizar escala publica (sem autenticacao) | Como visitante com o link, quero visualizar a escala publicada sem precisar de login, para consultar minhas atribuicoes de forma pratica. | Desejavel | P |
| US-034 | Filtrar escala por data | Como usuario, quero filtrar a escala por intervalo de datas, para encontrar rapidamente as celebracoes de um periodo especifico. | Obrigatorio | P |
| US-035 | Filtrar escala por pessoa | Como usuario, quero filtrar a escala por nome de acolito, para ver todas as atribuicoes de uma pessoa especifica. | Desejavel | P |
| US-036 | Filtrar escala por funcao | Como usuario, quero filtrar a escala por funcao liturgica, para ver quem esta escalado em cada funcao. | Desejavel | P |

---

## Fase 5 — Responsaveis e Administracao

Vinculo de responsaveis, gestao de usuarios e auditoria.

| ID | Titulo | Descricao | Prioridade | Complexidade |
|----|--------|-----------|------------|--------------|
| US-037 | Vincular responsavel a acolito | Como coordenador, quero vincular um responsavel cadastrado a um acolito menor de idade, para que o responsavel possa gerenciar disponibilidade e acompanhar escalas. | Obrigatorio | M |
| US-038 | Responsavel visualiza escalas dos vinculados | Como responsavel, quero ver as escalas dos acolitos vinculados a mim, para acompanhar os compromissos liturgicos deles. | Obrigatorio | P |
| US-039 | Admin gerencia usuarios e papeis | Como administrador, quero listar, editar papeis e desativar usuarios, para manter o controle de acesso ao sistema. | Obrigatorio | M |
| US-040 | Impedir remocao do ultimo admin | Como sistema, quero impedir que o ultimo usuario administrador seja removido ou rebaixado, para garantir que sempre haja ao menos um admin no sistema. | Obrigatorio | P |
| US-041 | Visualizar log de auditoria | Como administrador, quero visualizar um log de acoes realizadas no sistema (criacao, edicao, exclusao, publicacao), para rastrear alteracoes e manter transparencia. | Desejavel | G |
| US-042 | Visualizar estatisticas do sistema | Como administrador, quero ver um painel com estatisticas (total de acolitos, celebracoes no mes, taxa de conflitos, frequencia media), para acompanhar a saude operacional do sistema. | Desejavel | M |

---

## Fase 6 — Polimento

Responsividade, acessibilidade, testes e documentacao final.

| ID | Titulo | Descricao | Prioridade | Complexidade |
|----|--------|-----------|------------|--------------|
| US-043 | Layout responsivo para mobile | Como usuario, quero acessar o sistema pelo celular com layout adaptado, para consultar escalas e gerenciar disponibilidade em qualquer dispositivo. | Desejavel | G |
| US-044 | Acessibilidade (ARIA e navegacao por teclado) | Como usuario com necessidades de acessibilidade, quero que o sistema siga padroes ARIA e suporte navegacao por teclado, para utilizar todas as funcionalidades sem depender exclusivamente do mouse. | Desejavel | G |
| US-045 | Testes E2E para fluxos criticos | Como equipe de desenvolvimento, quero ter testes end-to-end cobrindo os fluxos criticos (login, geracao de escala, publicacao), para garantir estabilidade em deploys futuros. | Desejavel | G |
| US-046 | Documentacao final | Como equipe de desenvolvimento, quero ter documentacao tecnica e de usuario atualizada, para facilitar a manutencao e onboarding de novos colaboradores. | Opcional | M |

---

## Resumo por Fase

| Fase | Stories | Obrigatorio | Desejavel | Opcional |
|------|---------|-------------|-----------|----------|
| 1 — Fundacao | 7 | 7 | 0 | 0 |
| 2 — Dominio Central | 15 | 15 | 0 | 0 |
| 3 — Motor de Escala | 8 | 6 | 2 | 0 |
| 4 — Distribuicao | 6 | 2 | 4 | 0 |
| 5 — Responsaveis e Admin | 6 | 4 | 2 | 0 |
| 6 — Polimento | 4 | 0 | 3 | 1 |
| **Total** | **46** | **34** | **11** | **1** |

---

## Resumo por Complexidade

| Tamanho | Quantidade |
|---------|------------|
| P | 18 |
| M | 22 |
| G | 6 |

---

## Criterios de Aceitacao Globais

Os seguintes criterios se aplicam a todas as user stories:

1. **Validacao de entrada** — Todos os formularios devem validar dados no frontend e no backend.
2. **Feedback visual** — Acoes do usuario devem exibir feedback claro (loading, sucesso, erro).
3. **Autorizacao** — Toda rota de API deve verificar autenticacao e papel do usuario.
4. **Responsividade basica** — Telas devem ser utilizaveis em resolucoes a partir de 360px (refinamento completo na Fase 6).
5. **Testes unitarios** — Logica de negocio critica deve ter cobertura minima de testes.
