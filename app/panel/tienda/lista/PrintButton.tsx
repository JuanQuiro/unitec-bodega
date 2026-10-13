'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white print:hidden"
    >
      <Printer className="h-4 w-4" />
      Imprimir / PDF
    </button>
  );
}
