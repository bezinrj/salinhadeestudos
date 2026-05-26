
## Visão geral

Criar o módulo **Salinha Juris** — biblioteca de julgados analisados, com estrutura didática (Noções, Conceitual, Problema, Antes×Depois, Conclusões, Oratória) e Assistente IA por julgado. Substitui o `localStorage` do código de referência por backend (Lovable Cloud) e troca a API direta da Anthropic pela Lovable AI (Gemini).

## Acesso

- **Item no menu lateral e bottom nav**: "Salinha Juris" (ícone `Gavel`), visível para todos os usuários logados.
- **Gratuitos**: veem a lista de julgados e a aba "Noções" (prévia). Demais abas e o chat exibem cartão de bloqueio com CTA "Assinar Premium" → checkout, no mesmo padrão de `acesso-premium`.
- **Premium**: tudo liberado.
- **Admin/Moderador**: aba extra "Publicar" para colar texto e gerar julgado via IA.

## Layout proposto

Inspirado no design system atual (dark grafite, ouro p/ VIP, sem dificuldades).

```text
/juris                                  → Lista de julgados
┌──────────────────────────────────────────────┐
│ Hero: ⚖️ Salinha Juris                       │
│ "Julgados decodificados para sua prova"      │
├──────────────────────────────────────────────┤
│ Filtros: [Tribunal ▾] [Área ▾] [Buscar...]   │
├──────────────────────────────────────────────┤
│ Grid de cards (3 col desktop / 1 mobile):    │
│  ┌─────────┐ tribunal · info                 │
│  │  Card   │ Título do julgado               │
│  │ premium │ Área · Data                     │
│  │  chip?  │ "Em uma frase" (preview)        │
│  └─────────┘ [Abrir →]                       │
└──────────────────────────────────────────────┘

/juris/:id                              → Detalhe
┌──────────────────────────────────────────────┐
│ ← Voltar          [pills: tribunal/área/...] │
│ Título grande do julgado                     │
│ Relator · Nº · Data · Informativo            │
├──────────────────────────────────────────────┤
│ Tabs horizontais (ScrollArea no mobile):     │
│  💡 Noções | 📖 Conceitual | 🔍 Problema     │
│  ⚖️ Antes×Depois | ✅ Conclusões             │
│  🎙️ Oratória | 💬 Assistente IA              │
├──────────────────────────────────────────────┤
│ Conteúdo da aba em Cards do design system    │
│ (reaproveita Card, Badge, Separator, etc.)   │
│                                              │
│ IntegraBox fixo no fim de cada aba           │
│ (texto + referência da íntegra)              │
└──────────────────────────────────────────────┘
```

Componentes shadcn: `Card`, `Tabs`, `Badge`, `Button`, `Input`, `Select`, `Dialog`, `Textarea`, `ScrollArea`. Animação suave de troca de aba com `framer-motion`.

## Backend (migration única)

Tabela `juris_julgados`:
- campos básicos: `titulo`, `tribunal`, `numero`, `relator`, `data`, `info`, `area`
- nóções (jsonb): `{ frase, contexto, ok, ko }`
- texto longo: `conceitual`, `problema`, `solucao`, `antes`, `depois`, `conclusoes`, `principios`, `doutrina`, `jurisprudencia`, `abertura`, `tese`, `integra_texto`, `integra_ref`
- meta: `published` (bool), `created_by`, `created_at`, `updated_at`

RLS:
- **SELECT**: qualquer usuário autenticado pode ver julgados `published = true`. Admin/Moderador veem tudo.
- **INSERT/UPDATE/DELETE**: apenas Admin/Moderador (`has_role`).

Tabela `juris_chat_usage` para rate limit diário do chat:
- `user_id`, `date` (default `current_date`), `count` (int).
- RLS: usuário só vê/atualiza o próprio registro. UNIQUE (`user_id`, `date`).

## Edge Functions (Lovable AI Gateway, sem chave do usuário)

1. **`juris-generate`** (Admin/Moderador): recebe texto colado, chama `google/gemini-2.5-pro` com tool calling para extrair o JSON estruturado dos 25 campos. Retorna objeto pronto para revisão antes de salvar.
2. **`juris-chat`** (qualquer logado, mas valida plano Premium): recebe `julgado_id` + histórico. Monta system prompt com o contexto do julgado e responde via `google/gemini-2.5-flash`. Antes de chamar, faz upsert em `juris_chat_usage` e retorna **429** se passar do limite diário (configurável; padrão proposto: **20 msgs/dia**).

Ambas usam `LOVABLE_API_KEY` e seguem o padrão das funções existentes (`evaluate-answer`, `transcribe-answer`).

## Frontend

Novos arquivos:
- `src/pages/Juris.tsx` — lista + filtros + grid de cards.
- `src/pages/JurisDetail.tsx` — abas, conteúdo, IntegraBox.
- `src/pages/JurisAdmin.tsx` (ou aba dentro de `/admin`) — colar texto → preview → editar campos → publicar/despublicar/excluir.
- `src/components/juris/JurisChatPanel.tsx` — chat com estado local + chamada à edge function + tratamento de 402/429.
- `src/components/juris/IntegraBox.tsx`, `JurisCard.tsx`, `JurisTabs.tsx`.
- `src/hooks/useJurisAccess.ts` — retorna `canViewFull` (Premium) e `dailyChatLimit`.

Rotas em `src/App.tsx`:
- `/juris` → `Juris`
- `/juris/:id` → `JurisDetail`

Menu: adicionar item em `AppSidebar.tsx` e `BottomNav.tsx` (ícone `Gavel` do `lucide-react`).

Para usuário gratuito em `/juris/:id`:
- Aba "Noções" renderiza normalmente.
- Demais abas e Chat trocam o conteúdo por `<PremiumLock />` (mesmo componente/padrão das discursivas premium) com botão "Desbloquear com Premium".

## Memória

Adicionar `mem://funcionalidades/salinha-juris` descrevendo: módulo de julgados estruturados por IA, gratuitos veem só Noções, chat limitado a 20 msgs/dia, geração restrita a Admin/Moderador via `juris-generate`, chat via `juris-chat`. Adicionar referência no `mem://index.md`.

## Fora de escopo desta entrega

- Importação em lote / busca semântica nos julgados.
- Notificações de novo julgado publicado.
- Comentários sociais nos julgados (pode ser próxima iteração reaproveitando o componente de discursivas).
