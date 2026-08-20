# Ajuste de destaques na Home

## 1. Simplificar a seção "Tudo que você precisa para evoluir"

Em `src/pages/Home.tsx`:
- Manter o título "Tudo que você precisa para evoluir".
- Remover o parágrafo "Ferramentas projetadas para maximizar seu desempenho em concursos de Delegado, Magistratura e Ministério Público.".
- Remover a grade dos 3 cards (Discursivas Corrigidas, Ranking Gamificado, Cronômetro de Estudos).

## 2. Inserir preview de Discursivas no `FeatureShowcase`

Em `src/components/home/FeatureShowcase.tsx`:
- Adicionar um novo bloco no início do array: "Discursivas Corrigidas".
- O bloco seguirá o mesmo padrão dos outros (selo, título, 4 bullets, imagem real, botões Criar conta / Ver planos).
- A imagem será um screenshot real dos cards de questões discursivas mostrando cargos mesclados (Delegado, Defensoria, Juiz, OAB, MP etc.).

## 3. Capturar screenshot real dos cards de Discursivas

- Usar Playwright para acessar `/discursivas` com sessão autenticada e capturar a lista de cards exibindo incidências de cargos variados.
- Salvar a imagem otimizada em `src/assets/showcase-discursivas.jpg` (ou `.png`) e importá-la no componente.

## 4. Ajustar a faixa de números do `FeatureShowcase`

- Remover o card "IA Correção e assistente jurídico" do grid inferior.
- Alterar o grid de 4 colunas para 3 colunas no desktop (`md:grid-cols-3`).

## 5. Corrigir texto do bloco "Questões da Semana"

- Alterar a descrição de "Discursiva semanal, correção por IA e pódio" para "Discursiva semanal, correção e pódio.".

## 6. Verificação visual

- Conferir a Home no preview para garantir: título isolado, novo preview de Discursivas como primeiro bloco, faixa de números com 3 cards, texto sem "por IA", e responsividade preservada.

Arquivos envolvidos: `src/pages/Home.tsx`, `src/components/home/FeatureShowcase.tsx`, `src/assets/showcase-discursivas.*`.

Sem alterações de backend, Stripe ou autenticação.
