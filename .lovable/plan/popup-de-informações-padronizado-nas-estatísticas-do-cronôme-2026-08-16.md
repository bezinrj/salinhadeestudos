# Popup de informações padronizado nas estatísticas do Cronômetro

Aplicar o mesmo comportamento e visual do popup (tooltip) dos gráficos do Dashboard nas estatísticas do Cronômetro, com cores harmônicas ao tema (grafite/dourado) para eliminar o contraste confuso atual.

## O que muda

- Criar um componente único de tooltip de gráfico, reutilizado pelo Dashboard e pelo Cronômetro.
- Visual do popup: fundo grafite sólido (card), borda sutil, cantos arredondados, sombra suave, título em destaque e valor alinhado com a cor da fatia/barra correspondente (ponto colorido ao lado).
- No Cronômetro (Distribuição por matéria/assunto): ao passar o mouse, o popup mostra nome da matéria/assunto, horas formatadas e percentual — sem o azul destoante atual.
- No Dashboard (Total de questões respondidas na semana): mesmo componente, mostrando o dia e a quantidade, substituindo o azul padrão do Recharts.

## Detalhes técnicos

- Novo arquivo `src/components/charts/ChartTooltip.tsx` com um `content` customizado do Recharts (recebe `active`, `payload`, `label`) e uma prop de formatação de valor.
- `src/pages/StudyTimerPage.tsx`: substituir `contentStyle`/`formatter` do `<Tooltip>` do PieChart pelo novo `content`, exibindo `nome`, `horas` e `pct`.
- `src/pages/Dashboard.tsx` (linha do `<Tooltip>` do BarChart): usar o mesmo `content`, rótulo do dia e contagem.
- Cores exclusivamente via tokens do design system (`--card`, `--border`, `--foreground`, `--muted-foreground`, `--gold`), sem cores fixas.
- Sem alteração de dados, consultas ou lógica de negócio.
