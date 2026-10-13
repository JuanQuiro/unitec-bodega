'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/bodega';
import { formatPrice } from '@/utils/format';
import { bsFromUsd, precioVenta, toNum } from '@/utils/accounting';
import { Button } from '@/components/ui/Button/Button';
import { X, Plus, Minus, Share2, Check } from 'lucide-react';

interface ProductQuickViewProps {
  product: Product | null;
  storeSlug: string;
  storeTasa: number;
  onClose: () => void;
  onAdd: (product: Product, quantity: number) => void;
}

export function ProductQuickView({ product, storeSlug, storeTasa, onClose, onAdd }: ProductQuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${storeSlug}?p=${product?.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // portapapeles no disponible
    }
  };

  if (!product) return null;
  const outOfStock = product.stock <= 0;
  const final = precioVenta(product, storeTasa);
  const base = toNum(product.precio) > 0 ? toNum(product.precio) : bsFromUsd(product.precio_usd, storeTasa);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1 hover:bg-white" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
        {product.foto_url ? (
          <div className="relative h-56 w-full sm:h-72">
            <Image src={product.foto_url} alt={product.nombre} fill className="object-cover" sizes="(max-width: 640px) 100vw, 512px" />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-gray-100 text-gray-400">
            Sin foto
          </div>
        )}
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-900">{product.nombre}</h2>
          {product.descuento_pct > 0 && (
            <span className="mt-1 inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              OFERTA -{product.descuento_pct}%
            </span>
          )}
          <p className="mt-1 text-2xl font-bold text-green-700">
            {formatPrice(final)}
            <span className="ml-1 text-sm font-normal text-gray-500">/ {product.unidad}</span>
          </p>
          {product.descuento_pct > 0 && base > final && (
            <p className="text-sm text-gray-400 line-through">{formatPrice(base)}</p>
          )}
          {product.precio_usd > 0 && (
            <p className="text-xs text-gray-500">Ref: ${Number(product.precio_usd).toFixed(2)}</p>
          )}
          {product.descripcion && <p className="mt-2 text-sm text-gray-600">{product.descripcion}</p>}
          <p className={`mt-2 text-sm ${outOfStock ? 'text-red-600' : 'text-gray-500'}`}>
            {outOfStock ? 'Agotado' : `Stock disponible: ${product.stock}`}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-gray-100"
                aria-label="Quitar uno"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
                aria-label="Agregar uno"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              className="flex-1"
              disabled={outOfStock}
              onClick={() => {
                onAdd(product, quantity);
                setQuantity(1);
                onClose();
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar · {formatPrice(final * quantity)}
            </Button>
          </div>
          <button
            onClick={handleShare}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            {copied ? '¡Link copiado!' : 'Compartir producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
