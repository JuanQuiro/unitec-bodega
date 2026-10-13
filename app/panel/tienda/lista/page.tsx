import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { formatPrice, formatDateShort } from '@/utils/format';
import { todayStr } from '@/utils/accounting';
import { PrintButton } from './PrintButton';

// Vista imprimible de la lista de precios (el bodeguero la guarda
// como PDF o la imprime para el mostrador).
export default async function ListaPreciosPage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const { data: storeData } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single();
  const store = storeData as { id: string; nombre: string; slug: string } | null;
  if (!store) redirect('/panel/tienda');

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('activo', true)
    .order('categoria')
    .order('nombre');
  const products = (productsData || []) as {
    nombre: string;
    categoria: string;
    unidad: string;
    precio: number;
    stock: number;
  }[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h2 className="text-2xl font-bold">Lista de precios</h2>
        <div className="flex gap-2">
          <a
            href={`/api/export/catalogo?store_id=${store.id}`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Descargar Excel
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 border-b pb-4 text-center">
          <h1 className="text-2xl font-bold">{store.nombre}</h1>
          <p className="text-sm text-gray-500">Lista de precios · {formatDateShort(todayStr())}</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Producto</th>
              <th className="py-2 pr-4">Unidad</th>
              <th className="py-2 text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  <span className="font-medium">{p.nombre}</span>
                  <span className="ml-2 text-xs text-gray-400">{p.categoria}</span>
                </td>
                <td className="py-2 pr-4 text-gray-500">{p.unidad}</td>
                <td className="py-2 text-right font-bold">{formatPrice(p.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
