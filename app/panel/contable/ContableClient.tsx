'use client';

import Link from 'next/link';
import { buildArqueo, buildKpis, round2, toNum } from '@/utils/accounting';
import { formatPrice } from '@/utils/format';
import type { Order, Payment, Expense } from '@/types/bodega';

interface ContableClientProps {
  storeId: string;
  storeSlug: string;
  orders: Order[];
  payments: Payment[];
  expenses: Expense[];
  from: string;
  to: string;
  tasa: number;
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export default function ContableClient({
  storeId,
  storeSlug,
  orders,
  payments,
  expenses,
  from,
  to,
  tasa,
}: ContableClientProps) {
  const paymentsTotal = payments.reduce((s, p) => s + toNum(p.monto), 0);
  const kpis = buildKpis(orders, paymentsTotal, expenses, tasa);
  const arqueo = buildArqueo(orders, payments, tasa);

  // Ventas por día para la barra simple
  const byDay = new Map<string, number>();
  for (const o of orders) {
    if (o.estado === 'cancelado') continue;
    const day = o.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + toNum(o.total));
  }
  const days = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-14);
  const maxDay = Math.max(1, ...days.map(([, v]) => v));

  const exportBase = `/api/export/ventas?store_id=${storeId}&from=${from}&to=${to}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Contabilidad</h2>
        <div className="flex gap-2">
          <a
            href={`${exportBase}&format=xlsx`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Excel ventas
          </a>
          <a
            href={`${exportBase}&format=csv`}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            CSV
          </a>
        </div>
      </div>

      {/* Filtros */}
      <form method="get" action="/panel/contable" className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Desde</label>
          <input type="date" name="from" defaultValue={from} className="h-10 rounded-md border px-3 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Hasta</label>
          <input type="date" name="to" defaultValue={to} className="h-10 rounded-md border px-3 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tasa Bs./USD</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="tasa"
            defaultValue={tasa || ''}
            placeholder="0"
            className="h-10 w-32 rounded-md border px-3 text-sm"
          />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white">
          Aplicar
        </button>
      </form>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Vendido" value={formatPrice(kpis.vendido)} />
        <KpiCard label="Cobrado" value={formatPrice(kpis.cobrado)} accent="text-green-700" />
        <KpiCard label="Gastos operativos" value={formatPrice(kpis.gastosOperativos)} accent="text-red-600" />
        <KpiCard
          label={`Utilidad (${kpis.margenPct}%)`}
          value={formatPrice(kpis.utilidad)}
          accent={kpis.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}
        />
        <KpiCard label="Ticket promedio" value={formatPrice(kpis.ticketPromedio)} />
        <KpiCard label="Pedidos" value={String(kpis.pedidos)} />
      </div>

      {/* Ventas por día */}
      {days.length > 0 && (
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Ventas por día</h3>
          <div className="flex h-28 items-end gap-1">
            {days.map(([day, v]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1" title={`${day}: ${formatPrice(v)}`}>
                <div
                  className="w-full rounded-t bg-green-500"
                  style={{ height: `${Math.max(4, Math.round((v / maxDay) * 100))}%` }}
                />
                <span className="text-[10px] text-gray-400">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arqueo por método */}
      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Arqueo por método de pago</h3>
        {arqueo.length === 0 ? (
          <p className="text-sm text-gray-500">Sin movimientos en el período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Método</th>
                  <th className="py-2 pr-4 text-right">Movs.</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 text-right">≈ USD</th>
                </tr>
              </thead>
              <tbody>
                {arqueo.map((a) => (
                  <tr key={a.metodo} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium capitalize">{a.metodo.replace('_', ' ')}</td>
                    <td className="py-2 pr-4 text-right">{a.count}</td>
                    <td className="py-2 pr-4 text-right">{formatPrice(a.total)}</td>
                    <td className="py-2 text-right text-gray-500">${round2(a.usdEq).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: '/panel/fiados', title: 'Fiados', desc: 'Cuentas por cobrar y abonos' },
          { href: '/panel/gastos', title: 'Gastos', desc: 'Operativos y retiros' },
          { href: '/panel/cierre', title: 'Cierre de caja', desc: 'Snapshot diario inmutable' },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg border bg-white p-4 shadow-sm hover:border-green-300">
            <h3 className="font-semibold text-green-700">{l.title}</h3>
            <p className="text-sm text-gray-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
