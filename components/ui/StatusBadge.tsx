import { SubscriptionStatus } from '@/types/subscription';
import { classNames } from '@/lib/utils';

interface StatusBadgeProps {
  status: SubscriptionStatus;
}

const config: Record<SubscriptionStatus, { label: string; dot: string; classes: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  expired: { label: 'Expired', dot: 'bg-red-500', classes: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  cancelled: { label: 'Cancelled', dot: 'bg-slate-400', classes: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200' },
  pending: { label: 'Pending', dot: 'bg-amber-500', classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  trial: { label: 'Trial', dot: 'bg-indigo-500', classes: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  paused: { label: 'Paused', dot: 'bg-orange-500', classes: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, dot, classes } = config[status] ?? config.pending;
  return (
    <span className={classNames('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', classes)}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
