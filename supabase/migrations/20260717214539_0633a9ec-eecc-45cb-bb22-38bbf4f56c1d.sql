
CREATE TABLE public.media_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('blog','video','podcast')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  body text,
  title_i18n jsonb DEFAULT '{}'::jsonb,
  description_i18n jsonb DEFAULT '{}'::jsonb,
  body_i18n jsonb DEFAULT '{}'::jsonb,
  cover_url text,
  media_url text,
  duration_seconds integer,
  tags text[] DEFAULT '{}',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_content TO authenticated;
GRANT SELECT ON public.media_content TO anon;
GRANT ALL ON public.media_content TO service_role;

ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved media"
  ON public.media_content FOR SELECT
  USING (status = 'approved' OR auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can submit drafts"
  ON public.media_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Authors can update their pending items"
  ON public.media_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'pending')
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all media"
  ON public.media_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can delete their pending items"
  ON public.media_content FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'pending');

-- slug trigger reusing generate_slug
CREATE OR REPLACE FUNCTION public.set_media_content_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE base_slug text; final_slug text; counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_slug(NEW.title);
    final_slug := base_slug;
    WHILE EXISTS(SELECT 1 FROM public.media_content WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_media_content_slug
BEFORE INSERT OR UPDATE ON public.media_content
FOR EACH ROW EXECUTE FUNCTION public.set_media_content_slug();

CREATE TRIGGER trg_media_content_updated_at
BEFORE UPDATE ON public.media_content
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_media_content_type_status ON public.media_content(type, status);
CREATE INDEX idx_media_content_published ON public.media_content(published_at DESC);
