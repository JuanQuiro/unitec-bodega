-- ============================================
-- Bodega SaaS — Migración 007: flujo completo de pedidos
-- - tipo (delivery/retiro), origen (catalogo/panel), motivo de cancelación
-- - chat_token (para el chat del cliente sin cuenta)
-- - Estado 'listo' (retiro) + constraint de estados
-- - Historial auditable: order_events
-- ============================================

-- 1) Columnas nuevas en orders
alter table public.orders
  add column if not exists tipo text not null default 'delivery',
  add column if not exists origen text not null default 'catalogo',
  add column if not exists motivo_cancelacion text,
  add column if not exists chat_token uuid not null default uuid_generate_v4();

do $$ begin
  alter table public.orders add constraint orders_tipo_check
    check (tipo in ('delivery','retiro'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_origen_check
    check (origen in ('catalogo','panel'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_estado_check
    check (estado in ('pendiente','confirmado','preparando','listo','en_camino','entregado','cancelado'));
exception when duplicate_object then null; end $$;

create unique index if not exists idx_orders_chat_token on public.orders(chat_token);

-- 2) Historial de eventos del pedido
create table if not exists public.order_events (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  tipo text not null default 'estado',   -- estado | edicion | nota
  desde text,
  hasta text,
  motivo text,
  actor_id uuid,
  actor_nombre text,
  detalle jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_order_events_order on public.order_events(order_id, created_at);

alter table public.order_events enable row level security;

-- RLS: dueño o miembro de la tienda
drop policy if exists "order_events_select_member" on public.order_events;
create policy "order_events_select_member" on public.order_events for select
  using (
    exists (
      select 1 from public.stores s
      where s.id = order_events.store_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.bodega_members m
      where m.store_id = order_events.store_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "order_events_insert_member" on public.order_events;
create policy "order_events_insert_member" on public.order_events for insert
  with check (
    exists (
      select 1 from public.stores s
      where s.id = order_events.store_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.bodega_members m
      where m.store_id = order_events.store_id and m.user_id = auth.uid()
    )
  );

grant select, insert on public.order_events to authenticated;
