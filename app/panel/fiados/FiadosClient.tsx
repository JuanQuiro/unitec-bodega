'use client';

import { useState } from 'react';
import { Order, Payment, PAYMENT_METHODS } from '@/types/bodega';
import { formatPrice, formatDate } from '@/utils/format';
import { fiadoBalance, toNum } from '@/utils/accounting';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { createClient } from '@/utils/supabase/client';

interface FiadosClientProps {
  storeId: string;
  storeTasa: number;
  orders: Order[];
  payments: Pick<Payment, 'order_id' | 'monto' | 'moneda' | 'metodo' | 'tasa_bcv'>[];
}

export default function FiadosClient({ storeId, storeTasa, orders, payments: initialPayments }: FiadosClientProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [abonarId, setAbonarId] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'VES' | 'USD'>('VES');
  const [metodo, setMetodo] = useState('efectivo');
  const [referencia, setReferencia] = useState('');

  const paymentsOf = (orderId: string) => payments.filter((p) => p.order_id === orderId);
  const totalVivo = orders.reduce((s, o) => s + Math.max(0, fiadoBalance(o.total, paymentsOf(o.id), 0)), 0);

  const handleAbonar = async (e: React.FormEvent, order: Order) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: inserted, error } = await supabase
      .from('bodega_payments')
      .insert({
        store_id: storeId,
        order_id: order.id,
        cliente_nombre: order.cliente_nombre,
        monto: parseFloat(monto),
        moneda,
        metodo,
        referencia,
        tasa_bcv: storeTasa,
      })
      .select('*')
      .single();
    const data = inserted as unknown as Pick<Payment, 'order_id' | 'monto' | 'moneda' | 'metodo' | 'tasa_bcv'> | null;
    if (!error && data) {
      setPayments((prev) => [...prev, data]);
      setAbonarId(null);
      setMonto('');
      setReferencia('');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fiados</h2>
        <p className="text-lg font-bold text-amber-600">Por cobrar: {formatPrice(totalVivo)}</p>
      </div>

      {orders.length === 0 && (
        <p className="py-12 text-center text-gray-500">
          Sin fiados abiertos. Los pedidos con método “fiado” aparecen aquí.
        </p>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const saldo = fiadoBalance(order.total, paymentsOf(order.id), 0);
          const cerrado = saldo <= 0;
          return (
            <div key={order.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{order.cliente_nombre}</h3>
                  <p className="text-sm text-gray-500">{order.cliente_telefono}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total: {formatPrice(order.total)}</p>
                  <p className={`text-lg font-bold ${cerrado ? 'text-green-700' : 'text-amber-600'}`}>
                    {cerrado ? 'Pagado' : `Debe: ${formatPrice(saldo)}`}
                  </p>
                </div>
              </div>

              {paymentsOf(order.id).length > 0 && (
                <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
                  {paymentsOf(order.id).map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="capitalize">{p.metodo}</span>
                      <span>{formatPrice(p.monto)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!cerrado && (
                <div className="mt-3">
                  {abonarId === order.id ? (
                    <form onSubmit={(e) => handleAbonar(e, order)} className="flex flex-wrap items-end gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium">Monto</label>
                        <Input type="number" step="0.01" min="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required className="w-28" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">Moneda</label>
                        <select value={moneda} onChange={(e) => setMoneda(e.target.value as 'VES' | 'USD')} className="h-10 rounded-md border px-2 text-sm">
                          <option value="VES">Bs.</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">Método</label>
                        <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="h-10 rounded-md border px-2 text-sm">
                          {PAYMENT_METHODS.filter((m) => m !== 'fiado').map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">Referencia</label>
                        <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Opcional" className="w-36" />
                      </div>
                      <Button type="submit" size="sm">Abonar</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setAbonarId(null)}>
                        Cerrar
                      </Button>
                    </form>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setAbonarId(order.id)}>
                        Registrar abono
                      </Button>
                      <a
                        href={`https://wa.me/${order.cliente_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hola ${order.cliente_nombre}, te recordamos tu saldo pendiente de ${formatPrice(saldo)} en tu bodega. ¡Gracias!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Recordar por WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
