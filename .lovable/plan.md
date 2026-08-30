# Melhorar a navegação mobile do site

Hoje o app usa dois sistemas separados: sidebar (desktop) e barra inferior + drawer (mobile). O menu mobile está desatualizado em relação ao desktop e telas com navegação própria (Vade Mecum) simplesmente escondem essa navegação no celular.

## Problemas confirmados

- **Vade Mecum sem lista de leis no celular**: a barra lateral de leis (`LeiSidebar`) é `hidden ... lg:flex`, ou seja, só aparece a partir de 1024px. No celular não há nenhuma forma de trocar de lei ou abrir Súmulas.
- **Cadernos ausente no menu mobile**: o item existe na sidebar desktop (grupo "Geral"), mas não está na lista do drawer mobile.
- **Altura fixa em tela cheia**: o Vade Mecum usa `h-[calc(100vh-4rem)]`, cálculo feito para o header desktop; no celular sobra/falta espaço e a barra inferior cobre conteúdo.
- **Duas fontes de verdade**: itens e ordem do menu estão duplicados em `AppSidebar` e `BottomNav`, o que faz o mobile ficar desatualizado sempre que algo novo entra.

## O que será feito

### 1. Fonte única de navegação
Criar uma lista central de itens de menu (rótulo, rota, ícone, grupo, se exige admin) usada tanto pela sidebar desktop quanto pelo drawer mobile. Assim qualquer item novo aparece automaticamente nos dois.

### 2. Drawer mobile organizado por grupos
O menu mobile passa a espelhar os grupos do desktop — Geral (Perfil, Dashboard, Cadernos), Estudos (Discursivas, Questões da Semana, Minhas Turmas, Vade Mecum, Salinha Juris), Desempenho (Ranking, Cronômetro, Meu Plano, Fale Conosco) e Administração quando aplicável — com Cadernos incluído.

### 3. Barra inferior enxuta e consistente
Manter 4 atalhos + "Menu", com respeito à área segura do iPhone (safe-area) e destaque claro do item ativo.

### 4. Navegação interna do Vade Mecum no celular
- Barra fixa no topo da tela do Vade Mecum com o nome da lei atual e um botão "Leis".
- Esse botão abre a lista de leis em um painel deslizante (mesma lista do desktop: busca, Súmulas, agrupamento por categoria, contadores). Reordenar por arraste continua exclusivo do desktop.
- Ao escolher uma lei, o painel fecha sozinho.
- Atalho "Meus cadernos" acessível também nessa barra.

### 5. Ajustes gerais de layout mobile
- Trocar alturas fixas de viewport por layout flexível, garantindo que a barra inferior nunca cubra conteúdo ou botões.
- Revisar telas com filtros/abas horizontais (Discursivas, Juris, Súmulas, Cadernos) para rolagem horizontal suave em vez de quebra de layout.

## Detalhes técnicos

- Novo arquivo `src/config/navigation.ts` com os grupos de navegação; `AppSidebar.tsx` e `BottomNav.tsx` passam a consumi-lo.
- `LeiSidebar.tsx` ganha um modo "conteúdo puro" reutilizado tanto no `aside` desktop quanto dentro de um `Sheet` (shadcn) no mobile; `canReorder` só ativo no desktop.
- `src/pages/Vademecum.tsx`: header mobile (`lg:hidden`) com título da lei + botão que abre o `Sheet`; container muda de `h-[calc(100vh-4rem)]` para altura flexível com `min-h-0` e `pb` para a bottom nav.
- `BottomNav.tsx`: `pb-[env(safe-area-inset-bottom)]` e drawer renderizando os grupos da config.
- Sem mudanças de rotas, banco, RLS ou Edge Functions — trabalho apenas de apresentação.

## Validação

Conferir no preview em viewport mobile: acesso à lista de leis e Súmulas dentro do Vade Mecum, presença de Cadernos no menu, nenhum conteúdo escondido atrás da barra inferior, e paridade de itens entre desktop e mobile.
