import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import EquipoClient from './EquipoClient';

export default async function EquipoPage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/login');

  const mine = await getMyStore(user.id);
  if (!mine) redirect('/panel/onboarding');
  if (mine.role !== 'owner') redirect('/panel');
  const { store } = mine;

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from('bodega_members').select('*').eq('store_id', store.id),
    supabase.from('bodega_invites').select('*').eq('store_id', store.id),
  ]);

  return (
    <EquipoClient
      storeId={store.id}
      members={(members || []) as { id: string; user_id: string; role: string }[]}
      invites={(invites || []) as { id: string; email: string; role: string }[]}
    />
  );
}
