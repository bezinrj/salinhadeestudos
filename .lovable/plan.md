# Integração final do Salinha Juris

Plugar o módulo já criado nas rotas e menus de navegação.

## 1. Rotas (`src/App.tsx`)

Adicionar dentro do `<ProtectedRoute><AppLayout />`:

- `/juris` → `Juris` (lista)
- `/juris/admin` → `JurisAdmin` (apenas Admin/Moderador — gating dentro da página)
- `/juris/:id` → `JurisDetail` (detalhe com tabs)

Imports dos 3 novos pages no topo do arquivo.

## 2. Sidebar desktop (`src/components/layout/AppSidebar.tsx`)

- Importar ícone `Gavel` do lucide-react.
- Adicionar item no `mainItems`, posicionado logo após "Minhas Turmas":
  - `{ title: "Salinha Juris", url: "/juris", icon: Gavel }`
- Adicionar item "Juris Admin" (`/juris/admin`, ícone `Gavel`) no bloco condicional de Admin/Moderador, junto de Cronograma e Admin.

## 3. Bottom nav mobile (`src/components/layout/BottomNav.tsx`)

- Importar `Gavel`.
- Adicionar `{ path: "/juris", icon: Gavel, label: "Juris" }` em `extraNavItems` (drawer "Outros"), logo após Minhas Turmas.
- Adicionar `/juris/admin` no bloco condicional de admin (junto do item Admin existente), também no drawer.
- Não mexer na barra inferior de 4 ícones (mainNavItems) para não atrapalhar o layout atual.

## Escopo

Apenas wiring de rotas/navegação. Nada de mudança nas páginas, edge functions, schema ou estilo.
