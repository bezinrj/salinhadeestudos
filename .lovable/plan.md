# Popup de degustação premium: visual e regras de exibição

## O que muda visualmente

Título premium no lugar de "Libere 3 dias de acesso premium":

**"Acesso Premium liberado por 3 dias"** com subtítulo curto: *Indique 2 amigos e comece agora.*

O parágrafo longo sai e vira uma lista de benefícios com ícones dourados:

- Questões Discursivas com espelho e barema
- Ranking Semanal e disputa entre alunos
- Salinha Juris — julgados decodificados
- Vade Digital completo com notas e grifos
- Cadernos de estudo e cronômetro
- E muito mais...

Rodapé discreto: *Minhas Turmas não faz parte da degustação.*

Nenhuma menção a correção por IA em nenhum texto do popup.

### Efeito visual

Um halo dourado pulsante atrás da janela do popup: duas camadas de brilho (`bg-gold/30` com `blur-3xl`) posicionadas atrás do card, animadas em escala e opacidade em loop lento, mais uma borda dourada sutil no card. O pulso é suave (2,5s) e respeita `prefers-reduced-motion`.

## Regras de quem vê o aviso

Não exibir para quem tem:

- assinatura premium ativa (Stripe) ou plano de conteúdo ativo
- cortesia manual ativa
- acesso ativo a qualquer turma
- degustação em andamento
- staff (admin/moderador)

Contas gratuitas que já usaram a degustação voltam a ver o convite **30 dias após o resgate**. O adiamento "Agora não" continua valendo por 12 horas.

## Detalhes técnicos

- `src/components/referral/TrialGate.tsx`: novo layout (título, lista de benefícios, halo pulsante) e nova condição de exibição — soma às entitlements atuais uma consulta a `turmas_acessos` do usuário e passa a considerar `trial.claimed` apenas quando o resgate ocorreu há menos de 30 dias.
- `src/hooks/useTrialStatus.ts`: expor `claimedAt` e um campo derivado `eligibleAgain` (resgate há mais de 30 dias e sem degustação ativa).
- `tailwind.config.ts`: novo keyframe `gold-pulse` (escala + opacidade) e animação correspondente; usa o token `gold` já existente, sem cores hardcoded.
- Banco: `claim_referral_trial` hoje bloqueia definitivamente quem já resgatou (`trial_claimed_at IS NOT NULL`). Para o reenvio após 30 dias fazer sentido, a função passa a permitir novo resgate quando `trial_claimed_at < now() - interval '30 days'`, exigindo novamente 2 indicações válidas e novas (e-mails ainda não indicados pelo mesmo usuário). Isso vai por migração.
- `src/components/referral/TrialCard.tsx`: mesma lista de benefícios resumida e mesma regra de reelegibilidade, para o card não contradizer o popup.
