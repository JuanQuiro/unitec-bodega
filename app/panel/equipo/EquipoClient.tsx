'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { createClient } from '@/utils/supabase/client';
import { Trash2 } from 'lucide-react';

interface EquipoClientProps {
  storeId: string;
  members: { id: string; user_id: string; role: string }[];
  invites: { id: string; email: string; role: string }[];
}

export default function EquipoClient({ storeId, members: initialMembers, invites: initialInvites }: EquipoClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bodega_invites')
      .insert({ store_id: storeId, email: email.trim().toLowerCase(), role: 'empleado' })
      .select()
      .single();
    if (!error && data) {
      setInvites((prev) => [...prev, data as { id: string; email: string; role: string }]);
      setEmail('');
    }
  };

  const removeMember = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('bodega_members').delete().eq('id', id);
    if (!error) setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const removeInvite = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('bodega_invites').delete().eq('id', id);
    if (!error) setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-2xl font-bold">Equipo</h2>
      <p className="mb-6 text-gray-600">
        Los empleados ven pedidos y productos. La persona invitada debe registrarse con ese email y entrar al panel para activar su acceso.
      </p>

      <form onSubmit={handleInvite} className="mb-6 flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="empleado@email.com"
          className="flex-1"
        />
        <Button type="submit">Invitar</Button>
      </form>

      <h3 className="mb-2 font-semibold">Miembros ({members.length})</h3>
      <div className="mb-6 space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
            <div>
              <p className="font-mono text-sm">{m.user_id.slice(0, 8)}…</p>
              <p className="text-xs capitalize text-gray-500">{m.role}</p>
            </div>
            {m.role !== 'owner' && (
              <button onClick={() => removeMember(m.id)} className="text-gray-400 hover:text-red-600" aria-label="Quitar miembro">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {invites.length > 0 && (
        <>
          <h3 className="mb-2 font-semibold">Invitaciones pendientes ({invites.length})</h3>
          <div className="space-y-2">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border border-dashed bg-white p-3">
                <p className="text-sm">{i.email}</p>
                <button onClick={() => removeInvite(i.id)} className="text-gray-400 hover:text-red-600" aria-label="Cancelar invitación">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
