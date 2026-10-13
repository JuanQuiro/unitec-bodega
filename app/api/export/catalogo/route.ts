import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { todayStr } from '@/utils/accounting';

// GET /api/export/catalogo?store_id=... — lista de precios en Excel.
// Patrón cocolu: workbook → buffer → attachment con fecha.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store_id');
  if (!storeId) {
    return NextResponse.json({ error: 'store_id requerido' }, { status: 400 });
  }

  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  const { data: storeData } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .eq('owner_id', user.id)
    .single();
  const store = storeData as { id: string; nombre: string; slug: string; created_at: string } | null;
  if (!store) {
    return NextResponse.json({ error: 'tienda no encontrada' }, { status: 404 });
  }

  const { data: subData } = await supabase
    .from('bodega_subscriptions')
    .select('*')
    .eq('store_id', storeId)
    .single();
  const { getPlanStatus } = await import('@/utils/subscription');
  const st = getPlanStatus(
    store,
    subData as { plan: string; status: string; valid_until: string | null } | null
  );
  if (st.expired) {
    return NextResponse.json({ error: 'plan vencido' }, { status: 403 });
  }

  const { data: productsData } = await supabase
    .from('products')
    .select('nombre,categoria,unidad,precio,costo,stock,activo')
    .eq('store_id', storeId)
    .order('categoria')
    .order('nombre');
  const products = (productsData || []) as {
    nombre: string;
    categoria: string;
    unidad: string;
    precio: number;
    costo: number;
    stock: number;
    activo: boolean;
  }[];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mi Bodega';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Precios');
  sheet.columns = [
    { header: 'Producto', key: 'nombre', width: 36 },
    { header: 'Categoría', key: 'categoria', width: 16 },
    { header: 'Unidad', key: 'unidad', width: 12 },
    { header: 'Precio (Bs.)', key: 'precio', width: 16 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Disponible', key: 'disponible', width: 14 },
  ];
  for (const p of products) {
    sheet.addRow({
      nombre: p.nombre,
      categoria: p.categoria,
      unidad: p.unidad,
      precio: Number(p.precio),
      stock: p.stock,
      disponible: p.activo && p.stock > 0 ? 'Sí' : 'No',
    });
  }
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `lista-precios-${store.slug}-${todayStr()}.xlsx`;
  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
