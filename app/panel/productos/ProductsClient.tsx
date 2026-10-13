'use client';

import { useState } from 'react';
import { Product, PRODUCT_CATEGORIES } from '@/types/bodega';
import { formatPrice } from '@/utils/format';
import { Button } from '@/components/ui/Button/Button';
import { ProductForm } from '@/components/ui/ProductForm';
import ImportClient from './ImportClient';
import { createClient } from '@/utils/supabase/client';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';

interface ProductsClientProps {
  products: Product[];
  storeId: string;
}

export default function ProductsClient({
  products: initialProducts,
  storeId,
}: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkCategory, setBulkCategory] = useState<string>('all');

  const handleCreate = async (data: Partial<Product>) => {
    const supabase = createClient();
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (!error && newProduct) {
      setProducts((prev) => [newProduct as Product, ...prev]);
      setShowForm(false);
    }
  };

  const handleUpdate = async (data: Partial<Product>) => {
    if (!editingProduct) return;

    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', editingProduct.id)
      .select()
      .single();

    if (!error && updated) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? (updated as Product) : p))
      );
      setEditingProduct(null);
    }
  };

  const handleDelete = async (productId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ activo: !product.activo })
      .eq('id', product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, activo: !p.activo } : p
        )
      );
    }
  };

  const handleBulkUpdate = async () => {
    const percent = parseFloat(bulkPercent);
    if (isNaN(percent) || percent <= 0) return;

    const supabase = createClient();
    const multiplier = 1 + percent / 100;

    let query = supabase
      .from('products')
      .select('id, precio')
      .eq('store_id', storeId);

    if (bulkCategory !== 'all') {
      query = query.eq('categoria', bulkCategory);
    }

    const { data: productsToUpdate, error: fetchError } = await query;

    if (fetchError || !productsToUpdate) return;

    for (const product of productsToUpdate) {
      const newPrice = Math.round(product.precio * multiplier * 100) / 100;
      await supabase
        .from('products')
        .update({ precio: newPrice })
        .eq('id', product.id);
    }

    // Recargar productos
    const { data: refreshed } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (refreshed) {
      setProducts(refreshed as Product[]);
    }

    setBulkMode(false);
    setBulkPercent('');
  };

  const refreshProducts = async () => {
    const supabase = createClient();
    const { data: refreshed } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (refreshed) {
      setProducts(refreshed as Product[]);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Productos</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportMode(!importMode)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => setBulkMode(!bulkMode)}
          >
            Remarcar %
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {bulkMode && (
        <div className="mb-6 rounded-lg border bg-yellow-50 p-4">
          <h3 className="mb-3 font-medium">Remarcar precios</h3>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="% incremento"
              value={bulkPercent}
              onChange={(e) => setBulkPercent(e.target.value)}
              className="w-32 rounded-md border px-3 py-2 text-sm"
            />
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">Todas las categorías</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Button onClick={handleBulkUpdate}>Aplicar</Button>
            <Button variant="outline" onClick={() => setBulkMode(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {importMode && (
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <ImportClient
            storeId={storeId}
            onDone={refreshProducts}
            onCancel={() => setImportMode(false)}
          />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nuevo producto</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProductForm
              storeId={storeId}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar producto</h3>
              <button onClick={() => setEditingProduct(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProductForm
              product={editingProduct}
              storeId={storeId}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-semibold">Eliminar producto</h3>
            <p className="mb-4 text-sm text-gray-600">
              ¿Estás seguro de que querés eliminar este producto? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-4">Producto</th>
              <th className="p-4">Categoría</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Margen</th>
                <th className="p-4">Stock</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {product.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.foto_url}
                        alt={product.nombre}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-100" />
                    )}
                    <span className="font-medium">{product.nombre}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {product.categoria}
                </td>
                <td className="p-4 font-medium">
                  {formatPrice(product.precio)}
                </td>
                <td className="p-4 text-sm">
                  {product.precio > 0 && product.costo > 0
                    ? `${Math.round((1 - product.costo / product.precio) * 100)}%`
                    : '—'}
                </td>
                <td className="p-4 text-sm">
                  <span className={product.stock <= 5 ? 'font-bold text-red-600' : ''}>
                    {product.stock}
                  </span>
                  {product.stock <= 5 && (
                    <span className="ml-1 text-xs text-red-500">¡Bajo!</span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      product.activo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {product.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="rounded p-1 hover:bg-gray-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No hay productos cargados
          </div>
        )}
      </div>
    </div>
  );
}
