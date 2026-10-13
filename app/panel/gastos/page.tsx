import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { Expense } from '@/types/bodega';
import GastosClient from './GastosClient';

export default async function GastosPage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const mine = await getMyStore(user.id);
  if (!mine) redirect('/panel/onboarding');
  if (mine.role !== 'owner') redirect('/panel');
  const { store } = mine;

  const { data: expensesData } = await supabase
    .from('bodega_expenses')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(200);
  const expenses = (expensesData || []) as Expense[];

  return <GastosClient storeId={store.id} expenses={expenses} />;
}
