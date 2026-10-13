'use client';

import { useState } from 'react';
import { Store } from '@/types/bodega';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { QRCode } from '@/components/QRCode';
import { createClient } from '@/utils/supabase/client';
import { Check, Copy } from 'lucide-react';

interface StoreSettingsClientProps {
  store: Store;
}

export default function StoreSettingsClient({ store }: StoreSettingsClientProps) {
  const [nombre, setNombre] = useState<string>(store.nombre);
  const [whatsapp, setWhatsapp] = useState<string>(store.whatsapp);
  const [direccion, setDireccion] = useState<string>(store.direccion ?? '');
  const [logoUrl, setLogoUrl] = useState<string>(store.logo_url ?? '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/s/${store.slug}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      await supabase
        .from('stores')
        .update({
          nombre,
          whatsapp,
          direccion,
          logo_url: logoUrl || null,
        })
        .eq('id', store.id);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold">Mi Tienda</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-medium">Datos de la tienda</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">WhatsApp</label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                placeholder="04121234567"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Dirección</label>
              <Input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección de la bodega"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Logo</label>
              <ImageUpload
                bucket="logos"
                path={`stores/${store.id}`}
                onUpload={setLogoUrl}
                currentImage={logoUrl}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-medium">Link público</h3>

          <div className="mb-4 flex items-center gap-2">
            <Input value={publicUrl} readOnly className="bg-gray-50" />
            <Button type="button" variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <p className="mb-4 text-sm text-gray-500">
            Comparte este link o el código QR para que tus clientes hagan pedidos.
          </p>

          <div className="flex justify-center">
            <QRCode value={publicUrl} size={200} />
          </div>
        </div>

        <Button type="submit" disabled={saving} size="lg">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  );
}
