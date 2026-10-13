-- ============================================
-- Bodega SaaS — Migración 003: tasa BCV central por tienda
-- ============================================

alter table public.stores
  add column if not exists tasa_bcv numeric(10,4) not null default 0
  check (tasa_bcv >= 0);

-- Bucket de logos (el settings lo usa pero nunca se creó)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_select_public" on storage.objects;
create policy "logos_select_public"
  on storage.objects for select
  using (bucket_id = 'logos');

drop policy if exists "logos_insert_auth" on storage.objects;
create policy "logos_insert_auth"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.role() = 'authenticated');

drop policy if exists "logos_delete_owner" on storage.objects;
create policy "logos_delete_owner"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);
