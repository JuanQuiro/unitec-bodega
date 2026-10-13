-- ============================================
-- Mi Bodega — Seed demo 002 (contabilidad)
-- Requiere seed-demo.sql aplicado antes
-- ============================================

do $$
declare
  v_store_id uuid;
  v_order_id uuid;
begin
  select id into v_store_id from public.stores where slug = 'bodega-demo';
  if v_store_id is null then
    raise exception 'No existe la tienda bodega-demo. Aplica seed-demo.sql primero.';
  end if;

  -- Un pedido pendiente pasa a fiado para la demo de cartera
  select id into v_order_id
  from public.orders
  where store_id = v_store_id and estado = 'pendiente'
  order by created_at desc limit 1;
  if v_order_id is not null then
    update public.orders set metodo_pago = 'fiado' where id = v_order_id;
    insert into public.bodega_payments
      (store_id, order_id, cliente_nombre, monto, moneda, metodo, referencia)
    select v_store_id, v_order_id, cliente_nombre, 100, 'VES', 'efectivo', 'abono demo'
    from public.orders where id = v_order_id;
  end if;

  -- Gastos demo
  insert into public.bodega_expenses
    (store_id, descripcion, categoria, monto, moneda, metodo, tipo)
  values
    (v_store_id, 'Compra mayorista semanal', 'inventario', 2500, 'VES', 'transferencia', 'operativo'),
    (v_store_id, 'Retiro dueño', 'general', 500, 'VES', 'efectivo', 'retiro')
  on conflict do nothing;

  -- Cierre de ayer demo
  insert into public.bodega_cash_closings (store_id, fecha, declarado, notas)
  values (v_store_id, (current_date - interval '1 day')::date, 3200, 'Cierre demo')
  on conflict (store_id, fecha) do nothing;
end $$;
