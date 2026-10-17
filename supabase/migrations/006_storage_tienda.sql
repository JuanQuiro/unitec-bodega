-- ============================================
-- Bodega SaaS — Migración 006: storage por tienda
-- Solo dueño o miembro puede subir/borrar en su carpeta.
-- Rutas: stores/<store_id>/<archivo>
-- ============================================

-- PRODUCTOS: insert
drop policy if exists "storage_insert_auth" on storage.objects;
create policy "productos_insert_store" on storage.objects
  for insert with check (
    bucket_id = 'productos'
    and auth.role() = 'authenticated'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[2]
          and s.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.bodega_members m
        where m.store_id::text = (storage.foldername(name))[2]
          and m.user_id = auth.uid()
      )
    )
  );

-- PRODUCTOS: delete
drop policy if exists "storage_delete_owner" on storage.objects;
create policy "productos_delete_store" on storage.objects
  for delete using (
    bucket_id = 'productos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[2]
          and s.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.bodega_members m
        where m.store_id::text = (storage.foldername(name))[2]
          and m.user_id = auth.uid()
      )
    )
  );

-- LOGOS: insert
drop policy if exists "logos_insert_auth" on storage.objects;
create policy "logos_insert_store" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[2]
          and s.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.bodega_members m
        where m.store_id::text = (storage.foldername(name))[2]
          and m.user_id = auth.uid()
      )
    )
  );

-- LOGOS: delete
drop policy if exists "logos_delete_owner" on storage.objects;
create policy "logos_delete_store" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[2]
          and s.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.bodega_members m
        where m.store_id::text = (storage.foldername(name))[2]
          and m.user_id = auth.uid()
      )
    )
  );
