'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Pencil, Trash2, Clock, Check } from 'lucide-react';
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

const inputCls = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50 text-slate-900 transition-all';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-900 font-medium">{value || <span className="text-slate-300 font-normal">—</span>}</p>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  status_changed: 'Status Changed',
  ownership_changed: 'Ownership Changed',
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  updated: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  deleted: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  status_changed: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  ownership_changed: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
};

function ToolAvatar({ name }: { name: string }) {
  const colors = ['bg-indigo-100 text-indigo-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-violet-100 text-violet-700','bg-cyan-100 text-cyan-700'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-12 h-12 rounded-xl ${colors[idx]} flex items-center justify-center text-sm font-bold shrink-0`}>
      {name.slice(0,2).toUpperCase()}
    </div>
  );
}

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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema) as Resolver<SubscriptionFormData>,
    defaultValues: { status: 'active', departments: [], teams: [], renewalReminderDays: [30, 7, 1] },
  });

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

  useEffect(() => { fetchData(); }, [fetchData]);

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
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  if (!subscription) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">{serverError || 'Subscription not found'}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push('/subscriptions')}>Back to list</Button>
      </div>
    );
  }

  const days = daysUntil(subscription.expiryDate);
  const expiringSoon = subscription.status === 'active' && days <= 30 && days > 0;

  return (
    <div className="max-w-3xl">
      {/* Back nav */}
      <button
        onClick={() => router.push('/subscriptions')}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-5 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Subscriptions
      </button>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{serverError}</div>
      )}

      {!isEditing ? (
        <>
          {/* Header card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <ToolAvatar name={subscription.toolName} />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{subscription.toolName}</h1>
                  <p className="text-sm text-slate-400 mt-0.5">{subscription.vendor}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={subscription.status} />
                    {expiringSoon && (
                      <span className="text-xs bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 rounded-full font-semibold">
                        {days}d left
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={startEditing}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 size={13} /> Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 text-sm">
              <Detail label="Plan" value={subscription.plan} />
              <Detail label="Payment Cycle" value={subscription.paymentCycle ? PAYMENT_CYCLE_LABELS[subscription.paymentCycle] : undefined} />
              <Detail label="Licenses" value={subscription.licenses?.toString()} />
              <Detail label="Start Date" value={formatDate(subscription.startDate)} />
              <Detail label="Expiry Date" value={formatDate(subscription.expiryDate)} />
              <Detail label="Owner" value={subscription.owner.name} />
              <Detail label="Owner Email" value={subscription.owner.email} />
            </div>

            {subscription.departments.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Departments</p>
                <div className="flex flex-wrap gap-2">
                  {subscription.departments.map(d => (
                    <span key={d} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium ring-1 ring-indigo-100">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {subscription.teams.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Teams</p>
                <div className="flex flex-wrap gap-2">
                  {subscription.teams.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs rounded-full font-medium ring-1 ring-violet-100">{t}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Renewal Reminders</p>
              <div className="flex flex-wrap gap-2">
                {subscription.renewalReminderDays.map(d => (
                  <span key={d} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-full font-medium ring-1 ring-slate-200">{d} days before</span>
                ))}
              </div>
            </div>
          </div>

          {/* Audit log card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                <Clock size={14} className="text-slate-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Audit Trail</h2>
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-400">No audit entries yet.</p>
            ) : (
              <ol className="relative pl-5 border-l border-slate-100 space-y-5">
                {auditLogs.map((log, i) => (
                  <li key={log._id} className="relative">
                    <span className="absolute -left-[1.3125rem] w-2.5 h-2.5 rounded-full bg-slate-200 ring-2 ring-white mt-1" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      by <span className="font-semibold text-slate-800">{log.changedBy.name}</span>
                      <span className="text-slate-400"> · {log.changedBy.email}</span>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      ) : (
        /* Edit form */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Edit Subscription</h2>
            <button onClick={() => setIsEditing(false)} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">Cancel</button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tool Name <span className="text-red-500">*</span></label>
                <input {...register('toolName')} className={inputCls} />
                <FieldError message={errors.toolName?.message} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vendor <span className="text-red-500">*</span></label>
                <input {...register('vendor')} className={inputCls} />
                <FieldError message={errors.vendor?.message} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Plan</label>
                <input {...register('plan')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Licenses</label>
                <input type="number" min={0} {...register('licenses', { valueAsNumber: true })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                <input type="date" {...register('startDate')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expiry Date <span className="text-red-500">*</span></label>
                <input type="date" {...register('expiryDate')} className={inputCls} />
                <FieldError message={errors.expiryDate?.message} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Cycle</label>
                <select {...register('paymentCycle')} className={inputCls}>
                  <option value="">Select cycle</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Owner Name <span className="text-red-500">*</span></label>
                <input {...register('owner.name')} className={inputCls} />
                <FieldError message={errors.owner?.name?.message} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Owner Email <span className="text-red-500">*</span></label>
                <input {...register('owner.email')} className={inputCls} />
                <FieldError message={errors.owner?.email?.message} />
              </div>
            </div>
            {serverError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{serverError}</div>}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>
                <Check size={14} /> Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

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
