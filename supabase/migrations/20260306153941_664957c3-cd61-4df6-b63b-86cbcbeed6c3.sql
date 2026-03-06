
-- Add slug columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE event_markers ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create profile_edit_requests table
CREATE TABLE public.profile_edit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  old_data jsonb NOT NULL DEFAULT '{}',
  new_data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE profile_edit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edit requests" ON profile_edit_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create edit requests" ON profile_edit_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage edit requests" ON profile_edit_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Slug generation function
CREATE OR REPLACE FUNCTION generate_slug(input text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  slug text;
BEGIN
  slug := lower(trim(input));
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  IF slug = '' THEN slug := 'user'; END IF;
  RETURN slug;
END;
$$;

-- Profile slug trigger
CREATE OR REPLACE FUNCTION set_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.display_name);
    final_slug := base_slug;
    WHILE EXISTS(SELECT 1 FROM profiles WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_profile_slug
  BEFORE INSERT OR UPDATE OF display_name, slug ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_profile_slug();

-- Event slug trigger
CREATE OR REPLACE FUNCTION set_event_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.title);
    final_slug := base_slug;
    WHILE EXISTS(SELECT 1 FROM event_markers WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_event_slug
  BEFORE INSERT OR UPDATE OF title, slug ON event_markers
  FOR EACH ROW EXECUTE FUNCTION set_event_slug();

-- Generate slugs for existing rows
UPDATE profiles SET slug = NULL;
UPDATE event_markers SET slug = NULL;

-- Notify admins function (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION notify_admins(
  _type text,
  _title text,
  _message text DEFAULT NULL,
  _link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN SELECT user_id FROM user_roles WHERE role = 'admin' LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (admin_record.user_id, _type, _title, _message, _link);
  END LOOP;
END;
$$;

-- Create notification for a specific user (security definer)
CREATE OR REPLACE FUNCTION create_notification(
  _user_id uuid,
  _type text,
  _title text,
  _message text DEFAULT NULL,
  _link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (_user_id, _type, _title, _message, _link);
END;
$$;
