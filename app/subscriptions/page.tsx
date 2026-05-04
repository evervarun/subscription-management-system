'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Trash2, Eye, Filter } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import SubscriptionFormModal from '@/components/ui/SubscriptionFormModal';
import { subscriptionService } from '@/services/subscription.service';
import { Subscription, SubscriptionStatus } from '@/types/subscription';
import { formatDate, daysUntil } from '@/lib/utils';

const PAGE_SIZE = 10;
const STATUS_OPTIONS: { value: SubscriptionStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'paused', label: 'Paused' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'pending', label: 'Pending' },
];

function ToolAvatar({ name }: { name: string }) {
  const colors = ['bg-indigo-100 text-indigo-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-violet-100 text-violet-700','bg-cyan-100 text-cyan-700'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-8 h-8 rounded-lg ${colors[idx]} flex items-center justify-center text-xs font-bold shrink-0`}>
      {name.slice(0,2).toUpperCase()}
    </div>
  );
}

function SubscriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>((searchParams.get('status') as SubscriptionStatus | '') ?? '');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSubscriptions = useCallback(async (p = 1, status = statusFilter, dept = departmentFilter) => {
    try {
      setLoading(true);
      setError('');
      const result = await subscriptionService.getAll({ status: status || undefined, department: dept || undefined, page: p, limit: PAGE_SIZE });
      setSubscriptions(result.data);
      setTotal(result.total);
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, departmentFilter]);

  useEffect(() => { fetchSubscriptions(page, statusFilter, departmentFilter); }, [page, statusFilter, departmentFilter, fetchSubscriptions]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await subscriptionService.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchSubscriptions(page);
    } catch {
      setError('Failed to delete subscription');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description={`${total} subscription${total !== 1 ? 's' : ''} total`}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={15} />
            Add Subscription
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by department..."
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as SubscriptionStatus | ''); setPage(1); }}
              className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50 text-slate-900 appearance-none cursor-pointer transition-all"
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No subscriptions found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or add a new subscription</p>
            <Button className="mt-4" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} />
              Add your first subscription
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tool</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Expiry</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subscriptions.map(sub => {
                    const days = daysUntil(sub.expiryDate);
                    const expiringSoon = sub.status === 'active' && days <= 30 && days > 0;
                    return (
                      <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors group cursor-pointer" onClick={() => router.push(`/subscriptions/${sub._id}`)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <ToolAvatar name={sub.toolName} />
                            <div>
                              <p className="font-semibold text-slate-900">{sub.toolName}</p>
                              <p className="text-xs text-slate-400">{sub.vendor}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={sub.status} /></td>
                        <td className="px-5 py-3.5 text-slate-600">{sub.plan || <span className="text-slate-300">—</span>}</td>
                        <td className="px-5 py-3.5">
                          <p className={`font-medium ${expiringSoon ? 'text-amber-600' : 'text-slate-700'}`}>{formatDate(sub.expiryDate)}</p>
                          {expiringSoon && <p className="text-xs text-amber-500 font-medium">{days}d left</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-800 font-medium">{sub.owner.name}</p>
                          <p className="text-xs text-slate-400">{sub.owner.email}</p>
                        </td>
                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => router.push(`/subscriptions/${sub._id}`)}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(sub)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {subscriptions.map(sub => {
                const days = daysUntil(sub.expiryDate);
                const expiringSoon = sub.status === 'active' && days <= 30 && days > 0;
                return (
                  <div key={sub._id} className="p-4 hover:bg-slate-50 transition-colors" onClick={() => router.push(`/subscriptions/${sub._id}`)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ToolAvatar name={sub.toolName} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{sub.toolName}</p>
                          <p className="text-xs text-slate-400">{sub.vendor}</p>
                        </div>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Expiry</p>
                        <p className={`font-medium mt-0.5 ${expiringSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                          {formatDate(sub.expiryDate)}
                          {expiringSoon && ` · ${days}d`}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Owner</p>
                        <p className="font-medium text-slate-700 mt-0.5 truncate">{sub.owner.name}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDeleteTarget(sub)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
            <span className="text-slate-400"> · {total} total</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <SubscriptionFormModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => fetchSubscriptions(1)} />

      <Modal
        open={!!deleteTarget}
        title="Delete Subscription"
        description={`Are you sure you want to delete "${deleteTarget?.toolName}" by ${deleteTarget?.vendor}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <SubscriptionsContent />
    </Suspense>
  );
}
