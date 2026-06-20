-- =====================================================================
-- MINI VAT PREMIUM — Storage: buckets + policies (0002)
-- Fonte: prompts/02-database.md tarefa 8
-- Rodar APOS 0001 (depende de public.is_admin()).
-- =====================================================================

-- buckets (publicos para read; private nao)
insert into storage.buckets (id, name, public) values
  ('products',   'products',   true),
  ('banners',    'banners',    true),
  ('categories', 'categories', true),
  ('private',    'private',    false)
on conflict (id) do nothing;

-- ----- products -----
create policy "products_public_read" on storage.objects
  for select using (bucket_id = 'products');
create policy "products_admin_write" on storage.objects
  for insert with check (bucket_id = 'products' and public.is_admin());
create policy "products_admin_update" on storage.objects
  for update using (bucket_id = 'products' and public.is_admin());
create policy "products_admin_delete" on storage.objects
  for delete using (bucket_id = 'products' and public.is_admin());

-- ----- banners -----
create policy "banners_public_read" on storage.objects
  for select using (bucket_id = 'banners');
create policy "banners_admin_write" on storage.objects
  for insert with check (bucket_id = 'banners' and public.is_admin());
create policy "banners_admin_update" on storage.objects
  for update using (bucket_id = 'banners' and public.is_admin());
create policy "banners_admin_delete" on storage.objects
  for delete using (bucket_id = 'banners' and public.is_admin());

-- ----- categories -----
create policy "categories_public_read" on storage.objects
  for select using (bucket_id = 'categories');
create policy "categories_admin_write" on storage.objects
  for insert with check (bucket_id = 'categories' and public.is_admin());
create policy "categories_admin_update" on storage.objects
  for update using (bucket_id = 'categories' and public.is_admin());
create policy "categories_admin_delete" on storage.objects
  for delete using (bucket_id = 'categories' and public.is_admin());

-- ----- private (read autenticado; write admin) -----
create policy "private_auth_read" on storage.objects
  for select using (bucket_id = 'private' and auth.role() = 'authenticated');
create policy "private_admin_write" on storage.objects
  for insert with check (bucket_id = 'private' and public.is_admin());
create policy "private_admin_update" on storage.objects
  for update using (bucket_id = 'private' and public.is_admin());
create policy "private_admin_delete" on storage.objects
  for delete using (bucket_id = 'private' and public.is_admin());
