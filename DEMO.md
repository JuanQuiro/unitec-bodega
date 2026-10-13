# Demo local — Mi Bodega

Credenciales demo (solo local, sin secretos reales):

- Email: `demo@mibodega.app`
- Password: `demo123456`

## Pasos

1. Registrate en `/login` con ese email y password (esto crea el usuario en Supabase Auth).
2. Pega el contenido de `supabase/seed-demo.sql` en el Supabase SQL Editor y ejecutalo.
3. Entra a `/panel` y abri el catalogo publico en `/s/bodega-demo`.

## Que revisar en cada pantalla

- `/panel`: lista de 5 pedidos en estados pendiente, confirmado, preparando, en_camino y entregado. Cambia un estado y verifica que se actualice.
- `/panel/productos`: ~10 productos variados (viveres, lacteos, embutidos, limpieza, bebidas, snacks). El Jamon Endiablado tiene stock 0.
- `/panel/zonas`: 2 zonas (Centro costo 20 minimo 100, La Isabelica costo 35 minimo 150).
- `/panel/tienda`: datos de Bodega La Esquina (slug `bodega-demo`, WhatsApp 584120000000).
- `/s/bodega-demo`: catalogo publico, buscador, filtro por categoria, carrito, boton "Instalar app" (PWA) y producto con stock 0 marcado como Agotado.
