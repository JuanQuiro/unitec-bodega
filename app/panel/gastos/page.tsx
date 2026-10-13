import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { Expense } from '@/types/bodega';
import GastosClient from './GastosClient';

export default async function GastosPage() {
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

  const { data: expensesData } = await supabase
    .from('bodega_expenses')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(200);
  const expenses = (expensesData || []) as Expense[];

  return <GastosClient storeId={store.id} expenses={expenses} />;
}
