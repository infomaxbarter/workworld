
-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_markers table
CREATE TABLE public.user_markers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_markers table
CREATE TABLE public.event_markers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_markers ENABLE ROW LEVEL SECURITY;

-- Public can read markers
CREATE POLICY "Anyone can view user markers" ON public.user_markers FOR SELECT USING (true);
CREATE POLICY "Anyone can view event markers" ON public.event_markers FOR SELECT USING (true);

-- Public can insert submissions
CREATE POLICY "Anyone can submit" ON public.submissions FOR INSERT WITH CHECK (true);
