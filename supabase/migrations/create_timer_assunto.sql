-- Script de Migração: Campo Assunto no Cronômetro
-- Adiciona a coluna 'assunto' na tabela study_timer_sessions

ALTER TABLE public.study_timer_sessions ADD COLUMN IF NOT EXISTS assunto text;
