## Objetivo

A UI do menu **Cadernos** (`/cadernos`) e os hooks (`useCadernoPastas`, `useCadernos`, `useCadernoNotas`) já existem e apontam para 3 tabelas que ainda não existem no banco:

- `vm_caderno_pastas`
- `vm_cadernos`
- `vm_caderno_notas`

A única coisa que falta é criar essas tabelas com RLS e GRANTs corretos. Nenhuma mudança de código é necessária — o frontend já está pronto.

## Estrutura das tabelas

**`vm_caderno_pastas`** (pasta organizadora)
- `id`, `user_id` (FK `auth.users`), `nome` (text)
- `criado_em`, `atualizado_em`

**`vm_cadernos`** (caderno, opcionalmente dentro de uma pasta)
- `id`, `user_id`, `pasta_id` (FK → `vm_caderno_pastas`, nullable, `ON DELETE SET NULL` para que excluir a pasta não apague os cadernos — bate com o aviso da UI "Os cadernos ficarão sem pasta")
- `titulo` (text)
- `criado_em`, `atualizado_em`

**`vm_caderno_notas`** (anotação dentro de um caderno)
- `id`, `caderno_id` (FK → `vm_cadernos`, `ON DELETE CASCADE`), `user_id`
- `artigo_id` (FK → `vm_artigos`, nullable, `ON DELETE SET NULL`) — usado quando a anotação vem do Vade Mecum
- `conteudo_html` (text)
- `tags` (text[]) — valores usados pela UI: `Legislação`, `Questões`, `Flashcards`, `Julgados`, `Livre`
- `criado_em`, `atualizado_em`

## Segurança

- `ENABLE ROW LEVEL SECURITY` nas 3 tabelas.
- Políticas: cada usuário só lê/escreve/atualiza/deleta linhas onde `user_id = auth.uid()`.
- GRANTs: `SELECT, INSERT, UPDATE, DELETE` para `authenticated`; `ALL` para `service_role`. Sem grant para `anon` (conteúdo privado).
- Trigger `update_updated_at_column` para manter `atualizado_em` nas 3 tabelas.
- Índices em `user_id`, `pasta_id` (cadernos) e `caderno_id` (notas) para listagens rápidas.

## Entrega

Uma única migração criando as 3 tabelas, índices, RLS, políticas, GRANTs e triggers de `atualizado_em`. Após aprovação, o menu Cadernos passa a funcionar sem mais alterações.
