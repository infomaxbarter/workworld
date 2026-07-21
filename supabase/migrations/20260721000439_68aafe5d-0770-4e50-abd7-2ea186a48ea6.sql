
-- Profiles: telegram field
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram text;

-- Representatives table
CREATE TABLE IF NOT EXISTS public.mci_city_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.mci_cities(id) ON DELETE CASCADE,
  profession_id uuid NOT NULL REFERENCES public.professions(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  slot_index int NOT NULL DEFAULT 1,
  notes text,
  appointed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  appointed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city_id, profession_id, slot_index)
);
CREATE INDEX IF NOT EXISTS idx_reps_city ON public.mci_city_representatives(city_id);
CREATE INDEX IF NOT EXISTS idx_reps_profile ON public.mci_city_representatives(profile_id);

GRANT SELECT ON public.mci_city_representatives TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mci_city_representatives TO authenticated;
GRANT ALL ON public.mci_city_representatives TO service_role;
ALTER TABLE public.mci_city_representatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads representatives" ON public.mci_city_representatives
  FOR SELECT USING (true);
CREATE POLICY "Admins manage representatives" ON public.mci_city_representatives
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reps_updated
  BEFORE UPDATE ON public.mci_city_representatives
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seat applications table
CREATE TABLE IF NOT EXISTS public.mci_seat_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.mci_cities(id) ON DELETE CASCADE,
  profession_id uuid REFERENCES public.professions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  review_note text,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_apps_city ON public.mci_seat_applications(city_id);
CREATE INDEX IF NOT EXISTS idx_apps_user ON public.mci_seat_applications(user_id);

GRANT SELECT ON public.mci_seat_applications TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mci_seat_applications TO authenticated;
GRANT ALL ON public.mci_seat_applications TO service_role;
ALTER TABLE public.mci_seat_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads applications" ON public.mci_seat_applications
  FOR SELECT USING (true);
CREATE POLICY "Users insert own applications" ON public.mci_seat_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pending" ON public.mci_seat_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own pending" ON public.mci_seat_applications
  FOR DELETE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins manage applications" ON public.mci_seat_applications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_apps_updated
  BEFORE UPDATE ON public.mci_seat_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
