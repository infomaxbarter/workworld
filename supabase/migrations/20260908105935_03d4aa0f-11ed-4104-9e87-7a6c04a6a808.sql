-- 1) Fix MCI snapshot trigger: history insert must happen AFTER the city row exists
DROP TRIGGER IF EXISTS trg_mci_city_snapshot ON public.mci_cities;

CREATE OR REPLACE FUNCTION public.mci_city_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
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
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.mci_city_snapshot_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.mci_city_history (city_id, changed_by, change_type, snapshot)
  VALUES (NEW.id, auth.uid(), 'create', to_jsonb(NEW));
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_mci_city_snapshot BEFORE UPDATE ON public.mci_cities
FOR EACH ROW EXECUTE FUNCTION public.mci_city_snapshot();
CREATE TRIGGER trg_mci_city_snapshot_insert AFTER INSERT ON public.mci_cities
FOR EACH ROW EXECUTE FUNCTION public.mci_city_snapshot_insert();

-- 2) Türkiye ecosystem cities into MCI
INSERT INTO public.mci_cities (city, country_code, n_population, g_gdp_per_capita, f_firms, u_universities, s_industrial_zones, t_tech_parks, p_search, m_loc, h_vc_access, t_flow, ai_index, esg_score, exp_billion_usd, imp_billion_usd, y_ratio, e_ratio, b_rate, sigma, delta_pulse, net_syn, approved, verification_status, notes)
SELECT v.* FROM (VALUES
 ('Bursa','TR',3200000,11800,65000,4,17,3,6.8,180,5.2,6.0,5.8,6.4,17.5,9.0,0.38,0.12,1.7,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - otomotiv/tekstil'),
 ('Antalya','TR',2700000,10500,52000,4,3,2,6.5,140,4.8,6.8,5.2,6.6,2.1,1.8,0.37,0.13,1.6,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - turizm/tarım'),
 ('Kocaeli','TR',2100000,16500,40000,2,13,3,6.2,120,5.5,6.2,5.9,6.0,16.0,20.0,0.36,0.11,1.7,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - sanayi/kimya'),
 ('Konya','TR',2300000,9200,48000,5,9,2,5.9,110,4.2,5.5,5.0,6.2,3.4,1.5,0.39,0.14,1.9,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - makine/tarım'),
 ('Adana','TR',2300000,8900,42000,3,3,2,5.7,95,4.0,5.6,4.8,5.9,2.9,2.4,0.41,0.15,2.0,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - tarım/enerji'),
 ('Gaziantep','TR',2200000,8400,45000,3,6,1,5.6,90,4.1,5.3,4.6,5.6,11.0,7.5,0.44,0.16,2.3,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - halı/gıda ihracat'),
 ('Kayseri','TR',1450000,9800,32000,4,2,2,5.5,80,4.0,5.2,4.9,6.0,4.2,2.0,0.40,0.13,1.9,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - mobilya/sanayi'),
 ('Eskişehir','TR',920000,11000,20000,4,2,2,6.0,85,4.6,5.4,5.6,6.8,1.6,1.1,0.36,0.12,1.5,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - havacılık/üniversite'),
 ('Mersin','TR',1950000,9300,38000,2,2,1,5.6,80,4.1,6.0,4.7,5.8,3.8,4.2,0.40,0.14,1.9,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - lojistik/liman'),
 ('Samsun','TR',1400000,8600,26000,2,3,1,5.3,70,3.8,5.0,4.5,6.0,1.1,0.7,0.37,0.13,1.7,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - Karadeniz merkezi'),
 ('Trabzon','TR',830000,8200,18000,2,2,1,5.2,60,3.6,5.1,4.3,6.1,1.5,0.6,0.35,0.13,1.5,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - fındık/liman'),
 ('Denizli','TR',1060000,10200,24000,1,3,1,5.4,65,3.9,5.0,4.5,6.0,4.6,1.9,0.38,0.12,1.7,0.02,1.00,1.00,true,'unverified','Türkiye ekosistemi - tekstil ihracat')
) AS v(city, country_code, n_population, g_gdp_per_capita, f_firms, u_universities, s_industrial_zones, t_tech_parks, p_search, m_loc, h_vc_access, t_flow, ai_index, esg_score, exp_billion_usd, imp_billion_usd, y_ratio, e_ratio, b_rate, sigma, delta_pulse, net_syn, approved, verification_status, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.mci_cities m WHERE m.city = v.city AND m.country_code = 'TR');

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.mci_cities WHERE country_code='TR' AND cp_final IS NULL LOOP
    PERFORM public.mci_compute_row(r.id);
  END LOOP;
END $$;

-- 3) site_settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_all" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_site_settings BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.site_settings (key, value) VALUES
 ('beta_mode', '{"enabled": true, "label": "BETA | EARLY ACCESS"}'::jsonb),
 ('chatbot', '{"enabled": true, "greeting": "Hi! I am the WorkWorldMap assistant. Ask me anything or pick a topic below."}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4) waitlist_lists
CREATE TABLE public.waitlist_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  mode text NOT NULL DEFAULT 'public' CHECK (mode IN ('public','private')),
  show_counter boolean NOT NULL DEFAULT true,
  invite_required boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.waitlist_lists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_lists TO authenticated;
GRANT ALL ON public.waitlist_lists TO service_role;
ALTER TABLE public.waitlist_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_lists_public_read" ON public.waitlist_lists FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "waitlist_lists_admin_all" ON public.waitlist_lists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_waitlist_lists BEFORE UPDATE ON public.waitlist_lists FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.waitlist_lists (name, slug, description, mode, is_default) VALUES
 ('Early Access', 'early-access', 'Public beta waitlist — see your position and invite friends to move up.', 'public', true),
 ('Private Invite', 'private-invite', 'Invite-only list for partners and communities.', 'private', false);

-- 5) waitlist_entries
CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.waitlist_lists(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  profession text,
  country text,
  city text,
  community text,
  referral_code text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  referred_by text,
  referral_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','invited','approved','rejected')),
  invite_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_id, email)
);
CREATE INDEX waitlist_entries_list_idx ON public.waitlist_entries(list_id, referral_count DESC, created_at ASC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_entries TO authenticated;
GRANT ALL ON public.waitlist_entries TO service_role;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_entries_admin_all" ON public.waitlist_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_waitlist_entries BEFORE UPDATE ON public.waitlist_entries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- position helper (public lists only)
CREATE OR REPLACE FUNCTION public.waitlist_position(_entry_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT count(*)::int + 1 FROM public.waitlist_entries e2, public.waitlist_entries e1
  WHERE e1.id = _entry_id AND e2.list_id = e1.list_id AND e2.id <> e1.id
    AND (e2.referral_count > e1.referral_count OR (e2.referral_count = e1.referral_count AND e2.created_at < e1.created_at));
$$;

CREATE OR REPLACE FUNCTION public.waitlist_join(_list_slug text, _full_name text, _email text, _profession text DEFAULT NULL, _country text DEFAULT NULL, _city text DEFAULT NULL, _community text DEFAULT NULL, _ref text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.waitlist_lists%ROWTYPE; e public.waitlist_entries%ROWTYPE; pos int; total int; existed boolean := false;
BEGIN
  SELECT * INTO l FROM public.waitlist_lists WHERE slug = _list_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'list_not_found'; END IF;
  IF length(trim(_full_name)) < 2 OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'invalid_input'; END IF;
  SELECT * INTO e FROM public.waitlist_entries WHERE list_id = l.id AND lower(email) = lower(trim(_email));
  IF FOUND THEN existed := true;
  ELSE
    INSERT INTO public.waitlist_entries (list_id, full_name, email, profession, country, city, community, referred_by)
    VALUES (l.id, trim(_full_name), lower(trim(_email)), NULLIF(trim(_profession),''), NULLIF(trim(_country),''), NULLIF(trim(_city),''), NULLIF(trim(_community),''), NULLIF(trim(_ref),''))
    RETURNING * INTO e;
    IF _ref IS NOT NULL AND _ref <> '' THEN
      UPDATE public.waitlist_entries SET referral_count = referral_count + 1 WHERE referral_code = _ref AND list_id = l.id;
    END IF;
  END IF;
  SELECT count(*) INTO total FROM public.waitlist_entries WHERE list_id = l.id;
  IF l.mode = 'public' THEN
    pos := public.waitlist_position(e.id);
    RETURN jsonb_build_object('mode','public','existed',existed,'position',pos,'total',total,'referral_code',e.referral_code,'referral_count',e.referral_count,'status',e.status);
  END IF;
  RETURN jsonb_build_object('mode','private','existed',existed,'status',e.status);
END; $$;

CREATE OR REPLACE FUNCTION public.waitlist_status(_referral_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE e public.waitlist_entries%ROWTYPE; l public.waitlist_lists%ROWTYPE; total int;
BEGIN
  SELECT * INTO e FROM public.waitlist_entries WHERE referral_code = _referral_code;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO l FROM public.waitlist_lists WHERE id = e.list_id;
  SELECT count(*) INTO total FROM public.waitlist_entries WHERE list_id = l.id;
  IF l.mode <> 'public' THEN RETURN jsonb_build_object('mode','private','status',e.status); END IF;
  RETURN jsonb_build_object('mode','public','position',public.waitlist_position(e.id),'total',total,'referral_code',e.referral_code,'referral_count',e.referral_count,'status',e.status,'first_name',split_part(e.full_name,' ',1));
END; $$;

CREATE OR REPLACE FUNCTION public.waitlist_count(_list_slug text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT count(*)::int FROM public.waitlist_entries e JOIN public.waitlist_lists l ON l.id = e.list_id
  WHERE l.slug = _list_slug AND l.active AND l.mode = 'public' AND l.show_counter;
$$;

CREATE OR REPLACE FUNCTION public.waitlist_redeem_invite(_invite_code text, _email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ok boolean;
BEGIN
  UPDATE public.waitlist_entries SET status = 'approved'
  WHERE invite_code = _invite_code AND lower(email) = lower(trim(_email)) AND status IN ('invited','pending')
  RETURNING true INTO ok;
  RETURN COALESCE(ok, false);
END; $$;

GRANT EXECUTE ON FUNCTION public.waitlist_join(text,text,text,text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.waitlist_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.waitlist_count(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.waitlist_redeem_invite(text,text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.waitlist_position(uuid) FROM public, anon;

-- 6) faq_items (chatbot knowledge base)
CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  question_i18n jsonb,
  answer_i18n jsonb,
  keywords text[] NOT NULL DEFAULT '{}',
  link_url text,
  link_label text,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faq_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_items TO authenticated;
GRANT ALL ON public.faq_items TO service_role;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_public_read" ON public.faq_items FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "faq_admin_all" ON public.faq_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_faq_items BEFORE UPDATE ON public.faq_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.faq_items (question, answer, keywords, link_url, link_label, category, sort_order) VALUES
 ('What is WorkWorldMap?', 'WorkWorldMap is an open-source, non-profit global community platform that maps professionals, events and cities on an interactive map.', '{about,what,workworldmap,platform,nedir,hakkında}', '/about', 'About us', 'general', 1),
 ('How do I join the beta?', 'Join the early-access waitlist with your name, e-mail, profession and city. Public lists show your position and let you move up by inviting friends.', '{beta,join,waitlist,early access,katıl,bekleme,invite,davet}', '/waitlist', 'Join the waitlist', 'membership', 2),
 ('How do I create a profile?', 'Sign in with e-mail or Google, then fill in your profile. New profiles are reviewed by an admin before they appear on the map.', '{profile,signup,register,account,profil,kayıt,üye}', '/auth', 'Sign in', 'membership', 3),
 ('What is the Matrix City Index (MCI)?', 'MCI is an open formula that scores cities by population, GDP, firms, universities, tech parks, VC access and more, and derives a seat quota for city representatives.', '{mci,index,city,score,matrix,şehir,puan,formula}', '/mci', 'Open MCI', 'data', 4),
 ('How can I become a city representative?', 'Open a city on the MCI page and apply for an empty seat that matches your profession. Admins review applications.', '{representative,seat,apply,temsilci,başvuru,koltuk}', '/mci', 'Browse cities', 'data', 5),
 ('Where can I see events?', 'All approved events are listed on the Events page and pinned on the map.', '{event,events,etkinlik,meetup,calendar}', '/events', 'Events', 'events', 6),
 ('How does the map work?', 'The map shows people, professions, events and the Türkiye ecosystem as layers. Use the sidebar to filter by country or profession.', '{map,harita,layer,filter,pin}', '/map', 'Open map', 'map', 7),
 ('What is the Türkiye Ecosystem?', 'A province-level programme covering all 81 provinces with professional verticals, ambassador levels and local hubs.', '{türkiye,turkiye,ecosystem,ekosistem,province,il,ambassador,elçi}', '/turkiye-ecosystem', 'Türkiye Ecosystem', 'data', 8),
 ('How is my data protected?', 'We follow KVKK/GDPR principles. Read our privacy, cookie and consent policies in the footer.', '{privacy,gdpr,kvkk,data,gizlilik,çerez,cookie}', '/kvkk', 'Privacy policy', 'legal', 9),
 ('How can I contact you?', 'Use the contact links in the footer (GitHub, LinkedIn, Telegram) or send a message via the About page.', '{contact,iletişim,email,support,help,yardım}', '/about', 'Contact', 'general', 10);