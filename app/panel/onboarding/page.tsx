import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const mine = await getMyStore(user.id);
  if (!mine) redirect('/login');
  if (mine.role !== 'owner') redirect('/panel');
  const { store } = mine;

  const [{ count: productsCount }, { count: zonesCount }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('zones').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
  ]);

  return (
    <OnboardingClient
      store={store}
      hasProducts={(productsCount || 0) > 0}
      hasZones={(zonesCount || 0) > 0}
    />
  );
}
