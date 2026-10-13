import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { Expense, Order, Payment } from '@/types/bodega';
import ContableClient from './ContableClient';

interface PageProps {
  searchParams?: { from?: string; to?: string; tasa?: string };
}

export default async function ContablePage({ searchParams }: PageProps) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const mine = await getMyStore(user.id);
  if (!mine) redirect('/panel/onboarding');
  if (mine.role !== 'owner') redirect('/panel');
  const { store } = mine;

  const to = searchParams?.to || new Date().toISOString().slice(0, 10);
  const from =
    searchParams?.from ||
    new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const tasa = Number(searchParams?.tasa || store.tasa_bcv || 0);

  const range = (q: string) => `${q}T00:00:00`;
  const rangeEnd = (q: string) => `${q}T23:59:59`;

  const [{ data: ordersData }, { data: paymentsData }, { data: expensesData }, { data: productsData }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', range(from))
        .lte('created_at', rangeEnd(to))
        .order('created_at', { ascending: true }),
      supabase
        .from('bodega_payments')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', range(from))
        .lte('created_at', rangeEnd(to)),
      supabase
        .from('bodega_expenses')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', range(from))
        .lte('created_at', rangeEnd(to)),
      supabase.from('products').select('*').eq('store_id', store.id),
    ]);

  const orders = (ordersData || []) as Order[];
  const payments = (paymentsData || []) as Payment[];
  const expenses = (expensesData || []) as Expense[];
  const products = ((productsData || []) as { id: string; nombre: string; categoria: string }[]).map(
    (p) => ({ id: p.id, nombre: p.nombre, categoria: p.categoria })
  );

  return (
    <ContableClient
      storeId={store.id}
      storeSlug={store.slug}
      orders={orders || []}
      payments={payments || []}
      expenses={expenses || []}
      products={products}
      from={from}
      to={to}
      tasa={tasa}
    />
  );
}
