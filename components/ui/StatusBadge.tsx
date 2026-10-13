import { OrderStatus } from '@/types/bodega';
import { cn } from '@/utils/cn';

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  confirmado: {
    label: 'Confirmado',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  preparando: {
    label: 'Preparando',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  en_camino: {
    label: 'En camino',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  entregado: {
    label: 'Entregado',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
