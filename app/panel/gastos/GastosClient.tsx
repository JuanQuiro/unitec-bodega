'use client';

import { useState } from 'react';
import { Expense, ExpenseType, PAYMENT_METHODS } from '@/types/bodega';
import { formatPrice, formatDate } from '@/utils/format';
import { monedasForMethod, toNum } from '@/utils/accounting';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { createClient } from '@/utils/supabase/client';
import { Trash2 } from 'lucide-react';

const CATEGORIAS = ['general', 'inventario', 'servicios', 'nomina', 'alquiler', 'transporte', 'otro'];

interface GastosClientProps {
  storeId: string;
  expenses: Expense[];
}

export default function GastosClient({ storeId, expenses: initial }: GastosClientProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initial);
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'VES' | 'USD'>('VES');
  const [metodo, setMetodo] = useState<string>('efectivo');
  const [tipo, setTipo] = useState<ExpenseType>('operativo');

  const pickMetodo = (m: string) => {
    setMetodo(m);
    const allowed = monedasForMethod(m);
    if (!allowed.includes(moneda)) setMoneda(allowed[0]);
  };

  const total = expenses.reduce((s, g) => s + toNum(g.monto), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bodega_expenses')
      .insert({
        store_id: storeId,
        descripcion,
        categoria,
        monto: parseFloat(monto),
        moneda,
        metodo,
        tipo,
      })
      .select()
      .single();
    if (!error && data) {
      setExpenses((prev) => [data as Expense, ...prev]);
      setDescripcion('');
      setMonto('');
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('bodega_expenses').delete().eq('id', id);
    if (!error) setExpenses((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gastos</h2>
        <p className="text-lg font-bold text-red-600">{formatPrice(total)}</p>
      </div>

      <form onSubmit={handleCreate} className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required placeholder="Ej: Compra mayorista" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Monto</label>
            <Input type="number" step="0.01" min="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Moneda</label>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value as 'VES' | 'USD')} className="h-10 w-full rounded-md border px-3 text-sm">
              {monedasForMethod(metodo).map((mo) => (
                <option key={mo} value={mo}>{mo === 'VES' ? 'Bs.' : 'USD'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="h-10 w-full rounded-md border px-3 text-sm">
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as ExpenseType)} className="h-10 w-full rounded-md border px-3 text-sm">
              <option value="operativo">Operativo (resta utilidad)</option>
              <option value="retiro">Retiro (solo mueve caja)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Método</label>
            <select value={metodo} onChange={(e) => pickMetodo(e.target.value)} className="h-10 w-full rounded-md border px-3 text-sm">
              {PAYMENT_METHODS.filter((m) => m !== 'fiado').map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" className="mt-4">Agregar gasto</Button>
      </form>

      <div className="space-y-2">
        {expenses.length === 0 && <p className="py-8 text-center text-gray-500">Sin gastos registrados</p>}
        {expenses.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
            <div>
              <p className="font-medium">{g.descripcion}</p>
              <p className="text-sm text-gray-500">
                {g.categoria} · {g.tipo} · {formatDate(g.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-red-600">
                {g.moneda === 'USD' ? `$${toNum(g.monto).toFixed(2)}` : formatPrice(g.monto)}
              </span>
              <button onClick={() => handleDelete(g.id)} className="text-gray-400 hover:text-red-600" aria-label="Eliminar gasto">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
