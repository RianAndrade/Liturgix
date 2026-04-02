# Visao Geral do Produto

## 1. Proposito do Sistema

O **Liturgix** e um sistema de geracao automatica de escalas liturgicas para acolitos em paroquias e comunidades eclesiais. Seu proposito central e substituir o processo manual — tipicamente feito em planilhas, grupos de WhatsApp ou cadernos — por uma plataforma digital que garante justica, transparencia e rastreabilidade na distribuicao de funcoes liturgicas.

O sistema permite que:

- **Acolitos** informem sua disponibilidade para celebracoes.
- **Responsaveis** (pais/tutores de acolitos menores) acompanhem e gerenciem a disponibilidade dos acolitos sob sua responsabilidade.
- **Coordenadores** gerem escalas automaticamente com base em regras configuraveis, resolvam conflitos e publiquem escalas finais.
- **Administradores** gerenciem usuarios, funcoes liturgicas, configuracoes do sistema e acessem trilhas de auditoria.
- **Qualquer pessoa** consulte escalas publicadas por meio de links publicos compartilhaveis, sem necessidade de cadastro.

---

## 2. Problema que Resolve

### 2.1. Situacao Atual

Na maioria das paroquias, a escala de acolitos e elaborada manualmente por um coordenador. Este processo apresenta problemas recorrentes:

| Problema | Impacto |
|----------|---------|
| **Distribuicao desigual** | Alguns acolitos servem com muito mais frequencia que outros, gerando insatisfacao e esgotamento |
| **Falta de rastreabilidade** | Nao ha registro historico de quem serviu quando e em qual funcao |
| **Conflitos de disponibilidade** | O coordenador precisa verificar manualmente se cada acolito esta disponivel, frequentemente via mensagens individuais |
| **Tempo excessivo do coordenador** | A elaboracao manual consome horas a cada ciclo, considerando verificacoes de disponibilidade, qualificacoes e equilibrio |
| **Comunicacao fragmentada** | Escalas sao distribuidas por foto de WhatsApp, mural fisico ou boca a boca, gerando confusao e falta de acesso |
| **Sem auditoria** | Quando surgem reclamacoes sobre injustica, nao ha dados para verificar ou refutar |
| **Dificuldade com funcoes especificas** | Acólitos sao escalados para funcoes para as quais nao estao qualificados, ou funcoes ficam sem cobertura |

### 2.2. Solucao Proposta

O Liturgix resolve esses problemas por meio de:

- **Coleta estruturada de disponibilidade**: cada acolito (ou seu responsavel) marca no sistema os dias em que nao pode servir.
- **Geracao automatica com algoritmo justo**: um algoritmo de satisfacao de restricoes com pontuacao ponderada distribui funcoes respeitando indisponibilidades, qualificacoes e equilibrio historico.
- **Trilha de auditoria completa**: cada decisao do algoritmo e registrada — por que um acolito foi escolhido, por que outro foi preterido.
- **Publicacao digital acessivel**: escalas publicadas podem ser consultadas por qualquer pessoa via link compartilhavel, sem necessidade de login.
- **Resolucao guiada de conflitos**: quando o algoritmo nao consegue preencher uma vaga, o sistema apresenta o conflito com descricao legivel e acoes sugeridas para o coordenador.

---

## 3. Publico-alvo

### 3.1. Perfis de Usuario

O sistema define 4 papeis com niveis crescentes de permissao:

| Papel | Descricao | Perfil Tipico |
|-------|-----------|---------------|
| **ACOLYTE** | Acólito que serve nas celebracoes | Jovens e adultos que participam da liturgia; podem ser menores de idade |
| **GUARDIAN** | Responsavel legal de acolitos menores | Pais ou tutores que acompanham a participacao de seus filhos |
| **COORDINATOR** | Coordenador de acolitos da paroquia | Pessoa designada para organizar escalas, geralmente um acolito mais experiente ou lideranca pastoral |
| **ADMIN** | Administrador do sistema | Responsavel tecnico ou pastoral com acesso total ao sistema |

### 3.2. Usuarios Indiretos

Alem dos usuarios cadastrados, ha um publico indireto importante:

- **Fieis e comunidade paroquial**: consultam escalas publicadas para saber quem esta servindo em cada celebracao.
- **Padres e diaconos**: verificam a escala antes das celebracoes.
- **Secretaria paroquial**: pode utilizar o sistema como referencia para comunicados.

Esses usuarios indiretos acessam o sistema exclusivamente pela **pagina publica de escala**, que nao exige autenticacao e exibe apenas o primeiro nome dos acolitos.

---

## 4. Premissas Assumidas

As decisoes de arquitetura e escopo da v1.0 partem das seguintes premissas:

### 4.1. Volume e Escala

| Premissa | Valor |
|----------|-------|
| Numero maximo de acolitos por paroquia | < 100 |
| Numero maximo de celebracoes por mes por paroquia | < 50 |
| Numero maximo de funcoes liturgicas configuradas | < 20 |
| Numero maximo de coordenadores ativos | < 10 |

Esses limites implicam que o algoritmo de geracao pode rodar em tempo linear sem necessidade de otimizacoes de escala (nao ha demanda para centenas de milhares de combinacoes).

### 4.2. Organizacao Eclesial

- O sistema atende a **uma unica paroquia** por instalacao (single-tenant).
- As funcoes liturgicas sao configuraveis, mas o sistema assume **9 funcoes iniciais** como ponto de partida (ex.: turiferario, cerimoniario, cruciferario, ceroferario, etc.).
- Acolitos menores de idade devem estar vinculados a pelo menos um responsavel (GUARDIAN) no sistema.
- Celebracoes seguem padroes recorrentes (missas dominicais, festas, dias santos), mas sao cadastradas individualmente ou em lote.

### 4.3. Infraestrutura e Operacao

- O sistema roda em ambiente Docker Compose (auto-hospedado ou em VPS).
- Nao ha requisito de alta disponibilidade (uptime 99.9%) — a aplicacao pode ter janelas de manutencao.
- A geracao de escalas e uma operacao relativamente rara (semanal ou quinzenal) e pode ser assincrona.
- O acesso publico as escalas deve funcionar sem autenticacao, por meio de tokens compartilhaveis em links.
- Nao ha integracao com sistemas externos na v1.0 (sem Google Calendar, sem WhatsApp, sem e-mail automatico).

### 4.4. Experiencia do Usuario

- Os usuarios primarios (acolitos e coordenadores) tem familiaridade basica com smartphones e navegadores web.
- A interface deve ser responsiva e funcional em dispositivos moveis, pois a maioria dos acolitos acessara pelo celular.
- O idioma da interface e portugues brasileiro; o codigo-fonte e a API usam ingles.

---

## 5. Escopo v1.0

### 5.1. Dentro do Escopo

A versao 1.0 do Liturgix contempla as seguintes capacidades:

**Autenticacao e Autorizacao**
- Cadastro de acolitos e responsaveis (auto-registro)
- Login por e-mail e senha com JWT
- Logout com invalidacao de token via lista negra no Redis
- 4 papeis com controle de acesso baseado em funcao (RBAC)
- Coordenadores e administradores criados manualmente (nao ha auto-registro para esses papeis)

**Gestao de Acolitos**
- Perfil do acolito com dados pessoais
- Cadastro de qualificacoes (funcoes liturgicas que o acolito pode exercer)
- Calendario de indisponibilidade (marcar/desmarcar datas)
- Historico de servicos prestados

**Vinculo Responsavel-Acolito**
- Vinculacao de acolitos menores a responsaveis
- Responsavel gerencia disponibilidade dos acolitos vinculados

**Gestao de Celebracoes**
- CRUD de celebracoes com data, horario, tipo e local
- Definicao de funcoes necessarias por celebracao (ex.: 2 ceroferarios, 1 turiferario)

**Geracao Automatica de Escalas**
- Algoritmo de satisfacao de restricoes (greedy constraint-satisfaction)
- Pontuacao ponderada com 3 criterios: equilibrio de contagem (50%), rotacao de funcao (30%), intervalo entre servicos (20%)
- Pesos configuraveis por paroquia
- Deteccao e relatorio de conflitos (5 tipos)
- Vagas nao preenchidas ficam marcadas para resolucao manual
- Trilha de auditoria completa por vaga

**Resolucao de Conflitos**
- Interface para coordenador resolver vagas nao preenchidas
- Atribuicao e substituicao manual de acolitos
- Travamento de atribuicoes para preservar ajustes manuais durante re-geracao

**Publicacao e Consulta**
- Transicao de status: DRAFT -> PUBLISHED -> ARCHIVED
- Geracao de token compartilhavel para acesso publico
- Pagina publica sem autenticacao (exibe apenas primeiro nome)
- Visualizacoes por data, por pessoa e por funcao

**Administracao**
- Gestao de usuarios e papeis
- CRUD de funcoes liturgicas (ativar/desativar)
- Log de auditoria global
- Estatisticas de uso

### 5.2. Fora do Escopo (v1.0)

Os seguintes itens ficam explicitamente fora da primeira versao:

| Item | Justificativa |
|------|---------------|
| Multi-tenancy (multiplas paroquias) | Complexidade de isolamento de dados; v1.0 atende uma paroquia |
| Notificacoes por e-mail ou push | Requer servico adicional de e-mail/push; escalas sao consultadas proativamente |
| Integracao com Google Calendar | Escopo de integracao externa; pode ser adicionado posteriormente |
| Integracao com WhatsApp | Requer API paga e aprovacao do Meta; fora do escopo inicial |
| Modo escuro | Prioridade baixa; interface sera apenas modo claro |
| Aplicativo mobile nativo | A interface web responsiva atende o caso de uso mobile |
| Importacao/exportacao de dados (CSV, PDF) | Pode ser adicionado em versao futura |
| Escalas recorrentes automaticas | v1.0 gera escalas sob demanda; recorrencia automatica e complexidade adicional |
| Troca entre acolitos (self-service) | Acolitos nao podem trocar entre si; apenas coordenador faz substituicoes |
| Preferencias de funcao do acolito | Acolitos nao escolhem funcao preferida; algoritmo decide com base em equilibrio |
| Historico de presenca/ausencia | O sistema registra escalas, nao presenca real; controle de presenca e manual |
| Internacionalizacao (i18n) | Interface apenas em portugues brasileiro |

### 5.3. Stack Tecnica v1.0

| Camada | Tecnologia |
|--------|------------|
| Servidor API | Fastify 5 (TypeScript) |
| ORM | Prisma |
| Validacao | Zod |
| Autenticacao | JWT via @fastify/jwt + bcrypt |
| Frontend | React 19 + Vite 6 + React Router |
| Estilo | Tailwind CSS + shadcn/ui |
| Banco de dados | PostgreSQL 16 |
| Cache e fila | Redis 7 |
| Worker assincrono | Celery (Python 3.12) |
| Infraestrutura | Docker Compose |

### 5.4. Criterios de Sucesso da v1.0

A versao 1.0 sera considerada completa quando:

1. Um coordenador conseguir gerar uma escala para um mes inteiro em menos de 30 segundos.
2. A escala gerada respeitar todas as restricoes rigidas (sem duplicatas, sem conflitos de disponibilidade, sem funcoes nao habilitadas).
3. A distribuicao de servicos entre acolitos tiver desvio padrao inferior a 2 servicos no periodo.
4. Conflitos nao resolvidos automaticamente forem apresentados com descricao clara e acoes sugeridas.
5. A escala publicada for acessivel por link publico sem necessidade de login.
6. A trilha de auditoria permitir explicar qualquer decisao do algoritmo.
7. A interface funcionar em dispositivos moveis (viewport >= 360px).
