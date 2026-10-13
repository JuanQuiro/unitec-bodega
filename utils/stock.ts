import type { createClient } from '@/utils/supabase/client';
import type { OrderItem } from '@/types/bodega';

type Client = ReturnType<typeof createClient>;

const COMMITTED = ['confirmado', 'preparando', 'en_camino', 'entregado'];

// Mueve stock al cambiar de estado:
// - salir de pendiente hacia un estado comprometido → descuenta
// - entrar a cancelado desde un estado comprometido → devuelve
// - cualquier otro cambio → nada
export async function applyStockMovement(
  supabase: Client,
  items: OrderItem[],
  prevStatus: string,
  nextStatus: string,
): Promise<void> {
  const wasOut = COMMITTED.includes(prevStatus);
  const willBeOut = COMMITTED.includes(nextStatus);
  const dir = (willBeOut ? 1 : 0) - (wasOut ? 1 : 0);
  if (dir === 0 || items.length === 0) return;

  for (const item of items) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', item.product_id)
      .single();
    const row = data as { stock?: number } | null;
    const stock = Number(row?.stock ?? 0);
    const next = dir === 1 ? Math.max(0, stock - item.cantidad) : stock + item.cantidad;
    await supabase.from('products').update({ stock: next }).eq('id', item.product_id);
  }
}
