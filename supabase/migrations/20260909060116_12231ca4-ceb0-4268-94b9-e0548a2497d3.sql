
CREATE TABLE public.donation_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  name_i18n jsonb,
  description text,
  description_i18n jsonb,
  min_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  badge_label text,
  badge_color text NOT NULL DEFAULT '#f59e0b',
  badge_icon text NOT NULL DEFAULT 'heart',
  perks text,
  highlight_days integer NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donation_tiers TO anon, authenticated;
GRANT ALL ON public.donation_tiers TO service_role;
ALTER TABLE public.donation_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donation_tiers_public_read" ON public.donation_tiers FOR SELECT USING (true);
CREATE POLICY "donation_tiers_admin_all" ON public.donation_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.donation_tiers TO authenticated;

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tier_id uuid REFERENCES public.donation_tiers(id) ON DELETE SET NULL,
  donor_name text NOT NULL,
  email text,
  whatsapp text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  message text,
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'pending',
  show_publicly boolean NOT NULL DEFAULT true,
  admin_note text,
  donated_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.donations TO anon, authenticated;
GRANT UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_admin_all" ON public.donations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "donations_insert_any" ON public.donations FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');
CREATE POLICY "donations_own_read" ON public.donations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.donor_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  tier_id uuid REFERENCES public.donation_tiers(id) ON DELETE SET NULL,
  display_name text,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#f59e0b',
  icon text NOT NULL DEFAULT 'heart',
  featured boolean NOT NULL DEFAULT false,
  note text,
  starts_at date NOT NULL DEFAULT current_date,
  expires_at date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donor_badges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.donor_badges TO authenticated;
GRANT ALL ON public.donor_badges TO service_role;
ALTER TABLE public.donor_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donor_badges_public_read" ON public.donor_badges FOR SELECT USING (active = true);
CREATE POLICY "donor_badges_admin_all" ON public.donor_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  placement text NOT NULL DEFAULT 'sidebar',
  page_key text NOT NULL DEFAULT 'global',
  width integer,
  height integer,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ad_slots TO authenticated;
GRANT ALL ON public.ad_slots TO service_role;
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_slots_public_read" ON public.ad_slots FOR SELECT USING (true);
CREATE POLICY "ad_slots_admin_all" ON public.ad_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ad_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.ad_slots(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  image_url text,
  link_url text,
  advertiser text,
  cta_label text,
  weight integer NOT NULL DEFAULT 1,
  starts_at date,
  ends_at date,
  active boolean NOT NULL DEFAULT true,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_creatives TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ad_creatives TO authenticated;
GRANT ALL ON public.ad_creatives TO service_role;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_creatives_public_read" ON public.ad_creatives FOR SELECT USING (active = true);
CREATE POLICY "ad_creatives_admin_all" ON public.ad_creatives FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.ad_track(_creative_id uuid, _kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _kind = 'click' THEN
    UPDATE public.ad_creatives SET clicks = clicks + 1 WHERE id = _creative_id;
  ELSE
    UPDATE public.ad_creatives SET impressions = impressions + 1 WHERE id = _creative_id;
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.ad_track(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ad_track(uuid, text) TO anon, authenticated;

CREATE TRIGGER touch_donation_tiers BEFORE UPDATE ON public.donation_tiers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_donations BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_donor_badges BEFORE UPDATE ON public.donor_badges FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_ad_slots BEFORE UPDATE ON public.ad_slots FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_ad_creatives BEFORE UPDATE ON public.ad_creatives FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.donation_tiers (code,name,description,min_amount,badge_label,badge_color,badge_icon,perks,highlight_days,sort_order) VALUES
 ('supporter','Supporter','Keep the project running',10,'Supporter','#22c55e','heart','Donor badge on your profile',30,1),
 ('patron','Patron','Fund new city data',50,'Patron','#3b82f6','star','Badge + profile highlight in listings',90,2),
 ('partner','Partner','Sustain the open ecosystem',250,'Partner','#f59e0b','crown','Badge + featured placement + logo on supporters page',365,3);

INSERT INTO public.ad_slots (code,name,placement,page_key,width,height,description) VALUES
 ('home_hero','Home below hero','inline','home',1200,200,'Wide banner under the homepage hero'),
 ('sidebar_primary','Sidebar primary','sidebar','global',300,250,'Right rail on detail pages'),
 ('list_inline','List inline','inline','global',1200,120,'Inside listing pages');
