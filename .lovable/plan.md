# Súmulas no Vade Mecum

Adicionar um item "Súmulas" na barra lateral do Vade Mecum, com todas as súmulas do STJ, STF e Vinculantes do arquivo enviado, organizadas por matéria e assunto, com busca e filtros.

## O que o usuário verá

- Novo item fixo no topo da barra lateral do Vade Mecum: **Súmulas** (rota `/vademecum/sumulas`).
- Barra de busca por texto livre (busca no enunciado e no número, ex.: "624", "monocular").
- Filtros: **Tribunal** (STJ / STF / Vinculante), **Matéria** (Direito Administrativo, Civil, Penal...) e **Assunto** (lista dependente da matéria escolhida).
- Resultado agrupado por matéria → assunto, em cards no mesmo padrão visual dos artigos, com cabeçalho "Súmula N — STJ/STF" e o enunciado.
- Contadores de quantas súmulas há em cada matéria/assunto e no resultado da busca.
- Acesso segue a mesma regra do Vade Mecum: assinantes veem tudo; sem plano, degustação limitada com o card "Desbloqueie sua Assinatura".

## Conteúdo importado

Do arquivo enviado (4.707 linhas, ~1.478 enunciados):
- Súmulas do STJ (13 matérias)
- Súmulas do STF (11 matérias)
- Súmulas Vinculantes do STF (11 matérias)

O parser identifica as seções por tribunal, as matérias ("Direito ..."), os assuntos (demais títulos) e cada bloco "Súmula N — TRIBUNAL" seguido do texto, descartando as marcas "Página N" e linhas de cabeçalho.

## Detalhes técnicos

**Banco de dados** — nova tabela `public.vm_sumulas`:
`id`, `tribunal` (`STJ` | `STF` | `VINCULANTE`), `numero` (int), `materia` (text), `assunto` (text), `texto` (text), `ordem` (int), `created_at`/`updated_at`.
- GRANT `SELECT` para `anon` e `authenticated`; `ALL` para `service_role`.
- RLS ativada: leitura pública; escrita apenas para admin/moderador via `has_role`.
- Índices em (`tribunal`, `materia`, `assunto`) e índice de busca textual no `texto`.

**Importação**: script de parsing do arquivo gerando os registros, inserido no banco em lotes (mesmo procedimento usado nas leis grandes já importadas).

**Frontend**:
- `src/hooks/useVmSumulas.ts` — carrega as súmulas (cacheado por React Query) e deriva as listas de matérias/assuntos.
- `src/pages/VademecumSumulas.tsx` — página com filtros, busca e listagem agrupada; reaproveita `LeiSidebar` e o layout de `Vademecum.tsx`.
- `src/components/vademecum/SumulaCard.tsx` — card do enunciado.
- `LeiSidebar`: entrada fixa "Súmulas" acima da lista de leis (fora da ordenação por drag-and-drop).
- Rota `/vademecum/sumulas` em `App.tsx`, registrada antes de `/vademecum/:leiId`.
- Filtros persistidos com o hook existente `usePersistedState`.

Sem alteração no fluxo de checkout, nas leis existentes ou nas anotações/grifos.
