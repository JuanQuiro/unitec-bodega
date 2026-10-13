'use client';

import { useState } from 'react';
import { Product, PRODUCT_UNITS, PRODUCT_CATEGORIES } from '@/types/bodega';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ImageUpload } from './ImageUpload';

interface ProductFormProps {
  product?: Product;
  storeId: string;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({
  product,
  storeId,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [nombre, setNombre] = useState(product?.nombre ?? '');
  const [precio, setPrecio] = useState(product?.precio?.toString() ?? '');
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0');
  const [unidad, setUnidad] = useState<Product['unidad']>(product?.unidad ?? 'unidad');
  const [categoria, setCategoria] = useState<Product['categoria']>(product?.categoria ?? 'viveres');
  const [fotoUrl, setFotoUrl] = useState(product?.foto_url ?? '');
  const [activo, setActivo] = useState(product?.activo ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        store_id: storeId,
        nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock, 10),
        unidad: unidad as Product['unidad'],
        categoria: categoria as Product['categoria'],
        foto_url: fotoUrl || null,
        activo,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre</label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Ej: Arroz 1kg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Precio (Bs.)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Stock</label>
          <Input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Unidad</label>
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value as Product['unidad'])}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Product['categoria'])}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Foto</label>
        <ImageUpload
          bucket="productos"
          path={`stores/${storeId}`}
          onUpload={setFotoUrl}
          currentImage={fotoUrl}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="activo"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="activo" className="text-sm">
          Producto activo
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
