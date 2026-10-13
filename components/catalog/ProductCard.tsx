'use client';

import { Product } from '@/types/bodega';
import { formatPrice } from '@/utils/format';
import { Button } from '@/components/ui/Button/Button';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <div className="flex flex-col rounded-lg border bg-white p-3 shadow-sm">
      {product.foto_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.foto_url}
          alt={product.nombre}
          className="mb-3 h-32 w-full rounded-md object-cover"
        />
      ) : (
        <div className="mb-3 flex h-32 w-full items-center justify-center rounded-md bg-gray-100 text-gray-400">
          Sin foto
        </div>
      )}

      <h3 className="mb-1 text-sm font-medium text-gray-900">
        {product.nombre}
      </h3>

      <p className="mb-2 text-lg font-bold text-green-700">
        {formatPrice(product.precio)}
        <span className="ml-1 text-xs font-normal text-gray-500">
          / {product.unidad}
        </span>
      </p>

      <div className="mt-auto flex items-center justify-between">
        <span
          className={`text-xs ${outOfStock ? 'text-red-600' : 'text-gray-500'}`}
        >
          {outOfStock ? 'Agotado' : `Stock: ${product.stock}`}
        </span>

        <Button
          size="sm"
          onClick={() => onAdd(product)}
          disabled={outOfStock}
          className="h-8 px-3"
        >
          <Plus className="mr-1 h-3 w-3" />
          Agregar
        </Button>
      </div>
    </div>
  );
}
