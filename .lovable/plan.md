

# Plano: Migrar autenticação mock para Supabase Auth

## Contexto
A autenticação atual usa dados mock em memória (`src/data/mockData.ts`). Precisa ser migrada para autenticação real com Lovable Cloud para que o checkout Stripe funcione (as Edge Functions precisam de um token JWT real).

## Etapas

### 1. Criar tabela `profiles` no banco
Tabela para armazenar username, nome, bio, avatar e carreira alvo do usuário. Trigger automático para criar perfil ao registrar.

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  name text DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  target_career text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Habilitar auto-confirm de email
Para simplificar o fluxo (sem necessidade de verificar e-mail para testar), habilitar auto-confirm via `configure_auth`.

### 3. Reescrever `AuthContext.tsx`
- Usar `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.signOut()`
- Listener `onAuthStateChange` para persistir sessão
- Carregar perfil da tabela `profiles` após login
- Expor `updateProfile` que faz UPDATE na tabela `profiles`

### 4. Atualizar `Login.tsx`
- Passar `username` via `options.data` no `signUp`
- Remover referência ao usuário de teste mock
- Adicionar funcionalidade de "Esqueci minha senha"

### 5. Atualizar `Profile.tsx`
- Remover imports de `mockData`
- Usar dados do `AuthContext` (que vem do banco)

### 6. Limpar referências mock
- Remover imports de `mockData` relacionados a auth em componentes
- Manter `mockData.ts` para dados de questões/badges que ainda são mock

## Detalhes técnicos
- Sessão persistida automaticamente pelo Supabase client (já configurado com `persistSession: true`)
- O `ProtectedRoute` continua funcionando via `isAuthenticated` do contexto
- Edge Functions de checkout já esperam um token JWT real - vai funcionar automaticamente após a migração

