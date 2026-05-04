import { SubscriptionStatus } from '@/types/subscription';
import { classNames } from '@/lib/utils';

interface StatusBadgeProps {
  status: SubscriptionStatus;
}

const config: Record<SubscriptionStatus, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-green-100 text-green-800' },
  expired: { label: 'Expired', classes: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800' },
  trial: { label: 'Trial', classes: 'bg-blue-100 text-blue-800' },
  paused: { label: 'Paused', classes: 'bg-orange-100 text-orange-800' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes } = config[status] ?? config.pending;
  return (
    <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', classes)}>
      {label}
    </span>
  );
}
