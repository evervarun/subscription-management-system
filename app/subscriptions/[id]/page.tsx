'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Pencil, Trash2, Clock } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { subscriptionService } from '@/services/subscription.service';
import { auditService } from '@/services/audit.service';
import { Subscription } from '@/types/subscription';
import { AuditLog } from '@/types/audit';
import { formatDate, daysUntil, PAYMENT_CYCLE_LABELS } from '@/lib/utils';
import { subscriptionSchema, SubscriptionFormData } from '@/lib/validations';

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  status_changed: 'Status Changed',
  ownership_changed: 'Ownership Changed',
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  status_changed: 'bg-yellow-100 text-yellow-700',
  ownership_changed: 'bg-purple-100 text-purple-700',
};

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({ resolver: zodResolver(subscriptionSchema) });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, auditRes] = await Promise.all([
        subscriptionService.getById(id),
        auditService.getBySubscriptionId(id),
      ]);
      setSubscription(subRes.data);
      setAuditLogs(auditRes.data);
    } catch {
      setServerError('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditing = () => {
    if (!subscription) return;
    reset({
      toolName: subscription.toolName,
      vendor: subscription.vendor,
      plan: subscription.plan ?? '',
      startDate: subscription.startDate ? subscription.startDate.slice(0, 10) : '',
      expiryDate: subscription.expiryDate.slice(0, 10),
      paymentCycle: subscription.paymentCycle,
      status: subscription.status,
      licenses: subscription.licenses,
      departments: subscription.departments,
      teams: subscription.teams,
      owner: { name: subscription.owner.name, email: subscription.owner.email },
      renewalReminderDays: subscription.renewalReminderDays,
    });
    setIsEditing(true);
  };

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      setServerError('');
      await subscriptionService.update(id, data);
      setIsEditing(false);
      fetchData();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await subscriptionService.remove(id);
      router.push('/subscriptions');
    } catch {
      setServerError('Failed to delete subscription');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>{serverError || 'Subscription not found'}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push('/subscriptions')}>
          Back to list
        </Button>
      </div>
    );
  }

  const days = daysUntil(subscription.expiryDate);

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <button onClick={() => router.push('/subscriptions')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={15} />
          Back to Subscriptions
        </button>
      </div>

      <PageHeader
        title={subscription.toolName}
        description={subscription.vendor}
        action={
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button variant="secondary" size="sm" onClick={startEditing}>
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 size={14} />
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {serverError}
        </div>
      )}

      {!isEditing ? (
        /* Detail view */
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <StatusBadge status={subscription.status} />
            {subscription.status === 'active' && days <= 30 && days > 0 && (
              <span className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                Expires in {days} day{days !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <Detail label="Plan" value={subscription.plan} />
            <Detail label="Payment Cycle" value={subscription.paymentCycle ? PAYMENT_CYCLE_LABELS[subscription.paymentCycle] : undefined} />
            <Detail label="Licenses" value={subscription.licenses?.toString()} />
            <Detail label="Start Date" value={formatDate(subscription.startDate)} />
            <Detail label="Expiry Date" value={formatDate(subscription.expiryDate)} />
            <Detail label="Owner" value={`${subscription.owner.name} (${subscription.owner.email})`} />
          </div>

          {subscription.departments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Departments</p>
              <div className="flex flex-wrap gap-2">
                {subscription.departments.map((d) => (
                  <span key={d} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{d}</span>
                ))}
              </div>
            </div>
          )}

          {subscription.teams.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Teams</p>
              <div className="flex flex-wrap gap-2">
                {subscription.teams.map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Renewal Reminders</p>
            <div className="flex flex-wrap gap-2">
              {subscription.renewalReminderDays.map((d) => (
                <span key={d} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{d} days before</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Edit form */
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name <span className="text-red-500">*</span></label>
              <input {...register('toolName')} className={inputCls} />
              <FieldError message={errors.toolName?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor <span className="text-red-500">*</span></label>
              <input {...register('vendor')} className={inputCls} />
              <FieldError message={errors.vendor?.message} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <input {...register('plan')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Licenses</label>
              <input type="number" min={0} {...register('licenses', { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" {...register('startDate')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
              <input type="date" {...register('expiryDate')} className={inputCls} />
              <FieldError message={errors.expiryDate?.message} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Cycle</label>
              <select {...register('paymentCycle')} className={inputCls}>
                <option value="">Select cycle</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className={inputCls}>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="pending">Pending</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name <span className="text-red-500">*</span></label>
              <input {...register('owner.name')} className={inputCls} />
              <FieldError message={errors.owner?.name?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email <span className="text-red-500">*</span></label>
              <input {...register('owner.email')} className={inputCls} />
              <FieldError message={errors.owner?.email?.message} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      )}

      {/* Audit Log */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900">Audit Log</h3>
        </div>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No audit entries yet.</p>
        ) : (
          <ul className="space-y-3">
            {auditLogs.map((log) => (
              <li key={log._id} className="flex items-start gap-3">
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">
                    by <span className="font-medium">{log.changedBy.name}</span>{' '}
                    <span className="text-gray-500">({log.changedBy.email})</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={showDeleteModal}
        title="Delete Subscription"
        description={`Are you sure you want to delete "${subscription.toolName}" by ${subscription.vendor}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-gray-900">{value || '—'}</p>
    </div>
  );
}
