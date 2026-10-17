import { OrderItem, Zone } from '@/types/bodega';
import { formatPrice } from './format';

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  efectivo_bs: 'Efectivo (Bs.)',
  pago_movil: 'Pago móvil',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  zelle: 'Zelle',
  paypal: 'PayPal',
  binance: 'Binance',
  usdt: 'USDT',
  fiado: 'Fiado',
};

export function metodoLabel(metodo: string): string {
  return METODO_LABELS[metodo] ?? metodo;
}

// Normaliza teléfonos venezolanos al formato internacional que exige wa.me:
// 04141234567 -> 584141234567 | 4141234567 -> 584141234567 | 584141234567 -> igual
export function normalizeVePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('58')) return digits;
  if (digits.startsWith('0')) return `58${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('4')) return `58${digits}`;
  return digits;
}

export interface WhatsAppOrderData {
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  items: OrderItem[];
  total: number;
  notas?: string | null;
  metodo_pago?: string;
  ref?: string | null;
}

export function formatOrderForWhatsApp(
  order: WhatsAppOrderData,
  storeName: string,
  zone: Zone | null
): string {
  const lines: string[] = [];

  lines.push(`*Nuevo pedido - ${storeName}*`);
  if (order.ref) lines.push(`Ref: ${order.ref}`);
  lines.push('');
  lines.push(`Cliente: ${order.cliente_nombre}`);
  lines.push(`Teléfono: ${order.cliente_telefono}`);
  lines.push(`Dirección: ${order.cliente_direccion}`);

  if (zone) {
    lines.push(`Zona: ${zone.nombre} (${formatPrice(zone.costo)})`);
  }

  lines.push('');
  lines.push('*Productos:*');

  order.items.forEach((item: OrderItem) => {
    lines.push(
      `• ${item.cantidad} x ${item.nombre} - ${formatPrice(item.subtotal)}`
    );
  });

  lines.push('');
  lines.push(`*Total: ${formatPrice(order.total)}*`);

  if (order.metodo_pago) {
    lines.push(`Pago: ${metodoLabel(order.metodo_pago)}`);
  }

  if (order.notas) {
    lines.push('');
    lines.push(`Notas: ${order.notas}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = normalizeVePhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
