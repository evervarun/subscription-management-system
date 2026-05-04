'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Trash2, Eye } from 'lucide-react';
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

export default function SubscriptionsPage() {
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

  useEffect(() => {
    fetchSubscriptions(page, statusFilter, departmentFilter);
  }, [page, statusFilter, departmentFilter, fetchSubscriptions]);

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
        description={`${total} subscription${total !== 1 ? 's' : ''} found`}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Subscription
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by department"
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 bg-white text-gray-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as SubscriptionStatus | ''); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No subscriptions found.</p>
            <Button className="mt-4" size="sm" onClick={() => setShowAddModal(true)}>
              Add your first subscription
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">Tool / Vendor</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Expiry</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Owner</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => {
                  const days = daysUntil(sub.expiryDate);
                  const expiringSoon = sub.status === 'active' && days <= 30 && days > 0;
                  return (
                    <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{sub.toolName}</p>
                        <p className="text-xs text-gray-500">{sub.vendor}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{sub.plan || '—'}</td>
                      <td className="px-4 py-3">
                        <p className={expiringSoon ? 'text-yellow-700 font-medium' : 'text-gray-600'}>
                          {formatDate(sub.expiryDate)}
                        </p>
                        {expiringSoon && <p className="text-xs text-yellow-600">{days} day{days !== 1 ? 's' : ''} left</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{sub.owner.name}</p>
                        <p className="text-xs text-gray-500">{sub.owner.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/subscriptions/${sub._id}`)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(sub)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      <SubscriptionFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => fetchSubscriptions(1)}
      />

      {/* Delete confirm modal */}
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
