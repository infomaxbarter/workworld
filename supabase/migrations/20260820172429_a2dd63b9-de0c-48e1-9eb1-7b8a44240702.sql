
CREATE TABLE public.tr_provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_no integer NOT NULL UNIQUE,
  name text NOT NULL,
  slug text,
  region text NOT NULL,
  tier text NOT NULL,
  focus_sectors text,
  target_representatives integer NOT NULL DEFAULT 1,
  local_hubs text,
  community_channels text,
  value_proposition text,
  name_i18n jsonb,
  value_proposition_i18n jsonb,
  lat double precision,
  lng double precision,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tr_provinces TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tr_provinces TO authenticated;
GRANT ALL ON public.tr_provinces TO service_role;
ALTER TABLE public.tr_provinces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provinces_public_read" ON public.tr_provinces FOR SELECT USING (true);
CREATE POLICY "provinces_admin_write" ON public.tr_provinces FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_provinces_touch BEFORE UPDATE ON public.tr_provinces FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.tr_verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text,
  target_roles text,
  barter_supply text,
  typical_demand text,
  ideal_representative text,
  discovery_channels text,
  name_i18n jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tr_verticals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tr_verticals TO authenticated;
GRANT ALL ON public.tr_verticals TO service_role;
ALTER TABLE public.tr_verticals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verticals_public_read" ON public.tr_verticals FOR SELECT USING (true);
CREATE POLICY "verticals_admin_write" ON public.tr_verticals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_verticals_touch BEFORE UPDATE ON public.tr_verticals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.ambassador_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  requirements text,
  rights text,
  badges text,
  motivation text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ambassador_levels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambassador_levels TO authenticated;
GRANT ALL ON public.ambassador_levels TO service_role;
ALTER TABLE public.ambassador_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_public_read" ON public.ambassador_levels FOR SELECT USING (true);
CREATE POLICY "levels_admin_write" ON public.ambassador_levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER ambassador_levels_touch BEFORE UPDATE ON public.ambassador_levels FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  audience text NOT NULL,
  channel text,
  subject text,
  body text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outreach_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_templates TO authenticated;
GRANT ALL ON public.outreach_templates TO service_role;
ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_public_read" ON public.outreach_templates FOR SELECT USING (true);
CREATE POLICY "templates_admin_write" ON public.outreach_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER outreach_templates_touch BEFORE UPDATE ON public.outreach_templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  full_name text NOT NULL,
  city text,
  region text,
  tier text,
  vertical text,
  current_title text,
  target_role text,
  quality_score integer NOT NULL DEFAULT 3,
  channel text,
  stage text NOT NULL DEFAULT '1. Aday Havuzu',
  owner text,
  last_contact_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_admin_all" ON public.crm_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER crm_leads_touch BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
