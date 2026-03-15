

# Plano: Curtidas em Perfis + Comentários em Questões

## 1. Banco de dados — duas novas tabelas

### `profile_likes`
Curtidas únicas por usuário em perfis de outros usuários.

```sql
CREATE TABLE public.profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  liked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);
-- RLS: autenticados podem ler todas, inserir/deletar as próprias
```

### `question_comments`
Comentários em questões, com referência ao autor.

```sql
CREATE TABLE public.question_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- RLS: autenticados podem ler todos, inserir os próprios, deletar os próprios
```

### RLS para ambas
- SELECT: qualquer autenticado
- INSERT: `auth.uid() = liker_id` / `auth.uid() = user_id`
- DELETE: `auth.uid() = liker_id` / `auth.uid() = user_id`

### Coluna `likes_count` em `profiles`
Adicionar campo `likes_count integer DEFAULT 0` à tabela `profiles` para exibição rápida no perfil.

## 2. Rota de perfil público `/perfil/:userId`
- Nova rota em `App.tsx` para visualizar perfis de outros usuários
- Reutiliza `Profile.tsx` adaptado: se `userId` do param !== usuário logado, exibe modo leitura com botão de curtir (coração)
- Botão toggle: curtir/descurtir (insert/delete na `profile_likes`)
- Exibe contagem de curtidas

## 3. Componente `QuestionComments`
- Novo componente que busca comentários de `question_comments` filtrado por `question_id`
- Exibe avatar, nome (link para `/perfil/:userId`), texto e data
- Input para adicionar comentário
- Botão de deletar nos comentários do próprio usuário
- Join com `profiles` para obter `username`, `name`, `avatar_url`

## 4. Integrar comentários em `QuestionDetail.tsx`
- Renderizar `<QuestionComments questionId={id} />` no final da página (abaixo da correção ou abaixo do enunciado)
- Visível para todos os usuários logados, independente de ter respondido

## 5. Atualizar `Profile.tsx`
- Aceitar param `userId` opcional
- Se visualizando outro perfil: modo leitura + botão curtir
- Exibir contagem de curtidas no perfil
- Adicionar `likes_count` ao StatCard ou como badge

## Detalhes técnicos
- Perfis públicos precisam de política SELECT aberta (já existe: "Anyone can read profiles for ranking")
- Comentários usam React Query para fetch/invalidação em tempo real
- Join de comentários com profiles via query do Supabase: `.select('*, profiles(username, name, avatar_url)')`

