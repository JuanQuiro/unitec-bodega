import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { redirect } from 'next/navigation';
import StoreSettingsClient from './StoreSettingsClient';

export default async function StoreSettingsPage() {
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

  return <StoreSettingsClient store={store} />;
}
