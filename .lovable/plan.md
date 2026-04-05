
# Módulo Cronograma - Plano de Implementação

## Fase 1: Banco de Dados (Migração)

### Tabela `schedules` (cronogramas)
- `id`, `title`, `description`, `status` (draft/published/hidden), `color_theme`
- `created_by` (admin), `created_at`, `updated_at`
- RLS: admin CRUD completo, usuários autorizados podem ler cronogramas publicados

### Tabela `schedule_blocks` (blocos de estudo)
- `id`, `schedule_id` (FK), `date`, `sort_order`
- `discipline`, `subject`, `dod_url`, `questions_url`, `notes`
- `status` (pending/in_progress/completed), `color`
- `created_at`, `updated_at`
- RLS: admin CRUD, usuários autorizados leitura

### Tabela `schedule_access` (controle de acesso por usuário)
- `id`, `user_id`, `schedule_id`, `granted_by`, `created_at`
- RLS: admin gerencia, usuário lê próprio acesso

## Fase 2: Frontend - Estrutura

### Menu e Rotas
- Adicionar "Cronograma" no sidebar (apenas para admin inicialmente)
- Rota `/cronograma` → lista de cronogramas
- Rota `/cronograma/:id` → planner interativo

### Página de Lista de Cronogramas
- Cards com título, descrição, status, progresso
- Botão criar novo cronograma (admin)
- Filtro por status

## Fase 3: Planner Interativo

### Visualizações
- Dia, Semana, Mês (tabs)
- Grid com blocos de estudo por data

### Blocos de Estudo
- Card com matéria, assunto, links (DOD, questões), status
- Cor por matéria
- Ações: editar, duplicar, excluir, marcar concluído

### Drag and Drop
- Usar `@dnd-kit/core` para arrastar blocos entre datas
- Reordenar dentro do mesmo dia

## Fase 4: Barra de Progresso
- Total de blocos, concluídos, em andamento, pendentes
- Percentual visual com barra de progresso
- Indicador de atrasados

## Fase 5: Permissões e Publicação
- Status draft/published/hidden
- Controle de acesso granular por cronograma
- Admin gerencia no painel
