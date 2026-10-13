import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { Order, Payment } from '@/types/bodega';
import FiadosClient from './FiadosClient';

export default async function FiadosPage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const mine = await getMyStore(user.id);
  if (!mine) redirect('/panel/onboarding');
  if (mine.role !== 'owner') redirect('/panel');
  const { store } = mine;

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', store.id)
    .eq('metodo_pago', 'fiado')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: false });
  const orders = (ordersData || []) as Order[];

  const orderIds = orders.map((o) => o.id);
  let payments: Pick<Payment, 'order_id' | 'monto' | 'moneda' | 'metodo' | 'tasa_bcv'>[] = [];
  if (orderIds.length > 0) {
    const { data: paymentsData } = await supabase
      .from('bodega_payments')
      .select('*')
      .in('order_id', orderIds);
    payments = (paymentsData || []) as unknown as Pick<Payment, 'order_id' | 'monto' | 'moneda' | 'metodo' | 'tasa_bcv'>[];
  }

  return <FiadosClient storeId={store.id} orders={orders || []} payments={payments} />;
}
