# Tags de cargo por artigo, inciso e parágrafo no Vade Mecum

## Objetivo

Permitir que admin/moderador marque quais cargos costumam cobrar cada trecho da lei — no artigo inteiro ou em um inciso/parágrafo/alínea específico — e que o aluno filtre e visualize essas marcações.

## Como vai funcionar

**Para admin/moderador**
- Em cada artigo, um botão "Marcar cargos" abre um seletor com os 4 cargos (Magistratura ⚖️, Defensoria 🛡️, MP 🏛️, Delegado 🔍). Marcar/desmarcar aplica a tag ao artigo inteiro.
- Ao lado de cada inciso, parágrafo e alínea aparece um botão discreto (visível só para staff) que abre o mesmo seletor, aplicando a tag àquele item específico.

**Para o aluno**
- A tag do cargo aparece ao lado do inciso/parágrafo marcado.
- No topo do artigo aparece o somatório: se 4 incisos estiverem marcados como Delegado, o topo mostra 🔍 4×. As marcações feitas no artigo inteiro entram nesse mesmo somatório.
- O filtro de cargo já existente passa a considerar também as marcações de incisos/parágrafos, então filtrar por "Delegado" traz todo artigo que tenha qualquer marcação de Delegado.

## Observação sobre perfis

Hoje o sistema tem apenas os papéis **admin** e **moderador** (não existe papel "professor"). A permissão de marcar tags ficará com esses dois papéis — o mesmo grupo que já publica notas do professor.

## Detalhes técnicos

**Banco (migração)**
- `vm_incidencias`: adicionar coluna `paragrafo_id uuid null` referenciando `vm_paragrafos(id) on delete cascade`; `quantidade` passa a ter default 1.
- Índices únicos parciais: um por `(artigo_id, cargo)` quando `paragrafo_id is null`, outro por `(paragrafo_id, cargo)` quando não nulo — evita tag duplicada.
- Índice em `paragrafo_id`.
- RLS já está correta (leitura pública; escrita apenas para admin/moderador via `has_role`), nada muda.
- Dados existentes continuam válidos como marcações de artigo.

**Tipos e dados**
- `VmIncidencia` ganha `paragrafo_id: string | null`.
- `useVmLei` já carrega `vm_incidencias` por artigo; a lista passa a incluir as de parágrafo, agrupadas também por `paragrafo_id` para render inline.

**UI**
- Novo componente `CargoTagPicker.tsx` (popover com os 4 cargos, toggle on/off), usado no cabeçalho do artigo e ao lado de cada parágrafo.
- Novo hook `useVmIncidencias` com mutações de criar/remover tag e atualização otimista + invalidação da query `vm-lei`.
- `ArticleCard.tsx`: o bloco de badges do cabeçalho passa a somar artigo + parágrafos por cargo (`🔍 4×`); adiciona o botão de marcação para staff.
- `ArticleText.tsx`: recebe `incidenciasByParagrafo` e `canTag`; renderiza `IncidenciaBadge` compacto ao lado do rótulo do inciso/parágrafo e o botão de tag para staff.
- `Vademecum.tsx`: filtro por cargo passa a checar qualquer incidência do artigo (inclusive de parágrafos); passa `canTag` (via `useIsAdmin`/`useIsModerator`) para os cards.
