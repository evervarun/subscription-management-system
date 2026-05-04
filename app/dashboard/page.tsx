'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { subscriptionService } from '@/services/subscription.service';
import { Subscription, SubscriptionStatus } from '@/types/subscription';
import { formatDate, daysUntil } from '@/lib/utils';

interface Stats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  pending: number;
  expiringSoon: Subscription[];
}

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: '#16a34a',
  expired: '#dc2626',
  cancelled: '#6b7280',
  pending: '#d97706',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all subscriptions (up to 500 for dashboard stats)
      const result = await subscriptionService.getAll({ limit: 500 });
      const all = result.data;

      const today = Date.now();
      const thirtyDays = 30 * 86400000;

      const expiringSoon = all.filter(
        (s) =>
          s.status === 'active' &&
          new Date(s.expiryDate).getTime() - today <= thirtyDays &&
          new Date(s.expiryDate).getTime() > today
      );

      setStats({
        total: result.total,
        active: all.filter((s) => s.status === 'active').length,
        expired: all.filter((s) => s.status === 'expired').length,
        cancelled: all.filter((s) => s.status === 'cancelled').length,
        pending: all.filter((s) => s.status === 'pending').length,
        expiringSoon,
      });
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-16 text-red-600">
        <p>{error || 'No data available'}</p>
        <Button className="mt-4" onClick={fetchStats}>Retry</Button>
      </div>
    );
  }

  const pieData = [
    { name: 'Active', value: stats.active, status: 'active' as SubscriptionStatus },
    { name: 'Expired', value: stats.expired, status: 'expired' as SubscriptionStatus },
    { name: 'Cancelled', value: stats.cancelled, status: 'cancelled' as SubscriptionStatus },
    { name: 'Pending', value: stats.pending, status: 'pending' as SubscriptionStatus },
  ].filter((d) => d.value > 0);

  const statCards = [
    { label: 'Total Subscriptions', value: stats.total, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Expired', value: stats.expired, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Expiring in 30 Days', value: stats.expiringSoon.length, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your enterprise subscriptions"
        action={
          <Link href="/subscriptions/new">
            <Button>
              <Plus size={16} />
              Add Subscription
            </Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`${bg} rounded-lg p-2.5`}>
              <Icon className={`${color} h-5 w-5`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Subscriptions by Status</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [val, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expiring soon */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-yellow-600" />
            <h3 className="text-base font-semibold text-gray-900">Expiring Soon (30 days)</h3>
          </div>
          {stats.expiringSoon.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No subscriptions expiring soon</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.expiringSoon.map((sub) => {
                const days = daysUntil(sub.expiryDate);
                return (
                  <li key={sub._id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/subscriptions/${sub._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {sub.toolName}
                      </Link>
                      <p className="text-xs text-gray-500">{sub.vendor}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${days <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {days} day{days !== 1 ? 's' : ''} left
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(sub.expiryDate)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Pending subscriptions */}
      {stats.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            You have <strong>{stats.pending}</strong> subscription{stats.pending > 1 ? 's' : ''} in pending state.{' '}
            <Link href="/subscriptions?status=pending" className="underline font-medium">View them</Link>
          </p>
        </div>
      )}
    </div>
  );
}
