# Módulo Vade Mecum — Plano de implementação

## Contexto e adaptações ao projeto atual

A plataforma já tem auth (AuthContext) e RBAC (user_roles + has_role). Não vou criar UserContext separado nem `perfis` — vou reusar:

- **Usuário**: `useAuth()` (user.id, profile.name, profile.username)
- **Role**: `useIsAdmin()` + `useIsModerator()` (já existem)
- **Cargo concurso**: já existe `profiles.target_career` — reusar
- **RLS**: usar `auth.uid()` direto (padrão do projeto), não `current_setting('app.user_id')`. O spec foi escrito para um app standalone — adapto para o padrão Supabase Auth desta plataforma.

Isso evita duplicação e mantém consistência com o resto do projeto (Juris, Discursivas, Turmas etc.).

## Entrega em 4 fases

Dado o tamanho, sugiro entregar em fases. **Esta plano cobre apenas a Fase 1**; faremos as próximas após validar.

### Fase 1 — Fundação + Leitura (esta entrega)
1. Migração com 8 tabelas + RLS + GRANTs:
   - `vm_leis`, `vm_artigos`, `vm_paragrafos`, `vm_incidencias`, `vm_remissoes`
   - `vm_comentarios`, `vm_notas`, `vm_highlights`, `vm_progresso`
   - (prefixo `vm_` para não colidir com `juris_*` e demais)
2. Seed dos dados iniciais (CP, CPP, CF/88 + comentário professor)
3. Rotas `/vademecum` e `/vademecum/:leiId` adicionadas ao `App.tsx` dentro do `AppLayout` protegido
4. Item de menu "Vade Mecum" no sidebar/bottom nav
5. Tela de leitura (3 colunas): sidebar de leis + área central com artigos + drawer de marcados
6. Componentes: `LeiSidebar`, `ArticleCard`, `ArticleText` (com highlights + remissões inline), `IncidenciaBadge`, `ProgressBar`, `ArticleFilters`, `MarkedArticlesDrawer`, `RemissaoDrawer`
7. Funcionalidades: marcar lido, marcar favorito, filtros (status + cargo), progresso
8. Hooks: `useVmLeis`, `useVmLei`, `useVmProgresso`
9. Store Zustand `vademecumStore` (filtros, drawers, modo highlight)

### Fase 2 — Anotações privadas
- Notas post-it (modal + CRUD) com `useVmNotas`
- Highlights/marca-texto (toolbar flutuante, cálculo de offsets, renderização com `<mark>`) com `useVmHighlights`

### Fase 3 — Comentários e moderação
- Seção de comentários no card (aluno + professor com visual diferenciado)
- Upvotes, editar/excluir próprio comentário
- Rota `/vademecum/moderacao` para moderador/admin
- Modal "Publicar Comentário do Professor"

### Fase 4 — Painel Admin
- `/vademecum/admin` com sub-rotas (leis, artigos, usuários)
- CRUD completo de leis/artigos/parágrafos/incidências/remissões
- Drag-and-drop com `@dnd-kit/sortable` (já no projeto? verificar; adicionar se não)
- Gestão de roles para Vade Mecum reusa user_roles existente

## Detalhes técnicos importantes

- **Naming**: prefixo `vm_` em todas as tabelas para isolar do resto
- **Cargo**: usar valores em PT como no spec (`magistratura`, `defensoria`, `mp`, `delegado`)
- **Permissões**: `has_role(auth.uid(), 'admin')` e `has_role(auth.uid(), 'moderator')` direto nas policies
- **Fontes Lora + Inter**: adicionar via Google Fonts no `index.html`
- **Design tokens**: estender `index.css` com tokens específicos do Vade Mecum (papel `#FAFAF8`, etc.) em vez de cores hardcoded
- **Zustand**: já está no projeto? Se não, adiciono

## O que NÃO está incluído na Fase 1

- Notas/highlights/comentários (Fase 2/3)
- Painel admin e moderação (Fase 3/4)
- Modo leitura fullscreen, autosave de rascunho, mobile bottom-sheet refinado (polish posterior)

## Pergunta antes de começar

Posso prosseguir com a **Fase 1** como descrita, usando o auth/roles existentes (em vez do `UserContext` standalone do spec) e prefixo `vm_` nas tabelas?
