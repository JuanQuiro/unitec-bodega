import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { Order, Zone, ORDER_STATUSES, OrderStatus } from '@/types/bodega';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import OrdersClient from './OrdersClient';

async function getOrders(storeId: string): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Order[];
}

async function getZones(storeId: string): Promise<Zone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('store_id', storeId);

  if (error) return [];
  return data as Zone[];
}

export default async function PanelPage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    redirect('/login');
  }

  const mine = await getMyStore(user.id);

  if (!mine) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No tenés una tienda creada. Contactá al administrador.
      </div>
    );
  }
  const { store } = mine;

  const [orders, zones] = await Promise.all([
    getOrders(store.id),
    getZones(store.id),
  ]);

  const { count: productsCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id);
  const { count: zonesCount } = await supabase
    .from('zones')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id);
  const isEmpty = (productsCount || 0) === 0 && (zonesCount || 0) === 0;

  return (
    <>
      {isEmpty && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ¡Bienvenido! Tu tienda está vacía: completala en 3 pasos.{' '}
          <Link href="/panel/onboarding" className="font-medium underline">
            Empezar ahora
          </Link>
        </div>
      )}
      <OrdersClient
        orders={orders}
        zones={zones}
        storeId={store.id}
      />
    </>
  );
}
