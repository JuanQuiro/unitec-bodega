'use client';

import { Product } from '@/types/bodega';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  tasaBcv: number;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export function ProductGrid({ products, tasaBcv, onAddToCart, onQuickView }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No hay productos disponibles
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          tasaBcv={tasaBcv}
          onAdd={onAddToCart}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
}
