
-- Add approval status and coordinates to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Allow admins to update any profile (for approval)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage submissions (delete)
CREATE POLICY "Admins can delete submissions" ON public.submissions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update submissions
CREATE POLICY "Admins can update submissions" ON public.submissions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
