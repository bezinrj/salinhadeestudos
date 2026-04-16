ALTER TABLE public.cronograma_matriz
  DROP CONSTRAINT cronograma_matriz_cronograma_id_fkey;

ALTER TABLE public.cronograma_matriz
  ADD CONSTRAINT cronograma_matriz_cronograma_id_fkey
  FOREIGN KEY (cronograma_id) REFERENCES public.schedules(id) ON DELETE CASCADE;