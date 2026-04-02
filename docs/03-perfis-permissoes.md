# 03 - Perfis e Permissoes

## 1. Visao Geral

O Liturgix utiliza um modelo de controle de acesso baseado em papeis (RBAC - Role-Based Access Control) com quatro niveis hierarquicos. Alem das permissoes por papel, regras de escopo em nivel de linha (row-level security) garantem que cada usuario acesse apenas os dados pertinentes ao seu contexto.

---

## 2. Papeis do Sistema

### 2.1 ACOLYTE (Acolito)

Perfil basico do sistema, representando um coroinha/acolito cadastrado na paroquia.

**Capacidades:**
- Visualizar e editar o proprio perfil
- Gerenciar a propria disponibilidade (informar dias/horarios disponiveis)
- Visualizar as funcoes atribuidas a si
- Consultar escalas publicadas
- Consultar o proprio historico de participacao

### 2.2 GUARDIAN (Responsavel)

Pai, mae ou responsavel legal de acolitos menores de idade. Vinculado a um ou mais acolitos.

**Capacidades:**
- Tudo que o ACOLYTE pode fazer sobre os seus proprios dados
- Visualizar e gerenciar a disponibilidade dos acolitos vinculados
- Consultar escalas e historico dos acolitos vinculados
- **Restricao:** nao pode se autopromover a coordenador

### 2.3 COORDINATOR (Coordenador)

Coordenador pastoral da paroquia, responsavel pela gestao operacional das escalas.

**Capacidades:**
- Gerenciar todos os acolitos (cadastro, edicao, remocao)
- Gerenciar celebracoes (criar, editar, remover)
- Gerar e publicar escalas
- Atribuir funcoes aos acolitos
- Vincular responsaveis a acolitos menores
- Realizar trocas e reatribuicoes manuais na escala
- Consultar logs de auditoria das escalas

### 2.4 ADMIN (Administrador do Sistema)

Administrador com acesso total ao sistema. Possui todas as permissoes do coordenador, acrescidas de funcoes administrativas globais.

**Capacidades:**
- Todas as permissoes do COORDINATOR
- Gerenciamento de usuarios (listar, criar, editar, remover)
- Alterar papeis de qualquer usuario
- CRUD completo de funcoes liturgicas
- Acesso ao log de auditoria global
- Consultar estatisticas do sistema
- Configurar parametros globais do sistema

**Protecao do ultimo ADMIN:** o sistema impede a remocao ou rebaixamento do ultimo usuario com papel ADMIN. Essa regra garante que sempre exista ao menos um administrador capaz de gerenciar o sistema. Qualquer tentativa de remover o papel ADMIN do ultimo administrador deve retornar erro `403 Forbidden` com mensagem explicativa.

---

## 3. Matriz RBAC

Legenda: **S** = permitido | **--** = negado | **P** = parcial (ver regras de escopo na secao 4)

### 3.1 Autenticacao

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|------|---------|----------|-------------|-------|
| Registrar-se (register) | S | S | -- | -- |
| Login | S | S | S | S |
| Logout | S | S | S | S |
| Ver perfil proprio (me) | S | S | S | S |

> Coordenadores e admins sao criados por um ADMIN existente; nao ha auto-registro para esses papeis.

### 3.2 Usuarios

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|------|---------|----------|-------------|-------|
| Listar usuarios | -- | -- | -- | S |
| Ver usuario | -- | -- | -- | S |
| Editar usuario | -- | -- | -- | S |
| Remover usuario | -- | -- | -- | S |
| Alterar papel | -- | -- | -- | S |

### 3.3 Acolitos

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|------|---------|----------|-------------|-------|
| Listar acolitos | -- | P | S | S |
| Ver acolito | P | P | S | S |
| Disponibilidade - leitura | P | P | S | S |
| Disponibilidade - escrita | P | P | S | S |
| Funcoes - leitura | P | P | S | S |
| Funcoes - escrita | -- | -- | S | S |
| Historico | P | P | S | S |

### 3.4 Responsaveis (Guardians)

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|------|---------|----------|-------------|-------|
| Listar responsaveis | -- | -- | S | S |
| Ver vinculados | -- | P | S | S |
| Vincular acolito | -- | -- | S | S |

### 3.5 Celebracoes

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|------|---------|----------|-------------|-------|
| Listar celebracoes | S | S | S | S |
| Ver celebracao | S | S | S | S |
| Criar celebracao | -- | -- | S | S |
| Editar celebracao | -- | -- | S | S |
| Remover celebracao | -- | -- | S | S |
| Gerenciar requisitos | -- | -- | S | S |

### 3.6 Escalas

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|------|---------|----------|-------------|-------|
| Listar escalas | P | P | S | S |
| Ver escala | P | P | S | S |
| Gerar escala | -- | -- | S | S |
| Editar escala | -- | -- | S | S |
| Publicar escala | -- | -- | S | S |
| Atribuicao manual | -- | -- | S | S |
| Solicitar troca | P | P | S | S |
| Remover atribuicao | -- | -- | S | S |
| Auditoria da escala | -- | -- | S | S |

### 3.7 Area Publica

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN | Anonimo |
|------|---------|----------|-------------|-------|---------|
| Ver escala publicada | S | S | S | S | S |

> A escala publicada e acessivel sem autenticacao para facilitar a consulta por qualquer membro da comunidade.

### 3.8 Administracao

| Acao | ACOLYTE | GUARDIAN | COORDINATOR | ADMIN |
|------|---------|----------|-------------|-------|
| Listar usuarios | -- | -- | -- | S |
| Alterar papel de usuario | -- | -- | -- | S |
| Gerenciar funcoes (CRUD) | -- | -- | -- | S |
| Log de auditoria global | -- | -- | -- | S |
| Estatisticas | -- | -- | -- | S |
| Configuracao do sistema | -- | -- | -- | S |

---

## 4. Regras de Escopo (Row-Level Security)

Alem da matriz RBAC que define **o que** cada papel pode fazer, regras de escopo definem **sobre quais registros** a acao se aplica. Essas regras sao aplicadas em nivel de consulta ao banco de dados.

### 4.1 ACOLYTE

| Recurso | Escopo |
|---------|--------|
| Perfil | Apenas o proprio registro |
| Disponibilidade | Apenas a propria |
| Funcoes atribuidas | Apenas as proprias |
| Historico | Apenas o proprio |
| Escalas | Apenas escalas publicadas onde esta escalado |
| Trocas | Apenas pode solicitar troca das proprias atribuicoes |

### 4.2 GUARDIAN

| Recurso | Escopo |
|---------|--------|
| Perfil | Proprio + perfis dos acolitos vinculados |
| Disponibilidade | Propria + dos acolitos vinculados (leitura e escrita) |
| Funcoes atribuidas | Dos acolitos vinculados (somente leitura) |
| Historico | Dos acolitos vinculados |
| Escalas | Escalas publicadas onde os acolitos vinculados estao escalados |
| Trocas | Pode solicitar troca em nome dos acolitos vinculados |
| Listagem de acolitos | Apenas os acolitos vinculados a si |

### 4.3 COORDINATOR

| Recurso | Escopo |
|---------|--------|
| Acolitos | Todos os acolitos da paroquia |
| Celebracoes | Todas |
| Escalas | Todas (rascunho e publicadas) |
| Responsaveis | Todos |
| Auditoria | Logs relacionados a escalas e acolitos |

### 4.4 ADMIN

| Recurso | Escopo |
|---------|--------|
| Todos os recursos | Sem restricao de escopo |
| Auditoria | Log global completo |
| Usuarios | Todos, incluindo outros admins |

---

## 5. Regras de Negocio Complementares

### 5.1 Protecao do Ultimo ADMIN

```
SE usuario.papel == ADMIN
  E contagem(usuarios com papel ADMIN) == 1
  E acao IN [remover_usuario, rebaixar_papel]
ENTAO
  REJEITAR com HTTP 403
  MENSAGEM: "Nao e possivel remover ou rebaixar o ultimo administrador do sistema."
```

Essa regra deve ser verificada **antes** de qualquer operacao de alteracao de papel ou remocao de usuario com papel ADMIN.

### 5.2 Auto-promocao

- Nenhum usuario pode alterar o proprio papel.
- GUARDIAN nao pode se registrar como COORDINATOR ou ADMIN.
- Apenas um ADMIN pode promover usuarios a COORDINATOR ou ADMIN.

### 5.3 Vinculacao de Responsaveis

- Um GUARDIAN so visualiza dados de acolitos explicitamente vinculados a ele.
- A vinculacao e feita exclusivamente por COORDINATOR ou ADMIN.
- A remocao de vinculo remove imediatamente o acesso do responsavel aos dados daquele acolito.

### 5.4 Escalas em Rascunho vs. Publicadas

- Escalas em estado de **rascunho** sao visiveis apenas para COORDINATOR e ADMIN.
- Apos a **publicacao**, a escala fica visivel para ACOLYTE, GUARDIAN e o publico em geral.
- A publicacao e uma acao irreversivel no sentido de que, uma vez publicada, a escala nao retorna ao estado de rascunho (pode ser editada, mas permanece publica).

---

## 6. Implementacao Tecnica (Diretrizes)

### 6.1 Middleware de Autorizacao

Cada rota da API deve passar por um middleware que:

1. **Autentica** o usuario (verifica token JWT)
2. **Verifica o papel** contra a matriz RBAC
3. **Aplica o filtro de escopo** na consulta ao banco

### 6.2 Estrutura do Token JWT

```json
{
  "sub": "uuid-do-usuario",
  "role": "ACOLYTE | GUARDIAN | COORDINATOR | ADMIN",
  "linked_acolytes": ["uuid-1", "uuid-2"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

O campo `linked_acolytes` e relevante apenas para o papel GUARDIAN e contem os IDs dos acolitos vinculados.

### 6.3 Filtros de Escopo no Banco

```sql
-- Exemplo: buscar disponibilidade com escopo por papel
SELECT * FROM availability
WHERE
  CASE
    WHEN :role = 'ACOLYTE' THEN acolyte_id = :user_id
    WHEN :role = 'GUARDIAN' THEN acolyte_id = ANY(:linked_acolytes)
    WHEN :role IN ('COORDINATOR', 'ADMIN') THEN TRUE
  END;
```

---

## 7. Resumo Visual da Hierarquia

```
ADMIN
  \-- Tudo do COORDINATOR +
      gerenciamento de usuarios, papeis, funcoes, auditoria global, config

COORDINATOR
  \-- Tudo visivel +
      gestao de acolitos, celebracoes, escalas, vinculos, auditoria de escalas

GUARDIAN
  \-- Dados proprios + dados dos acolitos vinculados
      (disponibilidade r/w, funcoes r, historico, escalas publicadas)

ACOLYTE
  \-- Apenas dados proprios
      (perfil, disponibilidade, funcoes, historico, escalas publicadas)
```
