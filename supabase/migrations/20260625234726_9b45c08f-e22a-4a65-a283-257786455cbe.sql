
-- crono_materias
CREATE TABLE IF NOT EXISTS public.crono_materias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#EAB308',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crono_materias_user ON public.crono_materias(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crono_materias TO authenticated;
GRANT ALL ON public.crono_materias TO service_role;
ALTER TABLE public.crono_materias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crono_materias" ON public.crono_materias;
CREATE POLICY "own crono_materias" ON public.crono_materias FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- crono_assuntos
CREATE TABLE IF NOT EXISTS public.crono_assuntos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_id UUID NOT NULL REFERENCES public.crono_materias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crono_assuntos_user ON public.crono_assuntos(user_id);
CREATE INDEX IF NOT EXISTS idx_crono_assuntos_materia ON public.crono_assuntos(materia_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crono_assuntos TO authenticated;
GRANT ALL ON public.crono_assuntos TO service_role;
ALTER TABLE public.crono_assuntos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crono_assuntos" ON public.crono_assuntos;
CREATE POLICY "own crono_assuntos" ON public.crono_assuntos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sessoes: novos campos
ALTER TABLE public.study_timer_sessions
  ADD COLUMN IF NOT EXISTS materia_id UUID REFERENCES public.crono_materias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assunto_id UUID REFERENCES public.crono_assuntos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS questoes_feitas INTEGER,
  ADD COLUMN IF NOT EXISTS questoes_acertos INTEGER;

-- RPC media horas geral
CREATE OR REPLACE FUNCTION public.media_horas_geral(periodo TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_media NUMERIC;
BEGIN
  v_start := CASE lower(coalesce(periodo,'mes'))
    WHEN 'dia'     THEN date_trunc('day', now())
    WHEN 'diario'  THEN date_trunc('day', now())
    WHEN 'diário'  THEN date_trunc('day', now())
    WHEN 'mes'     THEN date_trunc('month', now())
    WHEN 'mês'     THEN date_trunc('month', now())
    WHEN 'mensal'  THEN date_trunc('month', now())
    WHEN 'ano'     THEN date_trunc('year', now())
    WHEN 'anual'   THEN date_trunc('year', now())
    ELSE date_trunc('month', now())
  END;

  SELECT COALESCE(AVG(total_user_seconds) / 3600.0, 0)
  INTO v_media
  FROM (
    SELECT user_id, SUM(COALESCE(total_seconds,0))::numeric AS total_user_seconds
    FROM public.study_timer_sessions
    WHERE status = 'completed'
      AND end_time >= v_start
    GROUP BY user_id
    HAVING SUM(COALESCE(total_seconds,0)) > 0
  ) t;

  RETURN COALESCE(v_media, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.media_horas_geral(TEXT) TO authenticated, anon;
