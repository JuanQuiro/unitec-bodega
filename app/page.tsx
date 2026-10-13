import Link from 'next/link';
import { ShoppingCart, Store, MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-green-700">Mi Bodega</h1>
          <Link
            href="/login"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Ingresar
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Pedidos por WhatsApp para tu bodega
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Cargá tus productos, compartí un link o QR, y recibí pedidos directo en tu WhatsApp.
          </p>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-6">
              <Store className="mx-auto mb-3 h-8 w-8 text-green-600" />
              <h3 className="font-medium">Cargá tu catálogo</h3>
              <p className="text-sm text-gray-500">Productos con foto, precio y stock</p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-green-600" />
              <h3 className="font-medium">Compartí tu link</h3>
              <p className="text-sm text-gray-500">Tus clientes piden sin registro</p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-green-600" />
              <h3 className="font-medium">Recibí en WhatsApp</h3>
              <p className="text-sm text-gray-500">Pedidos directo a tu teléfono</p>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-block rounded-lg bg-green-600 px-8 py-3 text-lg font-medium text-white hover:bg-green-700"
          >
            Empezar ahora
          </Link>
        </div>
      </main>
    </div>
  );
}
