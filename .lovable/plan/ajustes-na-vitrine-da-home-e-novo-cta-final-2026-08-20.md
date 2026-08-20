# Ajustes na vitrine da Home e novo CTA final

## 1. Nova imagem de preview das Discursivas

Substituir `src/assets/showcase-discursivas.jpg` por uma composição fiel aos cards reais enviados: quatro cards empilhados verticalmente (Delegado / PCPE, Magistratura Estadual / TJCE, Ministério Público / MP BA, Defensoria / DPE AC), cada um com chip do cargo, selo Premium dourado, título, linha `Q-XXX · Matéria · Banca`, contagem de participantes e botão "Responder". Fundo grafite escuro, mesmo padrão visual do app.

As quatro imagens enviadas serão usadas como base — montadas em uma única imagem vertical (rol de cards), otimizada e salva em `src/assets/showcase-discursivas.jpg`.

## 2. Remover botões dos blocos da vitrine

Em `src/components/home/FeatureShowcase.tsx`, remover os botões "Criar conta" e "Ver planos" de todos os blocos (Discursivas, Vade Digital, Salinha Juris, Questões da Semana). Os CTAs ficam apenas no hero ("Domine as discursivas") e na seção final.

## 3. Novo CTA final (substituindo o banner azul)

Em `src/pages/Home.tsx`, trocar o card `gradient-electric` por uma seção premium no padrão grafite/ouro:

- Fundo escuro com brilho radial dourado e azul suave, borda dourada sutil e cantos arredondados.
- Selo superior ("Comece hoje") com ícone.
- Título grande "Pronto para começar?" com destaque em ouro.
- Subtítulo curto.
- Dois botões: "Criar minha conta" (gradiente elétrico, com leve pulso/glow) e "Já tenho conta" (contorno, estilo secundário).
- Linha de reforço abaixo (ex.: acesso imediato · cancele quando quiser).

Tudo com tokens semânticos existentes (`gold`, `primary`, `card`, `border`) — sem cores hardcoded.

## Detalhes técnicos

- Arquivos: `src/components/home/FeatureShowcase.tsx`, `src/pages/Home.tsx`, `src/assets/showcase-discursivas.jpg`.
- Sem mudanças em backend, Stripe, autenticação ou rotas.
