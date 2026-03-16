

# Plano: Gestao Completa de Usuarios no Painel Admin

## Problema
A aba "Usuarios" atual e basica — so mostra lista com busca. Falta: filtros (novos/ativos), promover roles, ver plano, acompanhamento individual.

## Solucao

### 1. Banco de dados
Nenhuma mudanca de schema necessaria. As tabelas `profiles`, `user_roles`, `user_sessions` ja existem. Para promover usuarios, usamos insert/delete na `user_roles` (admin ja tem RLS para isso).

Porem, precisamos de uma **RLS policy para admins deletarem comentarios de qualquer usuario** (ja existe delete own, falta admin delete):

```sql
CREATE POLICY "Admins can delete any comment"
ON public.question_comments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2. Aba "Usuarios" redesenhada com sub-abas

**Sub-aba "Todos"** — Tabela completa com:
- Avatar, nome, username, score, discursivas, streak, data cadastro
- Badge de role (admin/moderator/user)
- Badge de status online (via `user_sessions`)
- Badge de plano (assinante/gratuito via `check-subscription` ou indicador local)
- Busca por nome/username

**Sub-aba "Novos"** — Usuarios cadastrados nos ultimos 7 dias

**Sub-aba "Ativos"** — Usuarios com sessao nos ultimos 5 minutos

### 3. Painel de detalhes do usuario (drawer/dialog)
Ao clicar em um usuario, abre painel lateral com:
- **Informacoes**: nome, username, bio, carreira alvo, data cadastro
- **Estatisticas**: score, discursivas, streak, likes, comment_score, horas semanais
- **Acoes**:
  - Promover/rebaixar role (admin, moderator, user) via insert/delete em `user_roles`
  - Resetar senha (nao possivel via client-side — informar que precisa ser feito pelo proprio usuario)
  - Ver status do plano (assinante ou nao)
- **Atividade recente**: ultimos comentarios do usuario

### 4. Arquivos a editar
- **`src/pages/Admin.tsx`**: Reescrever `UsersTab` com sub-abas, tabela enriquecida e dialog de detalhes do usuario. Adicionar queries para roles e sessoes. Adicionar mutacoes para promover/rebaixar usuarios.

### 5. Sobre "senha"
Nao e possivel resetar senha de outro usuario pelo frontend (limitacao de seguranca). O painel mostrara um botao que envia email de reset de senha para o usuario, usando `supabase.auth.resetPasswordForEmail()` — porem isso requer saber o email do usuario. Como nao armazenamos email nos profiles, adicionaremos uma edge function admin que usa service_role para buscar o email do usuario e enviar o reset.

**Alternativa mais simples**: mostrar apenas a informacao de que o reset deve ser solicitado pelo proprio usuario. Implementaremos a edge function para envio de reset por admin.

### 6. Edge Function `admin-reset-password`
- Recebe `user_id`
- Valida que o chamador e admin (via token)
- Usa service_role para buscar email do usuario em `auth.users`
- Chama `supabase.auth.admin.generateLink({ type: 'recovery', email })` ou `resetPasswordForEmail`
- Retorna sucesso/erro

