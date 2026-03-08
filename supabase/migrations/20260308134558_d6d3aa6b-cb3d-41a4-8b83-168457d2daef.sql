
-- Add status column to event_markers
ALTER TABLE public.event_markers ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add status column to profiles  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add status column to user_markers
ALTER TABLE public.user_markers ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
