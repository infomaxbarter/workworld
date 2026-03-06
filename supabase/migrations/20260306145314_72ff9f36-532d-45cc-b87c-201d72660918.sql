
-- Allow public read on submissions (admin panel needs it)
CREATE POLICY "Anyone can read submissions" ON public.submissions FOR SELECT USING (true);

-- Allow insert/update/delete on markers (admin panel)
CREATE POLICY "Anyone can insert user markers" ON public.user_markers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user markers" ON public.user_markers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete user markers" ON public.user_markers FOR DELETE USING (true);

CREATE POLICY "Anyone can insert event markers" ON public.event_markers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update event markers" ON public.event_markers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete event markers" ON public.event_markers FOR DELETE USING (true);
