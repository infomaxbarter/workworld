
-- Add city/country to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

-- Add city/country to user_markers
ALTER TABLE public.user_markers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.user_markers ADD COLUMN IF NOT EXISTS country text;

-- Add city/country and enhanced fields to event_markers
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS capacity integer;
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS start_date text;
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS end_date text;
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS external_url text;

-- Create event_gallery table
CREATE TABLE public.event_gallery (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.event_markers(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event gallery" ON public.event_gallery FOR SELECT USING (true);
CREATE POLICY "Admins can manage event gallery" ON public.event_gallery FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
