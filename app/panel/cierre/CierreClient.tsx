'use client';

import { useState } from 'react';
import { CashClosing } from '@/types/bodega';
import { buildKpis, toNum } from '@/utils/accounting';
import { formatPrice, formatDateShort } from '@/utils/format';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { createClient } from '@/utils/supabase/client';

interface CierreClientProps {
  storeId: string;
  today: string;
  orders: { total: number; estado: string; metodo_pago: string; tasa_bcv: number }[];
  payments: { metodo: string; monto: number; moneda: string; tasa_bcv: number }[];
  expenses: { monto: number; moneda: string; tipo: string; tasa_bcv: number }[];
  closings: CashClosing[];
}

export default function CierreClient({
  storeId,
  today,
  orders,
  payments,
  expenses,
  closings: initial,
}: CierreClientProps) {
  const [closings, setClosings] = useState<CashClosing[]>(initial);
  const [fecha, setFecha] = useState(today);
  const [declarado, setDeclarado] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  const paymentsTotal = payments.reduce((s, p) => s + toNum(p.monto), 0);
  const kpis = buildKpis(orders, paymentsTotal, expenses, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bodega_cash_closings')
      .insert({ store_id: storeId, fecha, declarado: parseFloat(declarado), notas })
      .select()
      .single();
    if (error) {
      setError(
        error.code === '23505'
          ? 'Ya existe un cierre para esa fecha (los cierres no se editan).'
          : error.message,
      );
      return;
    }
    if (data) {
      setClosings((prev) => [data as CashClosing, ...prev].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
      setDeclarado('');
      setNotas('');
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Cierre de caja</h2>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Vendido hoy', value: formatPrice(kpis.vendido) },
          { label: 'Cobrado hoy', value: formatPrice(kpis.cobrado) },
          { label: 'Gastos hoy', value: formatPrice(kpis.gastosOperativos) },
          { label: 'Utilidad hoy', value: formatPrice(kpis.utilidad) },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className="mt-1 text-xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSave} className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Guardar cierre del día</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className="h-10 rounded-md border px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Efectivo contado (Bs.)</label>
            <Input type="number" step="0.01" min="0" value={declarado} onChange={(e) => setDeclarado(e.target.value)} required className="w-44" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
          </div>
          <Button type="submit">Cerrar caja</Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-2 text-xs text-gray-500">Los cierres son inmutables: no se pueden editar ni borrar.</p>
      </form>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Historial</h3>
        {closings.length === 0 && <p className="text-sm text-gray-500">Sin cierres guardados</p>}
        <div className="space-y-2">
          {closings.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <div>
                <p className="font-medium">{formatDateShort(c.fecha)}</p>
                {c.notas && <p className="text-gray-500">{c.notas}</p>}
              </div>
              <p className="font-bold">{formatPrice(c.declarado)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
