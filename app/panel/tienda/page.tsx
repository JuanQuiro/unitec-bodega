import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { Store } from '@/types/bodega';
import { redirect } from 'next/navigation';
import StoreSettingsClient from './StoreSettingsClient';

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

export default async function StoreSettingsPage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    redirect('/login');
  }

  const store = await getStore(user.id);

  if (!store) {
    redirect('/panel');
  }

  return <StoreSettingsClient store={store} />;
}
