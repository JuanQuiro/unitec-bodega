import { createClient } from './server';
import type { Store } from '@/types/bodega';

export type MemberRole = 'owner' | 'empleado';

// Resuelve la tienda del usuario: propia (owner) o por membresía (empleado).
export async function getMyStore(
  userId: string
): Promise<{ store: Store; role: MemberRole } | null> {
  const supabase = createClient();

  const { data: owned } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', userId)
    .single();
  const own = owned as Store | null;
  if (own) return { store: own, role: 'owner' };

  const { data: membership } = await supabase
    .from('bodega_members')
    .select('store_id,role')
    .eq('user_id', userId)
    .limit(1)
    .single();
  const m = membership as { store_id: string; role: MemberRole } | null;
  if (!m) return null;

  const { data: memberStore } = await supabase
    .from('stores')
    .select('*')
    .eq('id', m.store_id)
    .single();
  const st = memberStore as Store | null;
  if (!st) return null;
  return { store: st, role: m.role };
}
