-- ============================================
-- Bodega SaaS — Migración inicial
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLAS
-- ============================================

create table public.stores (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  slug text unique not null,
  nombre text not null,
  whatsapp text not null,
  logo_url text,
  direccion text,
  activa boolean default true,
  created_at timestamptz default now()
);

create table public.products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  nombre text not null,
  precio numeric(10,2) not null check (precio >= 0),
  stock integer default 0 check (stock >= 0),
  foto_url text,
  unidad text default 'unidad', -- unidad, kg, detal, bulto
  categoria text default 'viveres',
  activo boolean default true,
  created_at timestamptz default now()
);

create table public.zones (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  nombre text not null,
  costo numeric(10,2) default 0,
  minimo numeric(10,2) default 0,
  created_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  cliente_nombre text not null,
  cliente_telefono text not null,
  cliente_direccion text not null,
  zone_id uuid references public.zones(id),
  items jsonb not null, -- [{product_id, nombre, cantidad, precio, subtotal}]
  total numeric(10,2) not null,
  estado text default 'pendiente', -- pendiente, confirmado, preparando, en_camino, entregado, cancelado
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index idx_products_store on public.products(store_id);
create index idx_orders_store on public.orders(store_id);
create index idx_orders_estado on public.orders(estado);
create index idx_zones_store on public.zones(store_id);

-- ============================================
-- RLS — Row Level Security
-- ============================================

alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.zones enable row level security;
alter table public.orders enable row level security;

-- Privilegios base para los roles de PostgREST
-- (las policies RLS de abajo deciden QUÉ filas ve cada uno)
grant select on public.stores to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.zones to anon, authenticated;
grant select, insert on public.orders to anon, authenticated;
grant update, delete on public.stores, public.products, public.zones, public.orders to authenticated;

-- --- STORES ---

-- Público puede ver tiendas activas (para link/QR)
create policy "stores_select_public"
  on public.stores for select
  using (activa = true);

-- Owner puede ver su tienda
create policy "stores_select_owner"
  on public.stores for select
  using (auth.uid() = owner_id);

-- Owner puede actualizar su tienda
create policy "stores_update_owner"
  on public.stores for update
  using (auth.uid() = owner_id);

-- Owner puede eliminar su tienda
create policy "stores_delete_owner"
  on public.stores for delete
  using (auth.uid() = owner_id);

-- Autenticados pueden crear su tienda (1 por usuario)
create policy "stores_insert_auth"
  on public.stores for insert
  with check (auth.uid() = owner_id);

-- --- PRODUCTS ---

-- Público puede ver productos activos
create policy "products_select_public"
  on public.products for select
  using (activo = true);

-- Owner CRUD completo
create policy "products_insert_owner"
  on public.products for insert
  with check (auth.uid() = (select owner_id from public.stores where id = store_id));

create policy "products_update_owner"
  on public.products for update
  using (auth.uid() = (select owner_id from public.stores where id = store_id));

create policy "products_delete_owner"
  on public.products for delete
  using (auth.uid() = (select owner_id from public.stores where id = store_id));

-- --- ZONES ---

-- Público puede ver zonas
create policy "zones_select_public"
  on public.zones for select
  using (true);

-- Owner CRUD
create policy "zones_insert_owner"
  on public.zones for insert
  with check (auth.uid() = (select owner_id from public.stores where id = store_id));

create policy "zones_update_owner"
  on public.zones for update
  using (auth.uid() = (select owner_id from public.stores where id = store_id));

create policy "zones_delete_owner"
  on public.zones for delete
  using (auth.uid() = (select owner_id from public.stores where id = store_id));

-- --- ORDERS ---

-- Público puede crear pedidos (el cliente pide sin login)
create policy "orders_insert_public"
  on public.orders for insert
  with check (true);

-- Público puede ver sus propios pedidos por teléfono
create policy "orders_select_public"
  on public.orders for select
  using (cliente_telefono = current_setting('app.current_phone', true));

-- Owner puede ver todos sus pedidos
create policy "orders_select_owner"
  on public.orders for select
  using (auth.uid() = (select owner_id from public.stores where id = store_id));

-- Owner puede actualizar estado
create policy "orders_update_owner"
  on public.orders for update
  using (auth.uid() = (select owner_id from public.stores where id = store_id));

-- ============================================
-- STORAGE — Bucket para fotos de productos
-- ============================================

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- Política: público puede leer fotos
create policy "storage_select_public"
  on storage.objects for select
  using (bucket_id = 'productos');

-- Política: autenticados pueden subir
create policy "storage_insert_auth"
  on storage.objects for insert
  with check (bucket_id = 'productos' and auth.role() = 'authenticated');

-- Política: owner puede borrar sus fotos
create policy "storage_delete_owner"
  on storage.objects for delete
  using (bucket_id = 'productos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- FUNCIÓN — updated_at automático
-- ============================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- ============================================
-- FUNCIÓN — Crear tienda al registrarse
-- ============================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.stores (owner_id, slug, nombre, whatsapp)
  values (
    new.id,
    coalesce(nullif(lower(regexp_replace(coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', ''), '[^a-zA-Z0-9]', '', 'g')), ''), 'bodega-' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', 'Mi Bodega'),
    coalesce(new.raw_user_meta_data->>'whatsapp', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
