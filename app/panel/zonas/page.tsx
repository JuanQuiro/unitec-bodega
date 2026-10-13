import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { Zone, Store } from '@/types/bodega';
import { redirect } from 'next/navigation';
import ZonesClient from './ZonesClient';

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

async function getZones(storeId: string): Promise<Zone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data as Zone[];
}

export default async function ZonesPage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    redirect('/login');
  }

  const store = await getStore(user.id);

  if (!store) {
    redirect('/panel');
  }

  const zones = await getZones(store.id);

  return <ZonesClient zones={zones} storeId={store.id} />;
}
