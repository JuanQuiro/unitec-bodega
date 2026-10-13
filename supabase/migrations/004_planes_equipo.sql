-- ============================================
-- Bodega SaaS — Migración 004: planes y equipo
-- Subscriptions (trial + manual) y miembros por rol
-- ============================================

-- --- Subscriptions (una activa por tienda; trial por defecto) ---
create table if not exists public.bodega_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null unique,
  plan text not null default 'trial' check (plan in ('trial', 'base', 'pro')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  valid_until timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_subs_store on public.bodega_subscriptions(store_id);

-- --- Miembros del equipo (dueño + empleados) ---
create table if not exists public.bodega_members (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'empleado' check (role in ('owner', 'empleado')),
  created_at timestamptz default now(),
  unique (store_id, user_id)
);
create index if not exists idx_members_store on public.bodega_members(store_id);
create index if not exists idx_members_user on public.bodega_members(user_id);

-- El dueño siempre es miembro owner de su tienda
create or replace function public.handle_new_store_owner()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.bodega_members (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (store_id, user_id) do nothing;
  insert into public.bodega_subscriptions (store_id, plan, status, valid_until)
  values (new.id, 'trial', 'active', now() + interval '14 days')
  on conflict (store_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_store_created_owner on public.stores;
create trigger on_store_created_owner
  after insert on public.stores
  for each row execute function public.handle_new_store_owner();

-- --- RLS ---
alter table public.bodega_subscriptions enable row level security;
alter table public.bodega_members enable row level security;

drop policy if exists "subs_owner_all" on public.bodega_subscriptions;
create policy "subs_owner_all" on public.bodega_subscriptions
  for all using (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  ) with check (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  );

drop policy if exists "members_owner_all" on public.bodega_members;
create policy "members_owner_all" on public.bodega_members
  for all using (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  ) with check (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  );

-- Empleados: ver datos operativos + cambiar estado de pedidos.
-- (Escrituras finas por tabla vía EXISTS en el miembro.)
drop policy if exists "orders_member_rw" on public.orders;
create policy "orders_member_rw" on public.orders
  for all using (
    exists (
      select 1 from public.bodega_members m
      where m.store_id = orders.store_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.bodega_members m
      where m.store_id = orders.store_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "products_member_read" on public.products;
create policy "products_member_read" on public.products
  for select using (
    activo = true or exists (
      select 1 from public.bodega_members m
      where m.store_id = products.store_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "zones_member_read" on public.zones;
create policy "zones_member_read" on public.zones
  for select using (
    exists (
      select 1 from public.bodega_members m
      where m.store_id = zones.store_id and m.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.bodega_subscriptions to authenticated;
grant select, insert, update, delete on public.bodega_members to authenticated;
-- anon necesita SELECT para evaluar las policies *_member_* en queries públicas
grant select on public.bodega_members to anon;

-- --- Invitaciones pendientes (el invitado se registra y se auto-adjunta) ---
create table if not exists public.bodega_invites (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade not null,
  email text not null,
  role text not null default 'empleado' check (role in ('owner', 'empleado')),
  created_at timestamptz default now(),
  unique (store_id, email)
);
create index if not exists idx_invites_store on public.bodega_invites(store_id);

alter table public.bodega_invites enable row level security;

drop policy if exists "invites_owner_all" on public.bodega_invites;
create policy "invites_owner_all" on public.bodega_invites
  for all using (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  ) with check (
    auth.uid() = (select owner_id from public.stores where id = store_id)
  );

grant select, insert, delete on public.bodega_invites to authenticated;

-- El invitado puede ver y consumir su propia invitación por email
drop policy if exists "invites_self_consume" on public.bodega_invites;
create policy "invites_self_consume" on public.bodega_invites
  for select using ((auth.jwt() ->> 'email') = email);
drop policy if exists "invites_self_delete" on public.bodega_invites;
create policy "invites_self_delete" on public.bodega_invites
  for delete using ((auth.jwt() ->> 'email') = email);

-- El invitado puede insertar su propia membresía si hay invitación
drop policy if exists "members_invite_attach" on public.bodega_members;
create policy "members_invite_attach" on public.bodega_members
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.bodega_invites i
      where i.store_id = store_id and i.email = (auth.jwt() ->> 'email')
    )
  );

-- El miembro puede leer su propia membresía (si no, nunca resuelve su tienda)
drop policy if exists "members_self_read" on public.bodega_members;
create policy "members_self_read" on public.bodega_members
  for select using (auth.uid() = user_id);

-- ¿Plan vigente? Sub activa sin vencer, o trial de 14 días desde creación.
create or replace function public.store_plan_ok(p_store_id uuid)
returns boolean
language sql stable as $$
  select
    exists (
      select 1 from public.bodega_subscriptions
      where store_id = p_store_id and status = 'active'
        and (valid_until is null or valid_until > now())
    )
    or exists (
      select 1 from public.stores
      where id = p_store_id and created_at > now() - interval '14 days'
    );
$$;

-- Alta de productos exige plan vigente (cubre formulario e importador).
-- Las ventas (pedidos del público) nunca se bloquean.
drop policy if exists "products_insert_owner" on public.products;
create policy "products_insert_owner" on public.products
  for insert with check (
    auth.uid() = (select owner_id from public.stores where id = store_id)
    and public.store_plan_ok(store_id)
  );
