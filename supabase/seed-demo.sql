-- ============================================
-- Mi Bodega — Seed demo (NO es migracion)
-- Pegar en Supabase SQL Editor DESPUES de
-- registrarse en /login con demo@mibodega.app
-- ============================================

-- 1) Confirmar el email del demo (por si se registro sin confirmacion)
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'demo@mibodega.app';

-- 2) Store + productos + zonas + pedidos demo
do $$
declare
  v_uid uuid;
  v_store_id uuid;
  v_zone_centro uuid;
  v_zone_isabelica uuid;
  v_p1 uuid; -- harina
  v_p2 uuid; -- arroz
  v_p3 uuid; -- leche
  v_p4 uuid; -- queso
  v_p5 uuid; -- mortadela
  v_p6 uuid; -- jamon (agotado)
  v_p7 uuid; -- cloro
  v_p8 uuid; -- bulto harina
  v_p9 uuid; -- refresco
  v_p10 uuid; -- papas
begin
  -- Buscar usuario demo (debe existir: registrarse primero en /login)
  select id into v_uid from auth.users where email = 'demo@mibodega.app';
  if v_uid is null then
    raise exception 'No existe el usuario demo@mibodega.app. Registrate primero en /login con ese email.';
  end if;

  -- Borrar stores previas del demo (cascada limpia productos/zonas/pedidos
  -- y tambien el store auto-creado por el trigger handle_new_user)
  delete from public.stores where owner_id = v_uid;

  -- Store demo
  insert into public.stores (owner_id, slug, nombre, whatsapp, direccion)
  values (v_uid, 'bodega-demo', 'Bodega La Esquina', '584120000000', 'Av. Principal, Valencia')
  returning id into v_store_id;

  -- Zonas
  insert into public.zones (store_id, nombre, costo, minimo)
  values (v_store_id, 'Centro', 20, 100)
  returning id into v_zone_centro;

  insert into public.zones (store_id, nombre, costo, minimo)
  values (v_store_id, 'La Isabelica', 35, 150)
  returning id into v_zone_isabelica;

  -- Productos (~10, uno con stock 0 para ver "Agotado")
  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Harina de Maiz PAN 1kg', 85.50, 50, 'unidad', 'viveres', 'https://picsum.photos/seed/harina-pan/400')
  returning id into v_p1;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Arroz Mary 1kg', 78.00, 40, 'kg', 'viveres', 'https://picsum.photos/seed/arroz-mary/400')
  returning id into v_p2;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Leche La Campina 400g', 210.00, 25, 'unidad', 'lacteos', 'https://picsum.photos/seed/leche-campina/400')
  returning id into v_p3;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Queso Blanco Paisa', 320.00, 15, 'kg', 'lacteos', 'https://picsum.photos/seed/queso-blanco/400')
  returning id into v_p4;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Mortadela al Detal 100g', 45.00, 30, 'detal', 'embutidos', 'https://picsum.photos/seed/mortadela/400')
  returning id into v_p5;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Jamon Endiablado 110g', 65.00, 0, 'unidad', 'embutidos', 'https://picsum.photos/seed/jamon-endiablado/400')
  returning id into v_p6;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Cloro 1L', 55.00, 60, 'unidad', 'limpieza', 'https://picsum.photos/seed/cloro/400')
  returning id into v_p7;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Bulto Harina PAN x20', 1650.00, 8, 'bulto', 'viveres', 'https://picsum.photos/seed/bulto-harina/400')
  returning id into v_p8;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Refresco Coca-Cola 2L', 120.00, 35, 'unidad', 'bebidas', 'https://picsum.photos/seed/refresco-cola/400')
  returning id into v_p9;

  insert into public.products (store_id, nombre, precio, stock, unidad, categoria, foto_url)
  values (v_store_id, 'Papas Ruffles 150g', 95.00, 20, 'unidad', 'snacks', 'https://picsum.photos/seed/papas-ruffles/400')
  returning id into v_p10;

  -- Pedidos (5 estados; total = items + costo de zona)
  -- 1) pendiente: harina x2 (171) + refresco x1 (120) + envio Centro (20) = 311
  insert into public.orders (store_id, cliente_nombre, cliente_telefono, cliente_direccion, zone_id, items, total, estado)
  values (
    v_store_id, 'Maria Perez', '584121234567', 'Calle Bolivar 123, Centro', v_zone_centro,
    jsonb_build_array(
      jsonb_build_object('product_id', v_p1, 'nombre', 'Harina de Maiz PAN 1kg', 'cantidad', 2, 'precio', 85.50, 'subtotal', 171.00),
      jsonb_build_object('product_id', v_p9, 'nombre', 'Refresco Coca-Cola 2L', 'cantidad', 1, 'precio', 120.00, 'subtotal', 120.00)
    ),
    311.00, 'pendiente'
  );

  -- 2) confirmado: leche x1 (210) + papas x2 (190) + envio Isabelica (35) = 435
  insert into public.orders (store_id, cliente_nombre, cliente_telefono, cliente_direccion, zone_id, items, total, estado)
  values (
    v_store_id, 'Jose Garcia', '584125678901', 'Bloque 12, La Isabelica', v_zone_isabelica,
    jsonb_build_array(
      jsonb_build_object('product_id', v_p3, 'nombre', 'Leche La Campina 400g', 'cantidad', 1, 'precio', 210.00, 'subtotal', 210.00),
      jsonb_build_object('product_id', v_p10, 'nombre', 'Papas Ruffles 150g', 'cantidad', 2, 'precio', 95.00, 'subtotal', 190.00)
    ),
    435.00, 'confirmado'
  );

  -- 3) preparando: arroz x3 (234) + mortadela x2 (90) + envio Centro (20) = 344
  insert into public.orders (store_id, cliente_nombre, cliente_telefono, cliente_direccion, zone_id, items, total, estado)
  values (
    v_store_id, 'Ana Rodriguez', '584129876543', 'Av. Lara 45, Centro', v_zone_centro,
    jsonb_build_array(
      jsonb_build_object('product_id', v_p2, 'nombre', 'Arroz Mary 1kg', 'cantidad', 3, 'precio', 78.00, 'subtotal', 234.00),
      jsonb_build_object('product_id', v_p5, 'nombre', 'Mortadela al Detal 100g', 'cantidad', 2, 'precio', 45.00, 'subtotal', 90.00)
    ),
    344.00, 'preparando'
  );

  -- 4) en_camino: queso x1 (320) + cloro x1 (55) + envio Isabelica (35) = 410
  insert into public.orders (store_id, cliente_nombre, cliente_telefono, cliente_direccion, zone_id, items, total, estado)
  values (
    v_store_id, 'Carlos Martinez', '584123456789', 'Sector 8, La Isabelica', v_zone_isabelica,
    jsonb_build_array(
      jsonb_build_object('product_id', v_p4, 'nombre', 'Queso Blanco Paisa', 'cantidad', 1, 'precio', 320.00, 'subtotal', 320.00),
      jsonb_build_object('product_id', v_p7, 'nombre', 'Cloro 1L', 'cantidad', 1, 'precio', 55.00, 'subtotal', 55.00)
    ),
    410.00, 'en_camino'
  );

  -- 5) entregado: arroz x1 (78) + papas x1 (95) + refresco x1 (120) + envio Centro (20) = 313
  insert into public.orders (store_id, cliente_nombre, cliente_telefono, cliente_direccion, zone_id, items, total, estado)
  values (
    v_store_id, 'Lucia Fernandez', '584127654321', 'Calle Sucre 78, Centro', v_zone_centro,
    jsonb_build_array(
      jsonb_build_object('product_id', v_p2, 'nombre', 'Arroz Mary 1kg', 'cantidad', 1, 'precio', 78.00, 'subtotal', 78.00),
      jsonb_build_object('product_id', v_p10, 'nombre', 'Papas Ruffles 150g', 'cantidad', 1, 'precio', 95.00, 'subtotal', 95.00),
      jsonb_build_object('product_id', v_p9, 'nombre', 'Refresco Coca-Cola 2L', 'cantidad', 1, 'precio', 120.00, 'subtotal', 120.00)
    ),
    313.00, 'entregado'
  );
end $$;
