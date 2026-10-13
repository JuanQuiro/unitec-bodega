'use client';

import Image from 'next/image';
import { Product } from '@/types/bodega';
import { formatPrice } from '@/utils/format';
import { bsFromUsd, precioVenta, toNum } from '@/utils/accounting';
import { Button } from '@/components/ui/Button/Button';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  tasaBcv: number;
  onAdd: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, tasaBcv, onAdd, onQuickView }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  const final = precioVenta(product, tasaBcv);
  const base = toNum(product.precio) > 0 ? toNum(product.precio) : bsFromUsd(product.precio_usd, tasaBcv);

  return (
    <div
      className="flex cursor-pointer flex-col rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={() => onQuickView(product)}
    >
      {product.foto_url ? (
        <div className="relative mb-3 h-32 w-full overflow-hidden rounded-md">
          <Image
            src={product.foto_url}
            alt={product.nombre}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="mb-3 flex h-32 w-full items-center justify-center rounded-md bg-gray-100 text-gray-400">
          Sin foto
        </div>
      )}

      <h3 className="mb-1 text-sm font-medium text-gray-900">
        {product.nombre}
      </h3>

      {product.descuento_pct > 0 && (
        <span className="mb-1 inline-block w-fit rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
          OFERTA -{product.descuento_pct}%
        </span>
      )}
      <p className="mb-1 text-lg font-bold text-green-700">
        {formatPrice(final)}
        <span className="ml-1 text-xs font-normal text-gray-500">
          / {product.unidad}
        </span>
      </p>
      {product.descuento_pct > 0 && base > final && (
        <p className="-mt-1 mb-1 text-sm text-gray-400 line-through">{formatPrice(base)}</p>
      )}
      {product.precio_usd > 0 && (
        <p className="mb-2 text-xs text-gray-500">Ref: ${Number(product.precio_usd).toFixed(2)}</p>
      )}

      <div className="mt-auto flex items-center justify-between">
        <span
          className={`text-xs ${outOfStock ? 'text-red-600' : 'text-gray-500'}`}
        >
          {outOfStock ? 'Agotado' : `Stock: ${product.stock}`}
        </span>

        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
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
