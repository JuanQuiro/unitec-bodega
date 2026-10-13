'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';

interface ImportClientProps {
  storeId: string;
  onDone: () => void;
  onCancel: () => void;
}

interface PreviewRow {
  line: number;
  nombre: string;
  categoria: string;
  unidad: string;
  precio: number;
  costo: number;
  stock: number;
}

export default function ImportClient({ storeId, onDone, onCancel }: ImportClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [errors, setErrors] = useState<{ line: number; reason: string }[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const send = async (confirm: boolean) => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('store_id', storeId);
      form.append('confirm', confirm ? '1' : '0');
      const res = await fetch('/api/import/catalogo', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error || 'Error al procesar');
        return;
      }
      if (confirm) {
        setResult(`Listo: ${data.created} creados, ${data.updated} actualizados.`);
        onDone();
      } else {
        setPreview(data.preview || []);
        setErrors(data.errors || []);
        setValidCount(data.validCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Importar Excel</h3>
        <a href="/api/import/plantilla" className="text-sm font-medium text-green-700 hover:underline">
          Descargar plantilla
        </a>
      </div>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null);
          setPreview([]);
          setErrors([]);
          setResult(null);
        }}
        className="mb-3 block w-full text-sm"
      />

      <div className="mb-3 flex gap-2">
        <Button size="sm" variant="outline" disabled={!file || loading} onClick={() => send(false)}>
          {loading ? 'Leyendo...' : 'Previsualizar'}
        </Button>
        {preview.length > 0 && (
          <Button size="sm" disabled={loading} onClick={() => send(true)}>
            Confirmar importación ({validCount})
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {result && <p className="mb-3 text-sm font-medium text-green-700">{result}</p>}

      {errors.length > 0 && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">Filas con error ({errors.length}):</p>
          <ul className="list-disc pl-5">
            {errors.slice(0, 10).map((e, i) => (
              <li key={i}>Línea {e.line}: {e.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.length > 0 && (
        <div className="max-h-64 overflow-auto rounded-md border text-sm">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="p-2">Producto</th>
                <th className="p-2 text-right">Precio</th>
                <th className="p-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r) => (
                <tr key={r.line} className="border-t">
                  <td className="p-2">{r.nombre}</td>
                  <td className="p-2 text-right">{r.precio}</td>
                  <td className="p-2 text-right">{r.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
