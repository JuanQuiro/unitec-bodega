import Image from 'next/image';
import { Store } from '@/types/bodega';
import { MapPin } from 'lucide-react';

interface StoreHeaderProps {
  store: Store;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
        {store.logo_url ? (
          <Image
            src={store.logo_url}
            alt={store.nombre}
            width={56}
            height={56}
            className="h-14 w-14 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-green-600 text-2xl font-bold text-white">
            {store.nombre.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h1 className="text-xl font-bold text-gray-900">{store.nombre}</h1>
          {store.direccion && (
            <p className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3 w-3" />
              {store.direccion}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
