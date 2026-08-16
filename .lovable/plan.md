# Questões da Semana: ciclo na sexta + arquivo de questões anteriores

## 1. Novo ciclo semanal (sexta 00:00 BRT)

- O prazo da questão da semana passa a ser sempre a **próxima sexta-feira às 00:00 (horário de Brasília)**, em vez de domingo.
- Ao publicar uma nova questão da semana, a anterior é encerrada e o ranking da semana passa a contar a nova questão.
- O contador na tela "Questões da Semana" mostra dias/horas até a sexta 00:00.
- Questões da semana já criadas com prazo de domingo continuam válidas até seu prazo; as novas seguem a sexta.

## 2. Botão "Questões anteriores"

Na página Questões da Semana, ao lado do desafio ativo, entra um botão **Questões anteriores** que abre a lista (cards) de todas as questões marcadas como semanais cujo prazo já venceu.

Na lista de anteriores:
- **Barra de pesquisa** que procura por título, enunciado, matéria e código (Q-XXX).
- **Filtro por matéria** (lista montada a partir das matérias das próprias questões arquivadas).
- Cada card mostra matéria, carreira, semana de aplicação e, para quem respondeu, a nota obtida.

As questões da semana encerradas deixam de aparecer na listagem de Discursivas — ficam exclusivas deste arquivo.

## 3. Como o aluno vê uma questão anterior

- **Respondeu no prazo:** vê a própria resposta enviada, a nota salva e o gabarito completo (espelho, barema e resposta ideal). Não pode responder de novo.
- **Não respondeu:** vê a questão com o gabarito completo (espelho, barema, resposta ideal) apenas para leitura, sem nota e sem campo de resposta.
- **Acesso:** assinantes têm acesso livre; quem está no plano grátis usa a mesma regra das discursivas premium (3 por mês) e, ao esgotar, vê o cadeado com o convite para assinar.

## Detalhes técnicos

- `src/pages/Admin.tsx`: `getNextSundayDeadline` vira `getNextFridayDeadline` (sexta 00:00 America/Sao_Paulo, convertida para UTC); mesma regra na re-publicação de questão semanal editada.
- `src/pages/WeeklyChallenge.tsx`: novo estado/rota interna para o arquivo, query das semanais com `deadline <= now()`, busca client-side por texto e filtro por matéria, e badge de nota via `weekly_answers` do usuário.
- `src/pages/Discursivas.tsx`: passa a excluir todas as questões com `is_weekly = true` (hoje só exclui as ativas).
- `src/pages/QuestionDetail.tsx`: para semanal encerrada, carrega a resposta salva em `weekly_answers` (texto + nota) e o gabarito via RPC `get_question_answer_key`, renderizando o painel de gabarito em modo leitura quando não há resposta do aluno; bloqueia o formulário de envio quando o prazo passou.
- Sem mudanças de schema: `weekly_answers.answer_text` e a RPC de gabarito já existem, e a RPC já libera o gabarito quando a semanal não está mais ativa.
