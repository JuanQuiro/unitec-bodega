'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, MapPin, Store, LogOut, Calculator, HandCoins, Receipt, Lock, Users } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/panel', label: 'Pedidos', icon: ShoppingCart },
  { href: '/panel/productos', label: 'Productos', icon: Package },
  { href: '/panel/contable', label: 'Contable', icon: Calculator },
  { href: '/panel/fiados', label: 'Fiados', icon: HandCoins },
  { href: '/panel/gastos', label: 'Gastos', icon: Receipt },
  { href: '/panel/cierre', label: 'Cierre', icon: Lock },
  { href: '/panel/zonas', label: 'Zonas', icon: MapPin },
  { href: '/panel/equipo', label: 'Equipo', icon: Users },
  { href: '/panel/tienda', label: 'Mi Tienda', icon: Store },
];

const EMPLEADO_HREFS = ['/panel', '/panel/productos'];

export default function PanelSidebar({ role = 'owner' }: { role?: 'owner' | 'empleado' }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = role === 'owner' ? navItems : navItems.filter((i) => EMPLEADO_HREFS.includes(i.href));

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="hidden w-64 flex-col border-r bg-white md:flex">
      <div className="border-b p-6">
        <h1 className="text-xl font-bold text-green-700">Mi Bodega</h1>
        <p className="text-sm text-gray-500">Panel de gestión</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive =
            item.href === '/panel'
              ? pathname === '/panel'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
