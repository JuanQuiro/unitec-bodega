import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { todayStr } from '@/utils/accounting';

// GET /api/export/respaldo?store_id=... — copia completa de los datos
// de la tienda en JSON ("tus datos son tuyos").
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
  if (!storeData) {
    return NextResponse.json({ error: 'tienda no encontrada' }, { status: 404 });
  }

  const tables = [
    'products',
    'zones',
    'orders',
    'bodega_payments',
    'bodega_expenses',
    'bodega_cash_closings',
  ] as const;
  const dump: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    store: storeData,
  };
  for (const t of tables) {
    const { data } = await supabase.from(t).select('*').eq('store_id', storeId);
    dump[t] = data || [];
  }

  const slug = (storeData as { slug: string }).slug;
  return new Response(JSON.stringify(dump, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="respaldo-${slug}-${todayStr()}.json"`,
    },
  });
}
