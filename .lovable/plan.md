## Plano de Implementação

### 1. Migração de Banco de Dados
- Criar tabela `moderation_requests` para armazenar solicitações de moderadores (tipo, questão, dados propostos, status, justificativa, moderador, admin decisor, timestamps)
- Criar função `is_absolute_admin()` para proteger o admin principal (vneto2023@gmail.com)
- Adicionar RLS policies adequadas
- Adicionar trigger para impedir remoção/alteração de role do admin absoluto

### 2. Proteção do Admin Absoluto
- Trigger na tabela `user_roles` que impede DELETE/UPDATE no role do admin absoluto
- Lógica no frontend para esconder botões de alteração de role quando o usuário alvo é o admin absoluto

### 3. Fluxo do Moderador
- Quando moderador tenta editar/excluir questão, ao invés de executar, cria uma `moderation_request`
- Moderador preenche justificativa obrigatória
- Questão original permanece inalterada

### 4. Menu "Solicitações" no Painel Admin
- Nova aba no painel admin (visível apenas para admins)
- Listagem com filtros (status, moderador, tipo)
- Visualização de diff para edições
- Botões aprovar/rejeitar
- Histórico completo

### 5. Arquivos a Modificar
- `src/pages/Admin.tsx` - adicionar aba Solicitações, proteger admin absoluto
- Novo componente para o menu de Solicitações
- Lógica de moderador nas telas de questões semanais
