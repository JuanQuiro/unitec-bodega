-- ============================================
-- Bodega SaaS — Migración 009: chat por pedido
-- El cliente (sin cuenta) habla por RPCs con su chat_token.
-- El panel (autenticado) usa la tabla directo con RLS por membresía.
-- ============================================

create table if not exists public.bodega_messages (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  autor text not null check (autor in ('cliente','bodega')),
  autor_nombre text,
  body text not null,
  photo_path text,
  leido_bodega boolean not null default false,
  leido_cliente boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_bodega_messages_order on public.bodega_messages(order_id, created_at);

alter table public.bodega_messages enable row level security;

-- Panel: dueño o miembro
drop policy if exists "messages_select_member" on public.bodega_messages;
create policy "messages_select_member" on public.bodega_messages for select
  using (
    exists (select 1 from public.stores s where s.id = bodega_messages.store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.bodega_members m where m.store_id = bodega_messages.store_id and m.user_id = auth.uid())
  );

drop policy if exists "messages_insert_member" on public.bodega_messages;
create policy "messages_insert_member" on public.bodega_messages for insert
  with check (
    autor = 'bodega'
    and (
      exists (select 1 from public.stores s where s.id = bodega_messages.store_id and s.owner_id = auth.uid())
      or exists (select 1 from public.bodega_members m where m.store_id = bodega_messages.store_id and m.user_id = auth.uid())
    )
  );

drop policy if exists "messages_update_member" on public.bodega_messages;
create policy "messages_update_member" on public.bodega_messages for update
  using (
    exists (select 1 from public.stores s where s.id = bodega_messages.store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.bodega_members m where m.store_id = bodega_messages.store_id and m.user_id = auth.uid())
  );

grant select, insert, update on public.bodega_messages to authenticated;

-- ---- RPCs del cliente anónimo (validadas por chat_token) ----

-- Leer mensajes del pedido (marca como leídos los de la bodega)
create or replace function public.pedido_chat_leer(p_order uuid, p_token uuid)
returns setof public.bodega_messages
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.orders o where o.id = p_order and o.chat_token = p_token
  ) then
    raise exception 'no autorizado';
  end if;

  update public.bodega_messages m
    set leido_cliente = true
    where m.order_id = p_order and m.autor = 'bodega' and m.leido_cliente = false;

  return query
    select * from public.bodega_messages m
    where m.order_id = p_order
    order by m.created_at
    limit 500;
end $$;

-- Enviar mensaje como cliente
create or replace function public.pedido_chat_enviar(
  p_order uuid,
  p_token uuid,
  p_nombre text,
  p_body text,
  p_photo text default null
)
returns public.bodega_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bodega_messages;
  v_store uuid;
begin
  select o.store_id into v_store
    from public.orders o
    where o.id = p_order and o.chat_token = p_token;

  if v_store is null then
    raise exception 'no autorizado';
  end if;

  if (p_body is null or length(trim(p_body)) = 0) and p_photo is null then
    raise exception 'mensaje inválido';
  end if;

  if length(trim(coalesce(p_body, ''))) > 1000 then
    raise exception 'mensaje inválido';
  end if;

  if p_photo is not null and left(p_photo, 7) <> 'stores/' then
    raise exception 'foto inválida';
  end if;

  insert into public.bodega_messages (store_id, order_id, autor, autor_nombre, body, photo_path)
  values (v_store, p_order, 'cliente', left(coalesce(p_nombre, ''), 80),
          left(trim(coalesce(p_body, '')), 1000), left(p_photo, 500))
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.pedido_chat_leer(uuid, uuid) from public;
revoke all on function public.pedido_chat_enviar(uuid, uuid, text, text, text) from public;
grant execute on function public.pedido_chat_leer(uuid, uuid) to anon, authenticated;
grant execute on function public.pedido_chat_enviar(uuid, uuid, text, text, text) to anon, authenticated;
