-- ============================================
-- Bodega SaaS — Migración 010: notificaciones push
-- Suscripciones Web Push del panel (bodeguero/empleado/repartidor).
-- El envío lo hace la app (API route en Vercel con VAPID + service role)
-- cuando entra un pedido nuevo o un mensaje del cliente.
-- ============================================

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create index if not exists idx_push_user on public.push_subscriptions(user_id);
create index if not exists idx_push_store on public.push_subscriptions(store_id);

alter table public.push_subscriptions enable row level security;

-- Cada usuario administra solo sus propias suscripciones
drop policy if exists "push_own_all" on public.push_subscriptions;
create policy "push_own_all" on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.push_subscriptions to authenticated;