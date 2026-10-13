'use client';

import { useState } from 'react';
import { Product, Zone, OrderItem } from '@/types/bodega';
import { formatPrice } from '@/utils/format';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  products: Product[];
  zones: Zone[];
  storeName: string;
  storeWhatsapp: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onSubmitOrder: (orderData: {
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_direccion: string;
    zone_id: string | null;
    notas: string;
    metodo_pago: string;
  }) => Promise<string>;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  products,
  zones,
  storeName,
  storeWhatsapp,
  onUpdateQuantity,
  onRemove,
  onSubmitOrder,
}: CartDrawerProps) {
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [zoneId, setZoneId] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('efectivo');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedZone = zones.find((z) => z.id === zoneId);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCost = selectedZone?.costo ?? 0;
  const total = subtotal + deliveryCost;
  const meetsMinimum = !selectedZone || subtotal >= selectedZone.minimo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const orderId = await onSubmitOrder({
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        cliente_direccion: clienteDireccion,
        zone_id: zoneId || null,
        notas,
        metodo_pago: metodoPago,
      });

      // Redirigir a WhatsApp
      const waUrl = `https://wa.me/${storeWhatsapp.replace(/[^\d]/g, '')}`;
      window.open(waUrl, '_blank');

      onClose();
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getProductStock = (productId: string) => {
    return products.find((p) => p.id === productId)?.stock ?? 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingCart className="h-5 w-5" />
            Tu pedido
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Tu carrito está vacío
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {items.map((item) => {
                  const stock = getProductStock(item.product_id);
                  return (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(item.precio)} / {products.find((p) => p.id === item.product_id)?.unidad}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, item.cantidad - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, item.cantidad + 1)}
                          disabled={item.cantidad >= stock}
                          className="flex h-7 w-7 items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onRemove(item.product_id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="ml-3 w-20 text-right text-sm font-bold">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Zonas de entrega */}
              {zones.length > 0 && (
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium">
                    Zona de entrega
                  </label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar zona</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.nombre} - {formatPrice(zone.costo)} (mínimo: {formatPrice(zone.minimo)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Formulario de cliente */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nombre</label>
                  <Input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    required
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Teléfono</label>
                  <Input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    required
                    placeholder="0412-1234567"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Dirección</label>
                  <Input
                    value={clienteDireccion}
                    onChange={(e) => setClienteDireccion(e.target.value)}
                    required
                    placeholder="Dirección de entrega"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Método de pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="pago_movil">Pago móvil</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="zelle">Zelle</option>
                    <option value="usdt">USDT</option>
                    <option value="binance">Binance</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Notas (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Indicaciones adicionales..."
                  />
                </div>
              </form>
            </div>

            <div className="border-t p-4">
              <div className="mb-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {selectedZone && (
                  <div className="flex justify-between">
                    <span>Delivery ({selectedZone.nombre})</span>
                    <span>{formatPrice(deliveryCost)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {selectedZone && !meetsMinimum && (
                <p className="mb-2 text-xs text-red-600">
                  El pedido mínimo para {selectedZone.nombre} es {formatPrice(selectedZone.minimo)}
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting || !meetsMinimum || !clienteNombre || !clienteTelefono || !clienteDireccion}
                className="w-full"
                size="lg"
              >
                {submitting ? 'Enviando...' : `Pedir por WhatsApp`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
