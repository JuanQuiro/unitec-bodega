-- ============================================
-- Bodega SaaS — Migración 008: fotos de pedidos (evidencia)
-- Bucket PRIVADO 'pedidos' + tabla order_photos
-- Uso: foto de armado (preparacion), de la entrega (entrega),
--      comprobantes de pago (comprobante), otros (otro)
-- Ruta de archivos: stores/<store_id>/fotos/<order_id>/<archivo>
-- ============================================

insert into storage.buckets (id, name, public)
values ('pedidos', 'pedidos', false)
on conflict (id) do nothing;

create table if not exists public.order_photos (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  payment_id uuid references public.bodega_payments(id) on delete set null,
  kind text not null default 'otro',
  path text not null,
  uploaded_by uuid,
  created_at timestamptz default now()
);

do $$ begin
  alter table public.order_photos add constraint order_photos_kind_check
    check (kind in ('preparacion','entrega','comprobante','otro'));
exception when duplicate_object then null; end $$;

create index if not exists idx_order_photos_order on public.order_photos(order_id, created_at);

alter table public.order_photos enable row level security;

-- RLS tabla: dueño o miembro de la tienda
drop policy if exists "order_photos_select_member" on public.order_photos;
create policy "order_photos_select_member" on public.order_photos for select
  using (
    exists (select 1 from public.stores s where s.id = order_photos.store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.bodega_members m where m.store_id = order_photos.store_id and m.user_id = auth.uid())
  );

drop policy if exists "order_photos_insert_member" on public.order_photos;
create policy "order_photos_insert_member" on public.order_photos for insert
  with check (
    exists (select 1 from public.stores s where s.id = order_photos.store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.bodega_members m where m.store_id = order_photos.store_id and m.user_id = auth.uid())
  );

drop policy if exists "order_photos_delete_member" on public.order_photos;
create policy "order_photos_delete_member" on public.order_photos for delete
  using (
    exists (select 1 from public.stores s where s.id = order_photos.store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.bodega_members m where m.store_id = order_photos.store_id and m.user_id = auth.uid())
  );

grant select, insert, delete on public.order_photos to authenticated;

-- RLS storage: bucket privado, acceso por membresía (igual patrón que 006)
drop policy if exists "pedidos_insert_store" on storage.objects;
create policy "pedidos_insert_store" on storage.objects for insert
  with check (
    bucket_id = 'pedidos'
    and auth.role() = 'authenticated'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[2] and s.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.bodega_members m
        where m.store_id::text = (storage.foldername(name))[2] and m.user_id = auth.uid()
      )
    )
  );

drop policy if exists "pedidos_select_store" on storage.objects;
create policy "pedidos_select_store" on storage.objects for select
  using (
    bucket_id = 'pedidos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[2] and s.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.bodega_members m
        where m.store_id::text = (storage.foldername(name))[2] and m.user_id = auth.uid()
      )
    )
  );

drop policy if exists "pedidos_delete_store" on storage.objects;
create policy "pedidos_delete_store" on storage.objects for delete
  using (
    bucket_id = 'pedidos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[2] and s.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.bodega_members m
        where m.store_id::text = (storage.foldername(name))[2] and m.user_id = auth.uid()
      )
    )
  );
