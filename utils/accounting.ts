import { PAYMENT_METHODS } from '@/types/bodega';

export const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const round2 = (v: number): number => Math.round(v * 100) / 100;

// Normaliza métodos libres al catálogo canónico (patrón cocolu).
export function normalizeMethod(raw: unknown): string {
  const m = String(raw || 'efectivo').toLowerCase().trim();
  if ((PAYMENT_METHODS as readonly string[]).includes(m)) return m;
  if (m.startsWith('pago_movil')) return 'pago_movil';
  return 'efectivo';
}

// Convierte montos VES a su equivalente USD con la tasa del día.
export function usdEq(monto: number, moneda: string, tasaBcv: number): number {
  if (moneda === 'USD') return toNum(monto);
  return tasaBcv > 0 ? toNum(monto) / tasaBcv : 0;
}

export interface ArqueoRow {
  metodo: string;
  count: number;
  total: number;
  usdEq: number;
}

export interface OrderLike {
  total: number;
  estado: string;
  metodo_pago: string;
  tasa_bcv: number;
}

export interface PaymentLike {
  metodo: string;
  monto: number;
  moneda: string;
  tasa_bcv: number;
}

export interface ExpenseLike {
  monto: number;
  moneda: string;
  tipo: string;
  tasa_bcv: number;
}

// Arqueo por método de pago sobre pedidos + pagos extra.
export function buildArqueo(
  orders: OrderLike[],
  payments: PaymentLike[],
  tasaBcv: number,
): ArqueoRow[] {
  const map = new Map<string, { count: number; total: number; usdEq: number }>();
  const add = (metodoRaw: unknown, monto: number, moneda: string, tasa: number) => {
    const metodo = normalizeMethod(metodoRaw);
    const row = map.get(metodo) || { count: 0, total: 0, usdEq: 0 };
    row.count += 1;
    row.total += toNum(monto);
    row.usdEq += usdEq(monto, moneda, tasa > 0 ? tasa : tasaBcv);
    map.set(metodo, row);
  };
  for (const o of orders) {
    if (o.estado === 'cancelado') continue;
    add(o.metodo_pago, o.total, 'VES', o.tasa_bcv);
  }
  for (const p of payments) {
    add(p.metodo, p.monto, p.moneda, p.tasa_bcv);
  }
  return Array.from(map.entries())
    .map(([metodo, v]) => ({
      metodo,
      count: v.count,
      total: round2(v.total),
      usdEq: round2(v.usdEq),
    }))
    .sort((a, b) => b.usdEq - a.usdEq);
}

export interface Kpis {
  pedidos: number;
  vendido: number;
  cobrado: number;
  gastosOperativos: number;
  retiros: number;
  utilidad: number;
  ticketPromedio: number;
  margenPct: number;
}

// Utilidad = cobrado − gastos operativos. Retiros mueven caja, no utilidad.
export function buildKpis(
  orders: OrderLike[],
  paymentsTotal: number,
  expenses: ExpenseLike[],
  tasaBcv: number,
): Kpis {
  const valid = orders.filter((o) => o.estado !== 'cancelado');
  const vendido = valid.reduce((s, o) => s + toNum(o.total), 0);
  let gastosOperativos = 0;
  let retiros = 0;
  for (const g of expenses) {
    const eq = usdEq(g.monto, g.moneda, tasaBcv);
    if (g.tipo === 'retiro') retiros += eq;
    else gastosOperativos += eq;
  }
  const cobrado = round2(paymentsTotal);
  const utilidad = round2(cobrado - gastosOperativos);
  return {
    pedidos: valid.length,
    vendido: round2(vendido),
    cobrado,
    gastosOperativos: round2(gastosOperativos),
    retiros: round2(retiros),
    utilidad,
    ticketPromedio: valid.length > 0 ? round2(vendido / valid.length) : 0,
    margenPct: cobrado > 0 ? round2((utilidad / cobrado) * 100) : 0,
  };
}

// Saldo vivo de un fiado: total − pagos registrados.
export function fiadoBalance(
  orderTotal: number,
  payments: PaymentLike[],
  tasaBcv: number,
): number {
  const pagado = payments.reduce(
    (s, p) => s + usdEq(p.monto, p.moneda, p.tasa_bcv > 0 ? p.tasa_bcv : tasaBcv),
    0,
  );
  return round2(toNum(orderTotal) - pagado);
}

export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

export function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
