ALTER TABLE turmas_respostas
  ADD COLUMN IF NOT EXISTS gabarito_baixado_antes boolean NOT NULL DEFAULT false;