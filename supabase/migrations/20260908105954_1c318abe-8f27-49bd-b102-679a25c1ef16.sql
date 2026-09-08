REVOKE EXECUTE ON FUNCTION public.mci_city_snapshot() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mci_city_snapshot_insert() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mci_source_trigger() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mci_compute_row(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.mci_compute_quality(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.notify_admins(text,text,text,text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.waitlist_position(uuid) FROM public, anon, authenticated;