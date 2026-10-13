'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, Store, Calculator, HandCoins } from 'lucide-react';

const navItems = [
  { href: '/panel', label: 'Pedidos', icon: ShoppingCart },
  { href: '/panel/productos', label: 'Productos', icon: Package },
  { href: '/panel/contable', label: 'Contable', icon: Calculator },
  { href: '/panel/fiados', label: 'Fiados', icon: HandCoins },
  { href: '/panel/tienda', label: 'Tienda', icon: Store },
];

export default function MobileNav({ role = 'owner' }: { role?: 'owner' | 'empleado' }) {
  const pathname = usePathname();
  const items =
    role === 'owner'
      ? navItems
      : navItems.filter((i) => ['/panel', '/panel/productos'].includes(i.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden">
      <div className={`grid ${items.length > 2 ? 'grid-cols-5' : 'grid-cols-2'}`}>
        {items.map((item) => {
          const isActive =
            item.href === '/panel'
              ? pathname === '/panel'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? 'text-green-700' : 'text-gray-400'}`}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
