'use client';

import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { buildArqueo, buildKpis, round2, toNum } from '@/utils/accounting';
import { formatPrice } from '@/utils/format';
import type { Order, Payment, Expense } from '@/types/bodega';

const PIE_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4', '#64748b'];

interface ContableClientProps {
  storeId: string;
  storeSlug: string;
  orders: Order[];
  payments: Payment[];
  expenses: Expense[];
  products: { id: string; nombre: string; categoria: string }[];
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
  products,
  from,
  to,
  tasa,
}: ContableClientProps) {
  const paymentsTotal = payments.reduce((s, p) => s + toNum(p.monto), 0);
  const kpis = buildKpis(orders, paymentsTotal, expenses, tasa);
  const arqueo = buildArqueo(orders, payments, tasa);

  // Ventas y gastos por día + ventas por categoría + top productos
  const byDay = new Map<string, number>();
  const gastosByDay = new Map<string, number>();
  for (const o of orders) {
    if (o.estado === 'cancelado') continue;
    const day = o.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + toNum(o.total));
  }
  for (const g of expenses) {
    const day = g.created_at.slice(0, 10);
    gastosByDay.set(day, (gastosByDay.get(day) || 0) + toNum(g.monto));
  }
  const allDays = Array.from(
    new Set(Array.from(byDay.keys()).concat(Array.from(gastosByDay.keys())))
  )
    .sort()
    .slice(-14);
  const daysData = allDays.map((d) => ({
    day: d.slice(5),
    ventas: round2(byDay.get(d) || 0),
    gastos: round2(gastosByDay.get(d) || 0),
  }));

  const catOf = new Map(products.map((p) => [p.id, p.categoria]));
  const byCategory = new Map<string, number>();
  const byProduct = new Map<string, { nombre: string; total: number }>();
  for (const o of orders) {
    if (o.estado === 'cancelado') continue;
    for (const it of o.items || []) {
      const cat = catOf.get(it.product_id) || 'otros';
      byCategory.set(cat, (byCategory.get(cat) || 0) + toNum(it.subtotal));
      const prev = byProduct.get(it.product_id) || { nombre: it.nombre, total: 0 };
      prev.total += toNum(it.subtotal);
      byProduct.set(it.product_id, prev);
    }
  }
  const catData = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value);
  const topData = Array.from(byProduct.values())
    .map((p) => ({ nombre: p.nombre.length > 18 ? `${p.nombre.slice(0, 18)}…` : p.nombre, total: round2(p.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

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

      {/* Ventas vs gastos por día */}
      {daysData.length > 0 && (
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Ventas vs gastos por día</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daysData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatPrice(Number(value))} />
              <Area type="monotone" dataKey="ventas" stroke="#16a34a" fill="#bbf7d0" name="Ventas" />
              <Area type="monotone" dataKey="gastos" stroke="#dc2626" fill="#fecaca" name="Gastos" />
            </AreaChart>
          </ResponsiveContainer>
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

      {/* Categorías + top productos */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Ventas por categoría</h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {catData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPrice(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">Sin datos en el período</p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Top productos</h3>
          {topData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatPrice(Number(value))} />
                <Bar dataKey="total" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">Sin datos en el período</p>
          )}
        </div>
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
