import { Order, OrderItem, Zone } from '@/types/bodega';
import { formatPrice } from './format';

export function formatOrderForWhatsApp(
  order: Order,
  storeName: string,
  zone: Zone | null
): string {
  const lines: string[] = [];

  lines.push(`*Nuevo pedido - ${storeName}*`);
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

  if (order.notas) {
    lines.push('');
    lines.push(`Notas: ${order.notas}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
