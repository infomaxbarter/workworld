
-- Professions table
CREATE TABLE public.professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  icon text DEFAULT 'briefcase',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view professions" ON public.professions FOR SELECT USING (true);
CREATE POLICY "Admins can manage professions" ON public.professions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Profile-Profession junction
CREATE TABLE public.profile_professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  profession_id uuid REFERENCES public.professions(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(profile_id, profession_id)
);
ALTER TABLE public.profile_professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profile_professions" ON public.profile_professions FOR SELECT USING (true);
CREATE POLICY "Users can manage own" ON public.profile_professions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_professions.profile_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Admins can manage profile_professions" ON public.profile_professions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Posts / Blog table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  slug text,
  status text NOT NULL DEFAULT 'pending',
  target_type text NOT NULL DEFAULT 'general',
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved posts" ON public.posts FOR SELECT USING (status = 'approved' OR author_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create posts" ON public.posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Admins can manage posts" ON public.posts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Slug trigger for posts
CREATE OR REPLACE FUNCTION public.set_post_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE base_slug text; final_slug text; counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.title);
    final_slug := base_slug;
    WHILE EXISTS(SELECT 1 FROM posts WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1; final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_post_slug_trigger BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION set_post_slug();

-- Slug trigger for professions
CREATE OR REPLACE FUNCTION public.set_profession_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE base_slug text; final_slug text; counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.name);
    final_slug := base_slug;
    WHILE EXISTS(SELECT 1 FROM professions WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1; final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_profession_slug_trigger BEFORE INSERT OR UPDATE ON public.professions FOR EACH ROW EXECUTE FUNCTION set_profession_slug();

-- Comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved comments" ON public.comments FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create comments" ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage comments" ON public.comments FOR ALL USING (has_role(auth.uid(), 'admin'));
