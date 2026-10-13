import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { Order, Payment } from '@/types/bodega';
import PedidoDetailClient from './PedidoDetailClient';

interface PageProps {
  params: { id: string };
}

export default async function PedidoDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const { data: storeData } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single();
  const store = storeData as { id: string } | null;
  if (!store) redirect('/panel/tienda');

  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .eq('store_id', store.id)
    .single();
  const order = orderData as Order | null;
  if (!order) notFound();

  const [{ data: paymentsData }, { data: zoneData }] = await Promise.all([
    supabase
      .from('bodega_payments')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true }),
    order.zone_id
      ? supabase.from('zones').select('*').eq('id', order.zone_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const payments = (paymentsData || []) as Payment[];
  const zone = zoneData as { nombre: string } | null;

  return (
    <PedidoDetailClient
      storeId={store.id}
      order={order}
      payments={payments || []}
      zoneName={zone?.nombre ?? null}
    />
  );
}
