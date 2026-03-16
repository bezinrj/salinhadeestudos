

# Plano: Painel Admin Completo

## 1. Banco de dados

### Tabela `user_roles` (sistema seguro de roles)
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
-- RLS: SELECT para autenticados, INSERT/UPDATE/DELETE apenas para admins
```

### Atribuir admin a vneto2023@gmail.com
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('ffdb2f38-0e5b-4f29-8cb8-712fcfde53f6', 'admin');
```

### Função `has_role` (SECURITY DEFINER)
Previne recursão em RLS e permite checar roles com seguranca.

### Tabela `admin_announcements` (avisos do admin)
```sql
CREATE TABLE public.admin_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
```
- RLS: SELECT para autenticados (todos veem avisos ativos), INSERT/UPDATE/DELETE apenas para admins via `has_role()`

### Tabela `user_sessions` (rastrear usuarios online)
```sql
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```
- Atualizada via upsert a cada 60s pelo frontend quando o usuario esta logado
- RLS: SELECT para admins, INSERT/UPDATE para `auth.uid() = user_id`

## 2. Hook `useIsAdmin`
- Consulta `user_roles` via RPC `has_role(auth.uid(), 'admin')`
- Cacheia resultado no React Query
- Retorna `{ isAdmin, loading }`

## 3. Pagina Admin (`/admin`) com abas

### Aba "Visao Geral" (Dashboard Admin)
- Total de usuarios, usuarios online (last_seen < 5min), total comentarios, total likes
- Grafico de novos usuarios por semana
- Usuarios online agora (lista com avatar, nome, ultimo acesso)

### Aba "Usuarios"
- Tabela com todos os perfis: nome, email, score, essays, data de cadastro
- Busca por nome/username
- Acoes: promover a moderador, banir (futuro)

### Aba "Avisos"
- Criar/editar/desativar avisos que aparecem no Dashboard de todos os usuarios
- Formulario com titulo + mensagem
- Lista de avisos existentes com toggle ativo/inativo

### Aba "Conteudo"
- Lista de comentarios recentes com opcao de deletar
- Estatisticas de questoes respondidas

## 4. Banner de avisos no Dashboard
- No `Dashboard.tsx`, query avisos ativos de `admin_announcements`
- Exibir como banner destacado no topo (dismissível por sessao)

## 5. Tracker de presenca online
- `useOnlineTracker` hook: upsert em `user_sessions` a cada 60s
- Adicionado no `AppLayout` para todos os usuarios logados
- Admin ve lista de "online agora" (last_seen < 5 min)

## 6. Menu condicional
- `AppSidebar.tsx` e `BottomNav.tsx`: mostrar item "Admin" (icone Shield) apenas quando `useIsAdmin` retorna true
- Rota `/admin` protegida: redireciona nao-admins para `/dashboard`

## Arquivos
- **Criar**: `src/pages/Admin.tsx`, `src/hooks/useIsAdmin.ts`, `src/hooks/useOnlineTracker.ts`
- **Editar**: `AppSidebar.tsx`, `BottomNav.tsx`, `App.tsx`, `Dashboard.tsx`, `AppLayout.tsx`
- **Migrations**: tabelas, enum, funcao, RLS, insert do role admin

