# Padronização de matérias e assuntos para comparação social no Cronômetro

## O problema

Hoje cada aluno cria suas próprias matérias (`crono_materias`) e assuntos (`crono_assuntos`) em texto livre. "Penal", "Direito Penal" e "D. Penal" viram três coisas diferentes, então qualquer média comparativa por matéria/assunto sai errada.

## Recomendação

Catálogo oficial (você cadastra) + entrada livre com vínculo automático ao catálogo.

Não vale obrigar todo mundo a escolher só do catálogo (o aluno se irrita quando falta o assunto dele), nem deixar tudo livre (comparação quebra). O caminho é:

1. Você cadastra no painel admin o catálogo oficial: matérias canônicas (ex. "Direito Penal") e assuntos canônicos por matéria (ex. "Crimes contra a vida").
2. Cada canônico aceita uma lista de sinônimos/apelidos ("Penal", "D. Penal", "Crimes contra a pessoa").
3. O aluno continua digitando o que quiser. Ao salvar, o sistema tenta casar automaticamente com um canônico:
   - normaliza o texto (minúsculas, sem acentos, sem pontuação, remove prefixos "direito de/do/da");
   - procura correspondência exata na lista de sinônimos;
   - se não achar, usa similaridade de texto do banco (`pg_trgm`) acima de um limite de segurança.
4. Se casou, mostra ao aluno um selo discreto "vinculado a Direito Penal" com opção de trocar (lista suspensa do catálogo).
5. Se não casou, a matéria/assunto fica "não classificada": conta nas estatísticas pessoais dele normalmente, mas fica fora das médias comparativas e entra numa fila no admin para você aprovar como novo canônico ou como sinônimo de um existente.

A comparação social passa então a usar sempre o ID canônico, nunca o texto digitado.

## O que muda na tela do Cronômetro

- Ao criar matéria/assunto: campo com autocompletar do catálogo oficial primeiro; digitar livremente continua permitido.
- Nas estatísticas: além da média geral de horas que já existe, comparação por matéria e por assunto — "Você: 4,2h em Direito Penal / Média dos alunos: 3,1h", com percentil.
- Itens ainda não classificados aparecem com um aviso curto: "sem comparação disponível ainda".

## Detalhes técnicos

Banco:
- `crono_materias_canon` (nome, cor padrão, ativo, ordem) e `crono_assuntos_canon` (materia_canon_id, nome, ativo). Leitura pública para usuários autenticados; escrita apenas admin/moderador.
- `crono_aliases` (tipo materia|assunto, canon_id, texto_normalizado único) para sinônimos.
- Colunas `materia_canon_id` em `crono_materias` e `assunto_canon_id` em `crono_assuntos`.
- Habilitar extensão `pg_trgm` e função `public.match_canon(tipo, texto, materia_canon_id)` (security definer) que normaliza e devolve o melhor canônico com score.
- Trigger em `crono_materias`/`crono_assuntos` (insert/update do nome) chamando `match_canon` para preencher o vínculo quando o score passar do limite.
- Fila de pendências: view/consulta admin dos registros sem vínculo, agrupados por texto normalizado e contagem de alunos.
- RPCs de comparação (security definer, retornam só agregados, nunca dados de outro aluno): `get_media_horas_por_materia(periodo)` e `get_media_horas_por_assunto(periodo, materia_canon_id)`, somando `study_timer_sessions` por canônico, mais o percentil do usuário atual.

Front-end:
- Novo hook `useCronoCanon` (catálogo + comparações).
- `CronoMateriasManager`: autocompletar sobre o catálogo, badge de vínculo e seletor manual de correção.
- `StudyTimerPage`: bloco "Comparação com outros alunos" por matéria/assunto, reaproveitando o `ChartTooltip` e as cores atuais.
- Nova aba no painel admin: gerenciar canônicos, sinônimos e aprovar pendências.

Semente inicial: preencher os canônicos a partir de `disciplines`/`discipline_subjects` (que já existem para as questões discursivas) e dos nomes já usados hoje pelos alunos, para você só revisar em vez de digitar tudo do zero.

## Ordem de execução

1. Migração: tabelas canônicas, aliases, colunas de vínculo, `pg_trgm`, função de match e triggers.
2. Semente do catálogo a partir dos dados existentes.
3. Aba admin de gestão do catálogo e das pendências.
4. Autocompletar no cadastro de matérias/assuntos do aluno.
5. RPCs de média por matéria/assunto + bloco de comparação social nas estatísticas.
