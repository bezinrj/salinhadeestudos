

# Plano: Redesign da Visao Geral e Acoes de Usuario no Admin

## Mudancas

### 1. Visao Geral (OverviewTab) — estilo das imagens de referencia
Redesenhar os stat cards em grid 2x3 com icones coloridos e visual maior:
- Usuarios totais (icone azul)
- Online agora (icone verde)
- Aguardando aprovacao (icone laranja) — usuarios cadastrados sem atividade
- Ativos (icone azul check) — usuarios com sessao recente
- Bloqueados (icone vermelho) — futuro, placeholder 0
- Assinaturas ativas (icone azul) — placeholder 0

Lista de usuarios online com indicador verde, nome e tempo relativo ("agora", "1min atras").

### 2. Aba Usuarios — estilo cards com botoes de acao (imagem 1)
Trocar a tabela por cards individuais mostrando:
- Avatar, nome, email (username), badge Free/Premium
- Status (Ativo/Inativo)
- Ultima atividade
- Botoes de acao em linha: Admin, Professor, Plano, Senha, **Bloquear**, **Acompanhar**
- **Novo botao: Deletar Conta** (vermelho, com confirmacao)

### 3. Deletar conta de usuario
- Nova edge function `admin-delete-user` que:
  - Valida que o chamador e admin
  - Usa `service_role` para chamar `supabase.auth.admin.deleteUser(user_id)`
  - Isso remove o usuario do auth e cascateia para profiles e tabelas relacionadas
- Botao no drawer e nos cards com dialog de confirmacao

### 4. Arquivos
- **Criar**: `supabase/functions/admin-delete-user/index.ts`
- **Editar**: `src/pages/Admin.tsx` (OverviewTab redesenhado, UsersTab com cards, botao deletar no drawer)

### 5. Banco de dados
Nenhuma mudanca de schema necessaria. A edge function usa service_role para deletar via auth.admin API, que cascateia automaticamente.

