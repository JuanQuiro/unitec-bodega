'use client';

import { useState } from 'react';
import { Zone } from '@/types/bodega';
import { formatPrice } from '@/utils/format';
import { Button } from '@/components/ui/Button/Button';
import { ZoneForm } from '@/components/ui/ZoneForm';
import { createClient } from '@/utils/supabase/client';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface ZonesClientProps {
  zones: Zone[];
  storeId: string;
}

export default function ZonesClient({
  zones: initialZones,
  storeId,
}: ZonesClientProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = async (data: Partial<Zone>) => {
    const supabase = createClient();
    const { data: newZone, error } = await supabase
      .from('zones')
      .insert(data)
      .select()
      .single();

    if (!error && newZone) {
      setZones((prev) => [...prev, newZone as Zone]);
      setShowForm(false);
    }
  };

  const handleUpdate = async (data: Partial<Zone>) => {
    if (!editingZone) return;

    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from('zones')
      .update(data)
      .eq('id', editingZone.id)
      .select()
      .single();

    if (!error && updated) {
      setZones((prev) =>
        prev.map((z) => (z.id === editingZone.id ? (updated as Zone) : z))
      );
      setEditingZone(null);
    }
  };

  const handleDelete = async (zoneId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('zones').delete().eq('id', zoneId);

    if (!error) {
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
      setDeleteConfirm(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Zonas de entrega</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva zona
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nueva zona</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <ZoneForm
              storeId={storeId}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar zona</h3>
              <button onClick={() => setEditingZone(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <ZoneForm
              zone={editingZone}
              storeId={storeId}
              onSubmit={handleUpdate}
              onCancel={() => setEditingZone(null)}
            />
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-semibold">Eliminar zona</h3>
            <p className="mb-4 text-sm text-gray-600">
              ¿Estás seguro de que querés eliminar esta zona?
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

      <div className="space-y-3">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4"
          >
            <div>
              <h3 className="font-medium">{zone.nombre}</h3>
              <p className="text-sm text-gray-500">
                Costo: {formatPrice(zone.costo)} | Mínimo: {formatPrice(zone.minimo)}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setEditingZone(zone)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteConfirm(zone.id)}
                className="rounded p-1 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {zones.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No hay zonas de entrega configuradas
          </div>
        )}
      </div>
    </div>
  );
}
