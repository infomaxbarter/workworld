-- event_markers
ALTER TABLE public.event_markers
  ADD COLUMN IF NOT EXISTS title_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n jsonb DEFAULT '{}'::jsonb;

UPDATE public.event_markers
SET title_i18n = jsonb_build_object('tr', COALESCE(title, ''))
WHERE title_i18n IS NULL OR title_i18n = '{}'::jsonb;

UPDATE public.event_markers
SET description_i18n = jsonb_build_object('tr', COALESCE(description, ''))
WHERE description IS NOT NULL AND (description_i18n IS NULL OR description_i18n = '{}'::jsonb);

-- professions
ALTER TABLE public.professions
  ADD COLUMN IF NOT EXISTS name_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n jsonb DEFAULT '{}'::jsonb;

UPDATE public.professions
SET name_i18n = jsonb_build_object('tr', COALESCE(name, ''))
WHERE name_i18n IS NULL OR name_i18n = '{}'::jsonb;

UPDATE public.professions
SET description_i18n = jsonb_build_object('tr', COALESCE(description, ''))
WHERE description IS NOT NULL AND (description_i18n IS NULL OR description_i18n = '{}'::jsonb);

-- user_markers
ALTER TABLE public.user_markers
  ADD COLUMN IF NOT EXISTS name_i18n jsonb DEFAULT '{}'::jsonb;

UPDATE public.user_markers
SET name_i18n = jsonb_build_object('tr', COALESCE(name, ''))
WHERE name_i18n IS NULL OR name_i18n = '{}'::jsonb;

-- profiles (only bio is translatable; display_name stays single)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio_i18n jsonb DEFAULT '{}'::jsonb;

UPDATE public.profiles
SET bio_i18n = jsonb_build_object('tr', COALESCE(bio, ''))
WHERE bio IS NOT NULL AND (bio_i18n IS NULL OR bio_i18n = '{}'::jsonb);

-- posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_i18n jsonb DEFAULT '{}'::jsonb;

UPDATE public.posts
SET title_i18n = jsonb_build_object('tr', COALESCE(title, ''))
WHERE title_i18n IS NULL OR title_i18n = '{}'::jsonb;

UPDATE public.posts
SET content_i18n = jsonb_build_object('tr', COALESCE(content, ''))
WHERE content_i18n IS NULL OR content_i18n = '{}'::jsonb;

-- comments
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS content_i18n jsonb DEFAULT '{}'::jsonb;

UPDATE public.comments
SET content_i18n = jsonb_build_object('tr', COALESCE(content, ''))
WHERE content_i18n IS NULL OR content_i18n = '{}'::jsonb;