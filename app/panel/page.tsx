import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { Order, Store, Zone, ORDER_STATUSES, OrderStatus } from '@/types/bodega';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';

async function getStore(ownerId: string): Promise<Store | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', ownerId)
    .single();

  if (error || !data) return null;
  return data as Store;
}

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

  const store = await getStore(user.id);

  if (!store) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No tenés una tienda creada. Contactá al administrador.
      </div>
    );
  }

  const [orders, zones] = await Promise.all([
    getOrders(store.id),
    getZones(store.id),
  ]);

  return (
    <OrdersClient
      orders={orders}
      zones={zones}
      storeId={store.id}
    />
  );
}
