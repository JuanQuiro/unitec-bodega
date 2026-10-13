'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Order, Payment, OrderStatus, PAYMENT_METHODS } from '@/types/bodega';
import { formatPrice, formatDate } from '@/utils/format';
import { fiadoBalance, toNum } from '@/utils/accounting';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { createClient } from '@/utils/supabase/client';
import { applyStockMovement } from '@/utils/stock';

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pendiente: 'confirmado',
  confirmado: 'preparando',
  preparando: 'en_camino',
  en_camino: 'entregado',
};

const nextStatusLabel: Partial<Record<OrderStatus, string>> = {
  pendiente: 'Confirmar',
  confirmado: 'Preparar',
  preparando: 'Enviar',
  en_camino: 'Entregado',
};

interface PedidoDetailClientProps {
  storeId: string;
  storeTasa: number;
  order: Order;
  payments: Payment[];
  zoneName: string | null;
}

export default function PedidoDetailClient({
  storeId,
  storeTasa,
  order: initialOrder,
  payments: initialPayments,
  zoneName,
}: PedidoDetailClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'VES' | 'USD'>('VES');
  const [metodo, setMetodo] = useState('efectivo');

  const pagado = payments.reduce((s, p) => s + toNum(p.monto), 0);
  const saldo = fiadoBalance(order.total, payments, order.tasa_bcv);

  const updateStatus = async (newStatus: OrderStatus) => {
    const supabase = createClient();
    const prevStatus = order.estado;
    const { error } = await supabase
      .from('orders')
      .update({ estado: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    if (!error) {
      await applyStockMovement(supabase, order.items, prevStatus, newStatus);
      setOrder((prev) => ({ ...prev, estado: newStatus }));
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bodega_payments')
      .insert({
        store_id: storeId,
        order_id: order.id,
        cliente_nombre: order.cliente_nombre,
        monto: parseFloat(monto),
        moneda,
        metodo,
        tasa_bcv: storeTasa,
      })
      .select()
      .single();
    if (!error && data) {
      setPayments((prev) => [...prev, data as Payment]);
      setMonto('');
    }
  };

  return (
    <div>
      <Link href="/panel" className="mb-4 inline-block text-sm text-green-700 hover:underline">
        ← Volver a pedidos
      </Link>
      <div className="mb-4 flex justify-end print:hidden">
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          Imprimir ticket
        </Button>
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{order.cliente_nombre}</h2>
          <p className="text-sm text-gray-500">{order.cliente_telefono}</p>
          <p className="text-sm text-gray-500">{order.cliente_direccion}</p>
          {zoneName && <p className="text-sm text-gray-500">Zona: {zoneName}</p>}
          <p className="mt-1 text-sm text-gray-500">
            Método: <span className="font-medium capitalize">{order.metodo_pago.replace('_', ' ')}</span>
            {' · '}
            {formatDate(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.estado} />
      </div>

      <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between py-1 text-sm">
            <span>{item.cantidad} x {item.nombre}</span>
            <span className="font-medium">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        {order.notas && <p className="mt-2 text-sm text-gray-600">Notas: {order.notas}</p>}
      </div>

      <div className="mb-4 flex gap-2">
        {nextStatus[order.estado] && (
          <Button size="sm" onClick={() => updateStatus(nextStatus[order.estado]!)}>
            {nextStatusLabel[order.estado]}
          </Button>
        )}
        {order.estado !== 'cancelado' && order.estado !== 'entregado' && (
          <Button size="sm" variant="outline" onClick={() => updateStatus('cancelado')}>
            Cancelar pedido
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Pagos</h3>
          <p className="text-sm">
            Cobrado: <span className="font-bold text-green-700">{formatPrice(pagado)}</span>
            {' · '}Saldo: <span className={`font-bold ${saldo > 0 ? 'text-amber-600' : 'text-green-700'}`}>{formatPrice(Math.max(0, saldo))}</span>
          </p>
        </div>
        {payments.length === 0 && <p className="text-sm text-gray-500">Sin pagos registrados</p>}
        <div className="mb-3 space-y-1 text-sm">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between border-b py-1 last:border-0">
              <span className="capitalize">{p.metodo}{p.referencia ? ` · ${p.referencia}` : ''}</span>
              <span className="font-medium">{formatPrice(p.monto)}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handlePayment} className="flex flex-wrap items-end gap-2">
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
          <Button type="submit" size="sm">Registrar pago</Button>
        </form>
      </div>
    </div>
  );
}
