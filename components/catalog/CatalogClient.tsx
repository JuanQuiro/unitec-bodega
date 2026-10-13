'use client';

import { useState } from 'react';
import { Store, Product, Zone, OrderItem, Order } from '@/types/bodega';
import { StoreHeader } from '@/components/catalog/StoreHeader';
import { SearchBar } from '@/components/catalog/SearchBar';
import { CategoryFilter } from '@/components/catalog/CategoryFilter';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { createClient } from '@/utils/supabase/client';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ShoppingCart } from 'lucide-react';

interface CatalogClientProps {
  store: Store;
  products: Product[];
  zones: Zone[];
}

export default function CatalogClient({
  store,
  products,
  zones,
}: CatalogClientProps) {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nombre
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock) return prev;
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          nombre: product.nombre,
          cantidad: 1,
          precio: product.precio,
          subtotal: product.precio,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) =>
        prev.filter((item) => item.product_id !== productId)
      );
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product || quantity > product.stock) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, cantidad: quantity, subtotal: quantity * item.precio }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product_id !== productId)
    );
  };

  const submitOrder = async (orderData: {
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_direccion: string;
    zone_id: string | null;
    notas: string;
  }): Promise<string> => {
    const supabase = createClient();

    const selectedZone = zones.find((z) => z.id === orderData.zone_id);
    const orderTotal =
      cartItems.reduce((sum, item) => sum + item.subtotal, 0) +
      (selectedZone?.costo ?? 0);

    const order: Partial<Order> = {
      store_id: store.id,
      cliente_nombre: orderData.cliente_nombre,
      cliente_telefono: orderData.cliente_telefono,
      cliente_direccion: orderData.cliente_direccion,
      zone_id: orderData.zone_id,
      items: cartItems,
      total: orderTotal,
      estado: 'pendiente',
      notas: orderData.notas || null,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select('id')
      .single();

    if (error) throw error;

    setCartItems([]);

    return data.id;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader store={store} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 space-y-4">
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
      </main>

      {cartItems.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700"
          aria-label="Abrir carrito"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
            {cartItems.reduce((sum, item) => sum + item.cantidad, 0)}
          </span>
        </button>
      )}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        products={products}
        zones={zones}
        storeName={store.nombre}
        storeWhatsapp={store.whatsapp}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onSubmitOrder={submitOrder}
      />
      <InstallPrompt />
    </div>
  );
}
