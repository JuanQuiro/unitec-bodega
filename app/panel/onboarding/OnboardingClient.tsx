'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store } from '@/types/bodega';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { createClient } from '@/utils/supabase/client';
import { Check } from 'lucide-react';

interface OnboardingClientProps {
  store: Store;
  hasProducts: boolean;
  hasZones: boolean;
}

export default function OnboardingClient({ store, hasProducts, hasZones }: OnboardingClientProps) {
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState(store.nombre);
  const [whatsapp, setWhatsapp] = useState(store.whatsapp);
  const [direccion, setDireccion] = useState(store.direccion ?? '');
  const [zoneNombre, setZoneNombre] = useState('');
  const [zoneCosto, setZoneCosto] = useState('');
  const [zoneMinimo, setZoneMinimo] = useState('');
  const [done, setDone] = useState({ datos: false, zona: hasZones, productos: hasProducts });

  const saveDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase
      .from('stores')
      .update({ nombre, whatsapp, direccion })
      .eq('id', store.id);
    if (!error) {
      setDone((d) => ({ ...d, datos: true }));
      setStep(2);
    }
  };

  const saveZona = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from('zones').insert({
      store_id: store.id,
      nombre: zoneNombre,
      costo: parseFloat(zoneCosto) || 0,
      minimo: parseFloat(zoneMinimo) || 0,
    });
    if (!error) {
      setDone((d) => ({ ...d, zona: true }));
      setStep(3);
    }
  };

  const steps = ['Datos', 'Zona de entrega', 'Productos'];

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-2xl font-bold">Configurá tu bodega</h2>
      <p className="mb-6 text-gray-600">Tres pasos y empezás a vender.</p>

      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`flex-1 rounded-lg border p-2 text-center text-sm font-medium ${
              step === i + 1
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'bg-white text-gray-500'
            }`}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={saveDatos} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre de la bodega</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">WhatsApp (recibís los pedidos acá)</label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required placeholder="04121234567" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Dirección</label>
            <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección de referencia" />
          </div>
          <Button type="submit" className="w-full">
            Guardar y seguir {done.datos && <Check className="ml-2 h-4 w-4" />}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={saveZona} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre de la zona</label>
            <Input value={zoneNombre} onChange={(e) => setZoneNombre(e.target.value)} required placeholder="Ej: Centro" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Costo envío (Bs.)</label>
              <Input type="number" step="0.01" min="0" value={zoneCosto} onChange={(e) => setZoneCosto(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pedido mínimo (Bs.)</label>
              <Input type="number" step="0.01" min="0" value={zoneMinimo} onChange={(e) => setZoneMinimo(e.target.value)} required />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button type="submit" className="flex-1">Guardar zona y seguir</Button>
          </div>
          {done.zona && (
            <button type="button" onClick={() => setStep(3)} className="w-full text-center text-sm text-green-700 hover:underline">
              Ya tengo zonas, saltar
            </button>
          )}
        </form>
      )}

      {step === 3 && (
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">Cargá tus productos</h3>
          <p className="mb-4 text-sm text-gray-600">
            Uno por uno, o todos juntos con un Excel usando la plantilla.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/panel/productos" className="rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
              Ir a productos
            </Link>
            <Link href="/panel" className="rounded-lg border px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
              Terminar e ir al panel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
