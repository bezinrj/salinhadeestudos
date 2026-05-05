
-- 1. Categorias
CREATE TABLE IF NOT EXISTS public.turmas_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#6366f1',
  icone text NOT NULL DEFAULT 'BookOpen',
  created_at timestamptz DEFAULT now()
);

-- 2. Álbuns
CREATE TABLE IF NOT EXISTS public.turmas_albuns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  categoria_id uuid REFERENCES public.turmas_categorias(id) ON DELETE SET NULL,
  capa_url text,
  questoes_por_liberacao int NOT NULL DEFAULT 1,
  intervalo_dias int NOT NULL DEFAULT 7,
  data_inicio timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Questões dos álbuns
CREATE TABLE IF NOT EXISTS public.turmas_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.turmas_albuns(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.weekly_questions(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 1,
  liberado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(album_id, question_id),
  UNIQUE(album_id, ordem)
);

-- RLS
ALTER TABLE public.turmas_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_albuns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_questoes ENABLE ROW LEVEL SECURITY;

-- Categorias
CREATE POLICY "turmas_categorias_select" ON public.turmas_categorias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "turmas_categorias_insert" ON public.turmas_categorias
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_categorias_update" ON public.turmas_categorias
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_categorias_delete" ON public.turmas_categorias
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Álbuns
CREATE POLICY "turmas_albuns_select" ON public.turmas_albuns
  FOR SELECT TO authenticated USING (
    is_active = true
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_albuns_insert" ON public.turmas_albuns
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_albuns_update" ON public.turmas_albuns
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_albuns_delete" ON public.turmas_albuns
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Questões dos álbuns
CREATE POLICY "turmas_questoes_select" ON public.turmas_questoes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_tier IN ('premium', 'quarterly', 'annual')
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_questoes_insert" ON public.turmas_questoes
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_questoes_update" ON public.turmas_questoes
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );
CREATE POLICY "turmas_questoes_delete" ON public.turmas_questoes
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Função de cálculo de liberação
CREATE OR REPLACE FUNCTION public.calcular_liberacao_turma()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_album public.turmas_albuns%ROWTYPE;
  v_count int;
  v_lote int;
BEGIN
  SELECT * INTO v_album FROM public.turmas_albuns WHERE id = NEW.album_id;
  SELECT COUNT(*) INTO v_count FROM public.turmas_questoes WHERE album_id = NEW.album_id AND id != NEW.id;
  v_lote := v_count / GREATEST(v_album.questoes_por_liberacao, 1);
  NEW.liberado_em := v_album.data_inicio + (v_lote * v_album.intervalo_dias * INTERVAL '1 day');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calcular_liberacao ON public.turmas_questoes;
CREATE TRIGGER trg_calcular_liberacao
  BEFORE INSERT ON public.turmas_questoes
  FOR EACH ROW EXECUTE FUNCTION public.calcular_liberacao_turma();

-- Categorias iniciais
INSERT INTO public.turmas_categorias (nome, cor, icone) VALUES
  ('Carreiras Fiscais', '#6366f1', 'Calculator'),
  ('Direito', '#0ea5e9', 'Scale'),
  ('Administração Pública', '#10b981', 'Building'),
  ('Policial', '#f59e0b', 'Shield')
ON CONFLICT DO NOTHING;

-- Vínculo opcional em weekly_questions
ALTER TABLE public.weekly_questions
  ADD COLUMN IF NOT EXISTS album_id uuid REFERENCES public.turmas_albuns(id) ON DELETE SET NULL;
