import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getMyStore } from '@/utils/supabase/store';
import { getPlanStatus } from '@/utils/subscription';
import PanelSidebar from './PanelSidebar';
import MobileNav from './MobileNav';

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    redirect('/login');
  }

  // Auto-adjuntar invitaciones pendientes por email
  if (user.email) {
    const { data: invitesData } = await supabase
      .from('bodega_invites')
      .select('*')
      .eq('email', user.email);
    const invites = (invitesData || []) as { store_id: string; role: 'owner' | 'empleado' }[];
    for (const inv of invites) {
      await supabase
        .from('bodega_members')
        .upsert(
          { store_id: inv.store_id, user_id: user.id, role: inv.role } as never,
          { onConflict: 'store_id,user_id' }
        );
      await supabase
        .from('bodega_invites')
        .delete()
        .eq('store_id', inv.store_id)
        .eq('email', user.email);
    }
  }

  const mine = await getMyStore(user.id);
  const role = mine?.role || 'owner';

  let banner: { kind: 'warn' | 'error'; text: string } | null = null;
  if (mine && role === 'owner') {
    const { data: subData } = await supabase
      .from('bodega_subscriptions')
      .select('*')
      .eq('store_id', mine.store.id)
      .single();
    const st = getPlanStatus(
      mine.store,
      (subData as { plan: string; status: string; valid_until: string | null } | null)
    );
    if (st.expired) {
      banner = {
        kind: 'error',
        text: 'Tu período de prueba terminó. Escribinos para activar tu plan y seguir cargando productos.',
      };
    } else if (st.trial && st.daysLeft <= 3) {
      banner = {
        kind: 'warn',
        text: `Te quedan ${st.daysLeft} días de prueba. Activá tu plan para no interrumpir el servicio.`,
      };
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PanelSidebar role={role} />
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
        {banner && (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${
              banner.kind === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {banner.text}{' '}
            <Link href="/panel/tienda" className="font-medium underline">
              Ver mi plan
            </Link>
          </div>
        )}
        {children}
      </main>
      <MobileNav role={role} />
    </div>
  );
}
