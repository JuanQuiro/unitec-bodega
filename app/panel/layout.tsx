import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PanelSidebar />
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      <MobileNav />
    </div>
  );
}
