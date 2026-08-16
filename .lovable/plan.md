# Reformular navegação do Painel Administrativo

Objetivo: transformar a atual barra horizontal de 14 abas em uma navegação lateral exclusiva para o admin, mais moderna, legível e separada visualmente, sem alterar nenhuma funcionalidade dos painéis de conteúdo.

## O que muda

- **Local da navegação**: sai de uma única fileira horizontal comprimida e passa a ser uma coluna lateral dentro da página `/admin`, com estilo visual "minimal linhas" e destaque por uso.
- **Agrupamento por uso**: menu organizado em grupos colapsáveis, mantendo os itens mais acessados no topo.
  - **Admin**: Frequentes (Visão Geral, Questões, Questões da Semana, Usuários), Gestão (Turmas, Alertas, Solicitações, Avisos), Conteúdo (Conteúdo, Assuntos, Matérias, Cronômetro), Sistema (Feedbacks, Configurações).
  - **Moderador**: Frequentes (Questões, Questões da Semana, Turmas), Catálogo (Assuntos, Matérias).
- **Estilo visual**: itens sem fundo colorido; estado ativo com texto realçado e indicador sutil (linha/borda primária à esquerda ou inferior), mantendo a paleta dark do projeto.
- **Funcionalidade preservada**: todos os `TabsContent` e sub-componentes (`OverviewTab`, `UsersTab`, `WeeklyQuestionsTab`, `TurmasAdminTab`, etc.) permanecem inalterados. A navegação continua controlando o estado `value` do `Tabs` do Radix.
- **Badges mantidos**: contadores pendentes de Alertas e Solicitações continuam visíveis em seus itens.
- **Responsividade**: desktop mostra sidebar lateral; mobile converte a navegação em uma faixa horizontal superior ou em um menu compacto, garantindo acesso sem quebrar o layout.

## Detalhes técnicos

- `src/pages/Admin.tsx`:
  - Substitui `TabsList` horizontal por um componente de navegação lateral (`AdminSidebar` inline ou novo componente) alinhado ao `Tabs`.
  - Mantém `Tabs` como root para que `TabsContent` continue funcionando com os mesmos `value` (`overview`, `users`, `weekly`, `weeklyq`, `turmas`, `alerts`, `requests`, `announcements`, `content`, `subjects`, `materias`, `crono`, `feedbacks`, `config`).
  - Cada item de menu aciona `setActiveTab` (ou usa `TabsTrigger` customizado sem envolvimento visual) via estado controlado.
  - Itens recebem ícones Lucide correspondentes para escaneabilidade.
  - Grupos `Frequentes`, `Gestão`, `Conteúdo` e `Sistema` (e ajuste para moderador) mantêm o `defaultOpen` quando o item ativo pertence ao grupo.
- Estilização via tokens semânticos do projeto (`--primary`, `--muted-foreground`, `--border`, `--secondary`), sem cores hardcoded.
- Sem mudanças em rotas, tabelas, Edge Functions, hooks ou lógica de negócio.

## Validação

- Visualização no preview desktop e mobile para confirmar que:
  - todos os 14 itens estão visíveis e acessíveis;
  - o item ativo destaca-se claramente;
  - a transição entre abas continua funcionando;
  - badges de Alertas/Solicitações aparecem;
  - o layout não quebra em telas menores.
