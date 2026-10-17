-- ============================================
-- Bodega SaaS — Migración 007: flujo completo de pedidos
-- - tipo (delivery/retiro), origen (catalogo/panel), motivo de cancelación
-- - chat_token (link secreto del cliente para estado y chat)
-- - numero humano por tienda (#1, #2, ...) + repartidor + pago anticipado
-- - Estado 'listo' (retiro) + constraint de estados
-- - Historial auditable: order_events
-- - Rol 'repartidor' en equipo e invitaciones
-- - RPCs del cliente (token): cancelar pendiente, ver estado, ver timeline
-- ============================================

-- 1) Columnas nuevas en orders
alter table public.orders
  add column if not exists tipo text not null default 'delivery',
  add column if not exists origen text not null default 'catalogo',
  add column if not exists motivo_cancelacion text,
  add column if not exists chat_token uuid not null default uuid_generate_v4(),
  add column if not exists pago_anticipado boolean not null default false,
  add column if not exists repartidor_nombre text,
  add column if not exists repartidor_telefono text,
  add column if not exists numero int;

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

-- 2) Numeración humana por tienda (#1, #2, ...)
-- Backfill de pedidos existentes por orden de creación
with n as (
  select id, row_number() over (partition by store_id order by created_at, id) as rn
  from public.orders where numero is null
)
update public.orders o set numero = n.rn from n where o.id = n.id;

alter table public.orders alter column numero set not null;

create unique index if not exists idx_orders_numero on public.orders(store_id, numero);

create or replace function public.set_order_numero()
returns trigger
language plpgsql
as $$
begin
  if new.numero is null then
    -- Lock por tienda: inserta de a uno y evita números duplicados
    perform pg_advisory_xact_lock(hashtext(new.store_id::text));
    select coalesce(max(o.numero), 0) + 1 into new.numero
      from public.orders o where o.store_id = new.store_id;
  end if;
  return new;
end $$;

drop trigger if exists orders_set_numero on public.orders;
create trigger orders_set_numero
  before insert on public.orders
  for each row execute function public.set_order_numero();

-- 3) Rol 'repartidor' (acceso limitado: ve sus envíos y marca entregado)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.bodega_members'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%role%'
      and pg_get_constraintdef(oid) not like '%repartidor%'
  loop
    execute format('alter table public.bodega_members drop constraint %I', c.conname);
  end loop;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bodega_members'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%repartidor%'
  ) then
    alter table public.bodega_members add constraint bodega_members_role_check
      check (role in ('owner', 'empleado', 'repartidor'));
  end if;
end $$;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.bodega_invites'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%role%'
      and pg_get_constraintdef(oid) not like '%repartidor%'
  loop
    execute format('alter table public.bodega_invites drop constraint %I', c.conname);
  end loop;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bodega_invites'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%repartidor%'
  ) then
    alter table public.bodega_invites add constraint bodega_invites_role_check
      check (role in ('owner', 'empleado', 'repartidor'));
  end if;
end $$;

-- 4) Historial de eventos del pedido
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

-- 5) RPCs públicas del cliente (identificado por el chat_token del pedido)

-- Cancelar el propio pedido (solo mientras esté pendiente)
create or replace function public.pedido_cancelar_cliente(p_order uuid, p_token uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.orders;
begin
  update public.orders o
     set estado = 'cancelado',
         motivo_cancelacion = 'Cancelado por el cliente'
   where o.id = p_order
     and o.chat_token = p_token
     and o.estado = 'pendiente'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'no se puede cancelar';
  end if;

  insert into public.order_events (order_id, store_id, tipo, desde, hasta, motivo, actor_nombre)
  values (v_row.id, v_row.store_id, 'estado', 'pendiente', 'cancelado',
          'Cancelado por el cliente', 'Cliente');

  return v_row;
end $$;

revoke all on function public.pedido_cancelar_cliente(uuid, uuid) from public;
grant execute on function public.pedido_cancelar_cliente(uuid, uuid) to anon, authenticated;

-- Ver el pedido por token (hub del cliente: estado en vivo + repetir pedido)
create or replace function public.pedido_con_token(p_order uuid, p_token uuid)
returns public.orders
language sql
security definer
set search_path = public
as $$
  select * from public.orders o where o.id = p_order and o.chat_token = p_token;
$$;

revoke all on function public.pedido_con_token(uuid, uuid) from public;
grant execute on function public.pedido_con_token(uuid, uuid) to anon, authenticated;

-- Timeline del pedido (solo eventos de estado, sin datos internos)
create or replace function public.pedido_eventos_publicos(p_order uuid, p_token uuid)
returns setof public.order_events
language sql
security definer
set search_path = public
as $$
  select e.* from public.order_events e
  join public.orders o on o.id = e.order_id
  where e.order_id = p_order
    and o.chat_token = p_token
    and e.tipo = 'estado'
  order by e.created_at;
$$;

revoke all on function public.pedido_eventos_publicos(uuid, uuid) from public;
grant execute on function public.pedido_eventos_publicos(uuid, uuid) to anon, authenticated;
