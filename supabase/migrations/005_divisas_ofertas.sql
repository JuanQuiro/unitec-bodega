-- ============================================
-- Bodega SaaS — Migración 005: divisas y ofertas
-- ============================================

alter table public.products
  add column if not exists precio_usd numeric(10,2) not null default 0
  check (precio_usd >= 0);
alter table public.products
  add column if not exists descuento_pct numeric(5,2) not null default 0
  check (descuento_pct >= 0 and descuento_pct <= 100);

alter table public.stores
  add column if not exists tasa_updated_at timestamptz;
