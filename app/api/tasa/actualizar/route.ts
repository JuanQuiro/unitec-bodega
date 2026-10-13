import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

// POST /api/tasa/actualizar?store_id=... — trae la tasa oficial (dolarapi,
// gratis y sin key) y la guarda en la tienda con fecha.
export async function POST(request: Request) {
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

  let tasa = 0;
  let fuente = '';
  for (const url of [
    'https://ve.dolarapi.com/v1/dolares/oficial',
    'https://ve.dolarapi.com/v1/dolares/paralelo',
  ]) {
    try {
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) continue;
      const data = await res.json();
      const v = Number(data.promedio || 0);
      if (v > 0) {
        tasa = v;
        fuente = String(data.fuente || data.nombre || url);
        break;
      }
    } catch {
      continue;
    }
  }
  if (tasa <= 0) {
    return NextResponse.json({ error: 'no se pudo obtener la tasa' }, { status: 502 });
  }

  const { error } = await supabase
    .from('stores')
    .update({ tasa_bcv: tasa, tasa_updated_at: new Date().toISOString() } as never)
    .eq('id', storeId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tasa, fuente });
}
