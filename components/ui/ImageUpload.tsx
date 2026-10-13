'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button/Button';

interface ImageUploadProps {
  bucket: string;
  path: string;
  onUpload: (url: string) => void;
  currentImage?: string | null;
}

// Comprime en el navegador antes de subir: max 1024px, JPEG 82%.
// Una foto de 5MB del teléfono queda en ~150KB.
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1024;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.82)
  );
  if (!blob) throw new Error('No se pudo comprimir la imagen');
  return blob;
}

export function ImageUpload({
  bucket,
  path,
  onUpload,
  currentImage,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);

      const supabase = createClient();
      const fileName = `${path}/${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressed, { contentType: 'image/jpeg' });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      URL.revokeObjectURL(previewUrl);
      setPreview(publicUrl);
      onUpload(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Preview"
          className="h-32 w-32 rounded-lg object-cover"
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Optimizando y subiendo...' : 'Subir imagen'}
      </Button>
    </div>
  );
}
