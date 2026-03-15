

# Plano: Corrigir comentários não registrados

## Problema
A query dos comentários faz join com `profiles` (`.select("*, profiles(...)")`), mas a tabela `question_comments` **não tem foreign key para `profiles`** — só referencia `auth.users`. O PostgREST exige FK para permitir joins, retornando erro 400.

O mesmo problema existe em `comment_votes` que não tem FK para `question_comments`.

## Solução
Uma migration SQL para adicionar as foreign keys faltantes:

1. `question_comments.user_id` → `profiles.id` (permite o join com profiles)
2. `comment_votes.comment_id` → `question_comments.id` (permite queries de votos)
3. `comment_votes.user_id` → `profiles.id` (consistência)

Nenhuma alteração de código é necessária — o frontend já está correto, apenas o banco precisa das FKs.

