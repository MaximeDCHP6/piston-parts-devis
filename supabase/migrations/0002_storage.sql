-- Buckets de stockage + policies.
-- Convention de chemin : toujours préfixé par l'id du revendeur, ex.
-- "quotes-pdf/<reseller_id>/<quote_id>.pdf", ce qui permet des policies
-- RLS simples basées sur le premier segment du chemin.

insert into storage.buckets (id, name, public)
values
  ('reseller-logos', 'reseller-logos', true),
  ('quotes-pdf', 'quotes-pdf', false),
  ('reseller-files', 'reseller-files', false)
on conflict (id) do nothing;

-- reseller-logos : lecture publique (nécessaire pour l'affichage dans les
-- PDF et la page publique de devis), écriture réservée à l'admin.
create policy "reseller_logos_public_read" on storage.objects
  for select using (bucket_id = 'reseller-logos');
create policy "reseller_logos_admin_write" on storage.objects
  for insert with check (bucket_id = 'reseller-logos' and public.is_admin());
create policy "reseller_logos_admin_update" on storage.objects
  for update using (bucket_id = 'reseller-logos' and public.is_admin());
create policy "reseller_logos_admin_delete" on storage.objects
  for delete using (bucket_id = 'reseller-logos' and public.is_admin());

-- quotes-pdf : privé. Admin a accès total. Le revendeur ne peut lire que
-- les PDF sous son propre préfixe. La page publique /devis/[token] ne
-- passe pas par ces policies (route serveur avec la clé service_role).
create policy "quotes_pdf_admin_all" on storage.objects
  for all using (bucket_id = 'quotes-pdf' and public.is_admin())
  with check (bucket_id = 'quotes-pdf' and public.is_admin());
create policy "quotes_pdf_reseller_read" on storage.objects
  for select using (
    bucket_id = 'quotes-pdf'
    and (storage.foldername(name))[1] = public.current_reseller_id()::text
  );

-- reseller-files : privé, mêmes règles que quotes-pdf.
create policy "reseller_files_admin_all" on storage.objects
  for all using (bucket_id = 'reseller-files' and public.is_admin())
  with check (bucket_id = 'reseller-files' and public.is_admin());
create policy "reseller_files_reseller_read" on storage.objects
  for select using (
    bucket_id = 'reseller-files'
    and (storage.foldername(name))[1] = public.current_reseller_id()::text
  );
