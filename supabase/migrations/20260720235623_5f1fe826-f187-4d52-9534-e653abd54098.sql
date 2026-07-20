
-- 1. Add data quality columns to mci_cities
ALTER TABLE public.mci_cities
  ADD COLUMN IF NOT EXISTS data_quality_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_computed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified','partial','verified','disputed')),
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS data_version int DEFAULT 1;

-- 2. History table
CREATE TABLE IF NOT EXISTS public.mci_city_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.mci_cities(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_type text NOT NULL DEFAULT 'update',
  snapshot jsonb NOT NULL,
  diff jsonb,
  reason text
);
CREATE INDEX IF NOT EXISTS idx_mci_city_history_city ON public.mci_city_history(city_id, changed_at DESC);

GRANT SELECT ON public.mci_city_history TO anon, authenticated;
GRANT ALL ON public.mci_city_history TO service_role;
ALTER TABLE public.mci_city_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read city history" ON public.mci_city_history
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage history" ON public.mci_city_history
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Per-metric source tracking
CREATE TABLE IF NOT EXISTS public.mci_metric_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.mci_cities(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  source_name text NOT NULL,
  source_url text,
  data_date date,
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city_id, metric_key)
);
CREATE INDEX IF NOT EXISTS idx_mci_metric_sources_city ON public.mci_metric_sources(city_id);

GRANT SELECT ON public.mci_metric_sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mci_metric_sources TO authenticated;
GRANT ALL ON public.mci_metric_sources TO service_role;
ALTER TABLE public.mci_metric_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read metric sources" ON public.mci_metric_sources
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage metric sources" ON public.mci_metric_sources
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mci_metric_sources_updated
  BEFORE UPDATE ON public.mci_metric_sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Function: compute data quality score
CREATE OR REPLACE FUNCTION public.mci_compute_quality(_city_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_count int;
  avg_conf numeric;
  verified_count int;
  total_metrics int := 19;
  score numeric;
BEGIN
  SELECT COUNT(*), COALESCE(AVG(confidence), 0), COUNT(*) FILTER (WHERE verified_at IS NOT NULL)
    INTO source_count, avg_conf, verified_count
  FROM public.mci_metric_sources
  WHERE city_id = _city_id;

  -- 60% coverage, 30% confidence, 10% verification
  score := ROUND(
    (LEAST(source_count::numeric / total_metrics, 1) * 60)
    + (avg_conf * 30)
    + (LEAST(verified_count::numeric / total_metrics, 1) * 10),
    2
  );

  UPDATE public.mci_cities SET data_quality_score = score WHERE id = _city_id;
END;
$$;

-- 5. History trigger on mci_cities updates
CREATE OR REPLACE FUNCTION public.mci_city_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  diff_json jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Only record if meaningful fields changed
    IF ROW(NEW.exp_billion_usd, NEW.imp_billion_usd, NEW.n_population, NEW.g_gdp_per_capita,
           NEW.f_firms, NEW.u_universities, NEW.s_industrial_zones, NEW.t_tech_parks,
           NEW.p_search, NEW.m_loc, NEW.h_vc_access, NEW.t_flow, NEW.ai_index, NEW.esg_score,
           NEW.approved, NEW.verification_status)
       IS DISTINCT FROM
       ROW(OLD.exp_billion_usd, OLD.imp_billion_usd, OLD.n_population, OLD.g_gdp_per_capita,
           OLD.f_firms, OLD.u_universities, OLD.s_industrial_zones, OLD.t_tech_parks,
           OLD.p_search, OLD.m_loc, OLD.h_vc_access, OLD.t_flow, OLD.ai_index, OLD.esg_score,
           OLD.approved, OLD.verification_status) THEN

      INSERT INTO public.mci_city_history (city_id, changed_by, change_type, snapshot)
      VALUES (NEW.id, auth.uid(), 'update', to_jsonb(NEW));

      NEW.data_version := COALESCE(OLD.data_version, 1) + 1;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.mci_city_history (city_id, changed_by, change_type, snapshot)
    VALUES (NEW.id, auth.uid(), 'create', to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mci_city_snapshot ON public.mci_cities;
CREATE TRIGGER trg_mci_city_snapshot
  BEFORE INSERT OR UPDATE ON public.mci_cities
  FOR EACH ROW EXECUTE FUNCTION public.mci_city_snapshot();

-- 6. Auto-update quality score when sources change
CREATE OR REPLACE FUNCTION public.mci_source_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.mci_compute_quality(COALESCE(NEW.city_id, OLD.city_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_mci_source_quality ON public.mci_metric_sources;
CREATE TRIGGER trg_mci_source_quality
  AFTER INSERT OR UPDATE OR DELETE ON public.mci_metric_sources
  FOR EACH ROW EXECUTE FUNCTION public.mci_source_trigger();
