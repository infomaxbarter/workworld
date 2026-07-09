
-- Pilot countries
CREATE TABLE public.pilot_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  name_i18n jsonb DEFAULT '{}'::jsonb,
  flag_emoji text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pilot_countries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pilot_countries TO authenticated;
GRANT ALL ON public.pilot_countries TO service_role;
ALTER TABLE public.pilot_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pilot countries" ON public.pilot_countries FOR SELECT USING (true);
CREATE POLICY "Admins manage pilot countries" ON public.pilot_countries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- MCI cities
CREATE TABLE public.mci_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country_code text NOT NULL REFERENCES public.pilot_countries(code) ON UPDATE CASCADE,
  slug text UNIQUE,
  n_population bigint NOT NULL DEFAULT 100000,
  g_gdp_per_capita numeric NOT NULL DEFAULT 10000,
  f_firms bigint NOT NULL DEFAULT 1000,
  u_universities int NOT NULL DEFAULT 1,
  s_industrial_zones int NOT NULL DEFAULT 0,
  t_tech_parks int NOT NULL DEFAULT 0,
  p_search numeric NOT NULL DEFAULT 5,
  m_loc numeric NOT NULL DEFAULT 100,
  h_vc_access numeric NOT NULL DEFAULT 5,
  t_flow numeric NOT NULL DEFAULT 5,
  ai_index numeric NOT NULL DEFAULT 5,
  esg_score numeric NOT NULL DEFAULT 5,
  exp_billion_usd numeric NOT NULL DEFAULT 1,
  imp_billion_usd numeric NOT NULL DEFAULT 1,
  y_ratio numeric NOT NULL DEFAULT 0.35,
  e_ratio numeric NOT NULL DEFAULT 0.15,
  b_rate numeric NOT NULL DEFAULT 2.0,
  sigma numeric NOT NULL DEFAULT 0,
  delta_pulse numeric NOT NULL DEFAULT 1.0,
  net_syn numeric NOT NULL DEFAULT 1.0,
  cp_final numeric,
  seat_quota int,
  approved boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mci_cities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mci_cities TO authenticated;
GRANT ALL ON public.mci_cities TO service_role;
ALTER TABLE public.mci_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved MCI cities" ON public.mci_cities FOR SELECT USING (approved OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage MCI cities" ON public.mci_cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- MCI submissions (user proposals for new city / update)
CREATE TABLE public.mci_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city_id uuid REFERENCES public.mci_cities(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'create', -- create | update
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  review_note text,
  reviewer_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mci_submissions TO authenticated;
GRANT ALL ON public.mci_submissions TO service_role;
ALTER TABLE public.mci_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own submissions or admin views all" ON public.mci_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can submit" ON public.mci_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update/delete submissions" ON public.mci_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete submissions" ON public.mci_submissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Slug trigger for MCI cities
CREATE OR REPLACE FUNCTION public.set_mci_city_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE base_slug text; final_slug text; counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.city || '-' || NEW.country_code);
    final_slug := base_slug;
    WHILE EXISTS(SELECT 1 FROM mci_cities WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1; final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER set_mci_city_slug_trigger BEFORE INSERT OR UPDATE ON public.mci_cities
  FOR EACH ROW EXECUTE FUNCTION public.set_mci_city_slug();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER touch_pilot_countries BEFORE UPDATE ON public.pilot_countries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_mci_cities BEFORE UPDATE ON public.mci_cities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_mci_submissions BEFORE UPDATE ON public.mci_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed pilot countries
INSERT INTO public.pilot_countries (code, name, name_i18n, flag_emoji, active) VALUES
  ('TR', 'Türkiye', '{"tr":"Türkiye","en":"Turkey","de":"Türkei"}', '🇹🇷', true),
  ('DE', 'Germany', '{"tr":"Almanya","en":"Germany","de":"Deutschland"}', '🇩🇪', true),
  ('NL', 'Netherlands', '{"tr":"Hollanda","en":"Netherlands","de":"Niederlande"}', '🇳🇱', true),
  ('AE', 'United Arab Emirates', '{"tr":"Birleşik Arap Emirlikleri","en":"United Arab Emirates","de":"Vereinigte Arabische Emirate"}', '🇦🇪', true),
  ('US', 'United States', '{"tr":"Amerika Birleşik Devletleri","en":"United States","de":"Vereinigte Staaten"}', '🇺🇸', true)
ON CONFLICT (code) DO NOTHING;

-- Add country_code to existing tables for pilot filtering (nullable, backwards compatible)
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.professions ADD COLUMN IF NOT EXISTS country_code text;
