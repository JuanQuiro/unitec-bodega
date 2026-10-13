-- ============================================
-- Bodega SaaS — Migración 002: contabilidad
-- Pagos (abonos), gastos, cierres de caja inmutables
-- + campos nuevos en products/orders
-- ============================================

-- --- Campos nuevos ---
alter table public.products
  add column if not exists descripcion text;
alter table public.products
  add column if not exists costo numeric(10,2) not null default 0
  check (costo >= 0);
alter table public.orders
  add column if not exists metodo_pago text not null default 'efectivo';
alter table public.orders
  add column if not exists tasa_bcv numeric(10,4) not null default 0
  check (tasa_bcv >= 0);

-- --- Pagos / abonos (cobros de pedidos, incl. fiados) ---
create table if not exists public.bodega_payments (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  cliente_nombre text not null default '',
  monto numeric(10,2) not null check (monto > 0),
  moneda text not null default 'VES' check (moneda in ('VES', 'USD')),
  metodo text not null default 'efectivo',
  referencia text not null default '',
  tasa_bcv numeric(10,4) not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_bodega_payments_store on public.bodega_payments(store_id);
create index if not exists idx_bodega_payments_order on public.bodega_payments(order_id);
create index if not exists idx_bodega_payments_created on public.bodega_payments(created_at);

-- --- Gastos (operativos afectan utilidad; retiros solo caja) ---
create table if not exists public.bodega_expenses (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  descripcion text not null,
  categoria text not null default 'general',
  proveedor text not null default '',
  monto numeric(10,2) not null check (monto > 0),
  moneda text not null default 'VES' check (moneda in ('VES', 'USD')),
  metodo text not null default 'efectivo',
  tipo text not null default 'operativo' check (tipo in ('operativo', 'retiro')),
  tasa_bcv numeric(10,4) not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_bodega_expenses_store on public.bodega_expenses(store_id);
create index if not exists idx_bodega_expenses_created on public.bodega_expenses(created_at);

-- --- Cierres de caja (un snapshot por día, INMUTABLE) ---
create table if not exists public.bodega_cash_closings (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  fecha date not null,
  declarado numeric(10,2) not null default 0,
  notas text not null default '',
  created_at timestamptz default now(),
  unique (store_id, fecha)
);
create index if not exists idx_bodega_closings_store on public.bodega_cash_closings(store_id);

-- --- RLS (todo contable es solo del dueño; sin acceso público) ---
alter table public.bodega_payments enable row level security;
alter table public.bodega_expenses enable row level security;
alter table public.bodega_cash_closings enable row level security;

drop policy if exists "bodega_payments_owner_all" on public.bodega_payments;
create policy "bodega_payments_owner_all" on public.bodega_payments
  for all using (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  ) with check (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  );

drop policy if exists "bodega_expenses_owner_all" on public.bodega_expenses;
create policy "bodega_expenses_owner_all" on public.bodega_expenses
  for all using (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  ) with check (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  );

-- Cierres: insertar y leer, NUNCA editar ni borrar (inmutabilidad)
drop policy if exists "bodega_closings_owner_select" on public.bodega_cash_closings;
create policy "bodega_closings_owner_select" on public.bodega_cash_closings
  for select using (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  );
drop policy if exists "bodega_closings_owner_insert" on public.bodega_cash_closings;
create policy "bodega_closings_owner_insert" on public.bodega_cash_closings
  for insert with check (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  );

-- --- Privilegios base ---
grant select, insert, update, delete on public.bodega_payments to authenticated;
grant select, insert, update, delete on public.bodega_expenses to authenticated;
grant select, insert on public.bodega_cash_closings to authenticated;
