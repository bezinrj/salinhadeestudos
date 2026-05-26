# Salinha Juris — Assunto, filtros editáveis e edição

## O que muda

1. **Novo campo `Assunto`** em cada julgado (além da `Matéria`, que hoje é o campo "Área do Direito").
2. **Taxonomia editável** por admin/moderador: listas de Matérias e Assuntos cadastradas no banco, usadas em selects (com possibilidade de criar na hora).
3. **Filtros na lista `/juris`**: por Matéria e por Assunto, além da busca por texto que já existe.
4. **Aba de gestão** dentro de `/juris/admin` para CRUD das Matérias e Assuntos.
5. **Editar julgado**: garantir que admin/moderador acessem `/juris/admin/:id` (o admin já existe, só falta a rota com id e o botão "Editar" no detalhe).

## Banco (1 migração)

- `juris_julgados`: adicionar coluna `assunto text default ''` e renomear semanticamente: continuamos usando `area` como **Matéria** (sem rename para não quebrar nada; só ajustamos rótulos na UI).
- Criar `juris_materias (id, nome unique, created_at)` e `juris_assuntos (id, materia_id fk, nome, created_at, unique(materia_id, nome))`.
- GRANTS + RLS:
  - SELECT autenticado;
  - INSERT/UPDATE/DELETE apenas admin/moderador (`has_role`).
- Pré-popular `juris_materias` com os valores distintos hoje presentes em `juris_julgados.area`.

## Frontend

### `src/pages/JurisAdmin.tsx`
- Trocar o input de "Área do Direito" por **Select de Matéria** (lista vinda de `juris_materias`, com opção "+ Nova matéria" abrindo prompt para criar).
- Adicionar **Select de Assunto** (filtrado pela matéria escolhida, com "+ Novo assunto").
- Salvar `area` (matéria) e `assunto` no julgado.

### `src/pages/Juris.tsx`
- Adicionar dois selects no topo: **Matéria** e **Assunto** (assunto filtra pela matéria escolhida).
- Aplicar filtro client-side sobre a lista carregada (mesma estratégia da busca atual).
- Exibir chip do `assunto` no card além da matéria.

### `src/pages/JurisDetail.tsx`
- Mostrar o `assunto` no cabeçalho.
- Botão "Editar" visível para admin/moderador → navega para `/juris/admin/:id`.

### `src/App.tsx`
- Adicionar rota `/juris/admin/:id` apontando para `JurisAdmin` (a página já trata `useParams().id`).

### Novo: `src/components/juris/JurisTaxonomyManager.tsx`
- Tabelinha simples para CRUD de Matérias e Assuntos.
- Renderizada como uma nova aba/seção dentro de `/juris/admin` quando NÃO há `:id` (modo "novo + gestão").

### `src/types/juris.ts`
- Adicionar `assunto: string` em `JurisJulgado` e `EMPTY_JULGADO`.

## Edge function `juris-generate`
- Pedir à IA que também extraia um `assunto` curto (substantivo do tema, ex.: "Improbidade administrativa"). Incluir no JSON de retorno e no preenchimento do formulário.

## Fora de escopo
- Não muda fluxo do chat IA, nem RLS de `juris_julgados` (já permite edição por admin/mod).
- Não muda preview/Premium lock.

Confirma para eu implementar?