import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { toCsv, todayStr, toNum } from '@/utils/accounting';

// GET /api/export/ventas?store_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD&format=xlsx|csv
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store_id');
  const from = searchParams.get('from') || '1970-01-01';
  const to = searchParams.get('to') || todayStr();
  const format = (searchParams.get('format') || 'xlsx').toLowerCase();
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
    .select('id,slug')
    .eq('id', storeId)
    .eq('owner_id', user.id)
    .single();
  const store = storeData as { id: string; slug: string } | null;
  if (!store) {
    return NextResponse.json({ error: 'tienda no encontrada' }, { status: 404 });
  }

  const { data: ordersData } = await supabase
    .from('orders')
    .select('id,cliente_nombre,cliente_telefono,total,estado,metodo_pago,created_at')
    .eq('store_id', storeId)
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)
    .order('created_at', { ascending: false });
  const orders = (ordersData || []) as {
    id: string;
    cliente_nombre: string;
    cliente_telefono: string;
    total: number;
    estado: string;
    metodo_pago: string;
    created_at: string;
  }[];

  const rows = orders.map((o) => [
    o.id.slice(0, 8),
    new Date(o.created_at).toLocaleString('es-VE'),
    o.cliente_nombre,
    o.cliente_telefono,
    o.metodo_pago,
    o.estado,
    toNum(o.total).toFixed(2),
  ]);
  const total = orders
    .filter((o) => o.estado !== 'cancelado')
    .reduce((s, o) => s + toNum(o.total), 0);
  const filenameBase = `ventas-${store.slug}-${from}-${to}`;
  const headers = ['Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Método', 'Estado', 'Total (Bs.)'];

  if (format === 'csv') {
    const csv = toCsv([headers, ...rows, ['', '', '', '', '', 'TOTAL', total.toFixed(2)]]);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mi Bodega';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Ventas');
  sheet.columns = headers.map((h, i) => ({
    header: h,
    key: `c${i}`,
    width: [10, 20, 24, 16, 14, 14, 14][i],
  }));
  for (const r of rows) {
    sheet.addRow({ c0: r[0], c1: r[1], c2: r[2], c3: r[3], c4: r[4], c5: r[5], c6: Number(r[6]) });
  }
  const totalRow = sheet.addRow({ c5: 'TOTAL', c6: total });
  totalRow.font = { bold: true };
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
    },
  });
}
