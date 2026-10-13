import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/types/bodega';

const MAX_ROWS = 2000;
const MAX_BYTES = 5 * 1024 * 1024;

interface ParsedRow {
  line: number;
  nombre: string;
  categoria: string;
  unidad: string;
  precio: number;
  costo: number;
  stock: number;
}

// POST /api/import/catalogo (multipart: file, store_id, confirm=0|1)
// confirm=0 → preview sin escribir. confirm=1 → upsert por nombre.
export async function POST(request: Request) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  const form = await request.formData();
  const storeId = String(form.get('store_id') || '');
  const confirm = String(form.get('confirm') || '') === '1';
  const file = form.get('file') as File | null;
  if (!storeId || !file) {
    return NextResponse.json({ error: 'file y store_id requeridos' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'archivo muy grande (máx 5MB)' }, { status: 400 });
  }

  const { data: storeData } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .eq('owner_id', user.id)
    .single();
  const store = storeData as { id: string } | null;
  if (!store) {
    return NextResponse.json({ error: 'tienda no encontrada' }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs tipa Buffer con otra versión de @types/node: never lo evita
    await workbook.xlsx.load(buffer as never);
  } catch {
    return NextResponse.json({ error: 'no es un Excel válido' }, { status: 400 });
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return NextResponse.json({ error: 'planilla vacía' }, { status: 400 });
  }

  const valid: ParsedRow[] = [];
  const errors: { line: number; reason: string }[] = [];
  let count = 0;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || count >= MAX_ROWS) return; // encabezado
    count += 1;
    const v = (i: number) => {
      const cell = row.getCell(i).value;
      return cell === null || cell === undefined ? '' : String(cell).trim();
    };
    const nombre = v(1);
    const categoriaRaw = v(2).toLowerCase() || 'viveres';
    const unidadRaw = v(3).toLowerCase() || 'unidad';
    const precio = Number(v(4));
    const costo = v(5) === '' ? 0 : Number(v(5));
    const stock = v(6) === '' ? 0 : Number(v(6));

    if (!nombre) {
      errors.push({ line: rowNumber, reason: 'sin nombre' });
      return;
    }
    if (!Number.isFinite(precio) || precio < 0) {
      errors.push({ line: rowNumber, reason: `"${nombre}": precio inválido` });
      return;
    }
    if (!Number.isFinite(costo) || costo < 0) {
      errors.push({ line: rowNumber, reason: `"${nombre}": costo inválido` });
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push({ line: rowNumber, reason: `"${nombre}": stock inválido` });
      return;
    }
    valid.push({
      line: rowNumber,
      nombre,
      categoria: (PRODUCT_CATEGORIES as readonly string[]).includes(categoriaRaw)
        ? categoriaRaw
        : 'viveres',
      unidad: (PRODUCT_UNITS as readonly string[]).includes(unidadRaw) ? unidadRaw : 'unidad',
      precio: Math.round(precio * 100) / 100,
      costo: Math.round(costo * 100) / 100,
      stock,
    });
  });

  if (!confirm) {
    return NextResponse.json({
      preview: valid.slice(0, 100),
      validCount: valid.length,
      errors,
      truncated: valid.length > 100,
    });
  }

  let created = 0;
  let updated = 0;
  for (const row of valid) {
    const { data: existing } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .ilike('nombre', row.nombre)
      .limit(1)
      .single();
    const found = existing as { id: string } | null;
    if (found) {
      const { error } = await supabase
        .from('products')
        .update({
          categoria: row.categoria,
          unidad: row.unidad,
          precio: row.precio,
          costo: row.costo,
          stock: row.stock,
        } as never)
        .eq('id', found.id);
      if (!error) updated += 1;
    } else {
      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        nombre: row.nombre,
        categoria: row.categoria,
        unidad: row.unidad,
        precio: row.precio,
        costo: row.costo,
        stock: row.stock,
        activo: true,
      } as never);
      if (!error) created += 1;
    }
  }

  return NextResponse.json({ created, updated, errors });
}
