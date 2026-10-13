'use client';

import { useState } from 'react';
import { Zone } from '@/types/bodega';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';

interface ZoneFormProps {
  zone?: Zone;
  storeId: string;
  onSubmit: (data: Partial<Zone>) => Promise<void>;
  onCancel: () => void;
}

export function ZoneForm({ zone, storeId, onSubmit, onCancel }: ZoneFormProps) {
  const [nombre, setNombre] = useState(zone?.nombre ?? '');
  const [costo, setCosto] = useState(zone?.costo?.toString() ?? '');
  const [minimo, setMinimo] = useState(zone?.minimo?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        store_id: storeId,
        nombre,
        costo: parseFloat(costo),
        minimo: parseFloat(minimo),
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
          placeholder="Ej: Centro"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Costo (Bs.)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mínimo (Bs.)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
            required
          />
        </div>
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
