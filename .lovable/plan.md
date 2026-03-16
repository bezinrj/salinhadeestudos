

# Plano: Ranking gamificado com pódio, avatares e perfil clicável + edição completa no Admin

## 1. RankingTable — emotes, avatares e perfil clicável

**`src/components/RankingTable.tsx`:**
- Substituir os números 1/2/3 por emotes gamificados: 🥇, 🥈, 🥉
- Usar `AvatarImage` com `entry.avatarUrl` em vez de apenas fallback
- Envolver o nome do usuário em um `Link` para `/perfil/:userId` (ou usar `useNavigate`)

## 2. Ranking.tsx — pódio com emotes e avatares

**`src/pages/Ranking.tsx`:**
- No pódio dos top 3, adicionar emotes gamificados (🥇 no 1o lugar substituindo 👑, 🥈 e 🥉 nos demais)
- Garantir que os avatares (AvatarImage) já estão sendo exibidos (já estão)
- Tornar os nomes no pódio clicáveis, navegando para `/perfil/:userId`

## 3. Admin — edição com gabarito e barema

**`src/pages/Admin.tsx` — Drawer de edição (linhas ~1064-1130):**
- Adicionar campo "Diretrizes / Gabarito (texto livre)" no drawer de edição
- Adicionar botão "Gerar Barema com IA" no drawer de edição (reutilizando a mesma lógica do formulário de criação)
- Os campos de Barema JSON, Espelho e Resposta Ideal já existem no drawer

## Arquivos afetados
- `src/components/RankingTable.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/Admin.tsx`

