import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { Zone } from '@/types/bodega';
import { redirect } from 'next/navigation';
import ZonesClient from './ZonesClient';

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

  const mine = await getMyStore(user.id);

  if (!mine) {
    redirect('/panel/onboarding');
  }
  if (mine.role !== 'owner') {
    redirect('/panel');
  }
  const { store } = mine;

  const zones = await getZones(store.id);

  return <ZonesClient zones={zones} storeId={store.id} />;
}
