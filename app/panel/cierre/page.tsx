import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { CashClosing, Expense, Order, Payment } from '@/types/bodega';
import CierreClient from './CierreClient';

export default async function CierrePage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const mine = await getMyStore(user.id);
  if (!mine) redirect('/panel/onboarding');
  if (mine.role !== 'owner') redirect('/panel');
  const { store } = mine;

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: ordersData }, { data: paymentsData }, { data: expensesData }, { data: closingsData }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', `${today}T00:00:00`),
      supabase
        .from('bodega_payments')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', `${today}T00:00:00`),
      supabase
        .from('bodega_expenses')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', `${today}T00:00:00`),
      supabase
        .from('bodega_cash_closings')
        .select('*')
        .eq('store_id', store.id)
        .order('fecha', { ascending: false })
        .limit(30),
    ]);

  const orders = (ordersData || []) as Order[];
  const payments = (paymentsData || []) as Payment[];
  const expenses = (expensesData || []) as Expense[];
  const closings = (closingsData || []) as CashClosing[];

  return (
    <CierreClient
      storeId={store.id}
      today={today}
      orders={orders || []}
      payments={payments || []}
      expenses={expenses || []}
      closings={closings || []}
    />
  );
}
