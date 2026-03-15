

# Plano: Formatação de Texto + Likes/Dislikes em Comentários

## 1. Banco de dados

### Nova tabela `comment_votes`
```sql
CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.question_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);
```
- RLS: SELECT para autenticados, INSERT/DELETE para `auth.uid() = user_id`, UPDATE para `auth.uid() = user_id`

### Adicionar `comment_score` ao `profiles`
```sql
ALTER TABLE public.profiles ADD COLUMN comment_score integer DEFAULT 0;
```

### Trigger para manter `comment_score` sincronizado
- INSERT de like: +1 no autor do comentário; INSERT de dislike: -1
- DELETE: reverte; UPDATE (troca de voto): ajusta +/-2
- Usa `SECURITY DEFINER` para acessar `question_comments` e `profiles`

### Storage bucket para imagens de comentários
- Criar bucket `comment-images` (público) para uploads de imagens nos comentários

## 2. Editor de texto rico no comentário (`QuestionComments.tsx`)
- Substituir o `<Textarea>` por um mini-editor com barra de ferramentas
- Botões: **Negrito**, *Itálico*, <u>Sublinhado</u>, ~~Tachado~~, Marca-texto, Imagem
- Armazenar conteúdo como HTML no campo `content`
- Renderizar comentários com `dangerouslySetInnerHTML` + sanitização via DOMPurify
- Upload de imagem: envia para bucket `comment-images`, insere `<img>` no conteúdo

## 3. Sistema de like/dislike em cada comentário
- Botões de polegar para cima/baixo em cada comentário
- Query para contar likes e dislikes por comentário
- Query para saber se o usuário atual já votou (e qual tipo)
- Toggle: clicar no mesmo voto remove; clicar no oposto troca

## 4. Exibir `comment_score` no perfil
- Adicionar ao `Profile.tsx` como um novo `StatCard` ou badge ao lado do nome
- Mostrar nos comentários ao lado do nome do autor (ex: "+12")

## Detalhes técnicos
- DOMPurify para sanitizar HTML antes de renderizar (segurança contra XSS)
- Barra de ferramentas usa `document.execCommand` via `contentEditable` div (leve, sem dependência pesada) ou uma lib como tiptap
- Imagens limitadas a 2MB por upload
- O `comment_score` reflete a soma de todos os likes (-dislikes) recebidos nos comentários do usuário

