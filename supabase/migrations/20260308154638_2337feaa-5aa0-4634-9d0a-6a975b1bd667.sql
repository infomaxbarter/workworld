
CREATE TABLE public.user_marker_professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_marker_id uuid NOT NULL REFERENCES public.user_markers(id) ON DELETE CASCADE,
  profession_id uuid NOT NULL REFERENCES public.professions(id) ON DELETE CASCADE,
  UNIQUE(user_marker_id, profession_id)
);

ALTER TABLE public.user_marker_professions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user_marker_professions" ON public.user_marker_professions FOR SELECT USING (true);
CREATE POLICY "Admins can manage user_marker_professions" ON public.user_marker_professions FOR ALL USING (has_role(auth.uid(), 'admin'));
