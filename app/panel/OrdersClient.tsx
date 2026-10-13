'use client';

import { useState } from 'react';
import { Order, Zone, ORDER_STATUSES, OrderStatus } from '@/types/bodega';
import { formatPrice, formatDate } from '@/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/utils/cn';

interface OrdersClientProps {
  orders: Order[];
  zones: Zone[];
  storeId: string;
}

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

export default function OrdersClient({
  orders: initialOrders,
  zones,
  storeId,
}: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | null>(null);

  const filteredOrders = filter
    ? orders.filter((o) => o.estado === filter)
    : orders;

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('orders')
      .update({ estado: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, estado: newStatus, updated_at: new Date().toISOString() }
            : o
        )
      );
    }
  };

  const getZoneName = (zoneId: string | null) => {
    if (!zoneId) return null;
    return zones.find((z) => z.id === zoneId)?.nombre ?? null;
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Pedidos</h2>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
            filter === null
              ? 'border-green-600 bg-green-600 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
          )}
        >
          Todos
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              filter === status
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No hay pedidos para mostrar
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{order.cliente_nombre}</h3>
                  <p className="text-sm text-gray-500">
                    {order.cliente_telefono}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.cliente_direccion}
                  </p>
                  {getZoneName(order.zone_id) && (
                    <p className="text-sm text-gray-500">
                      Zona: {getZoneName(order.zone_id)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <StatusBadge status={order.estado} />
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-3 rounded-md bg-gray-50 p-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.cantidad} x {item.nombre}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              {order.notas && (
                <p className="mb-3 text-sm text-gray-600">
                  <span className="font-medium">Notas:</span> {order.notas}
                </p>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2">
                {nextStatus[order.estado] && (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateOrderStatus(
                        order.id,
                        nextStatus[order.estado]!
                      )
                    }
                  >
                    {nextStatusLabel[order.estado]}
                  </Button>
                )}
                {order.estado !== 'cancelado' &&
                  order.estado !== 'entregado' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateOrderStatus(order.id, 'cancelado')
                      }
                    >
                      Cancelar
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
