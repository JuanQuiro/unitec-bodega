export interface PlanStatus {
  plan: string;
  active: boolean;
  trial: boolean;
  daysLeft: number;
  expired: boolean;
}

// Trial de 14 días desde la creación, salvo suscripción activa.
export function getPlanStatus(
  store: { created_at: string },
  sub: { plan: string; status: string; valid_until: string | null } | null,
  now = new Date(),
): PlanStatus {
  if (sub && sub.status === 'active') {
    if (!sub.valid_until || new Date(sub.valid_until) > now) {
      return { plan: sub.plan, active: true, trial: sub.plan === 'trial', daysLeft: 0, expired: false };
    }
  }
  const trialEnd = new Date(new Date(store.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft > 0) {
    return { plan: 'trial', active: true, trial: true, daysLeft, expired: false };
  }
  return { plan: 'trial', active: false, trial: true, daysLeft: 0, expired: true };
}
