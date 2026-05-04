'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, CheckCircle2, XCircle, Clock, Plus, AlertCircle, DollarSign } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { subscriptionService } from '@/services/subscription.service';
import { Subscription, SubscriptionStatus } from '@/types/subscription';
import { formatDate, daysUntil } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface Stats {
  total: number;
  active: number;
  expired: number;
  expiringSoon: Subscription[];
  pending: number;
  totalAnnualSpend: number;
  allSubs: Subscription[];
}

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: '#6366f1',
  expired: '#f43f5e',
  cancelled: '#94a3b8',
  pending: '#f59e0b',
  trial: '#3b82f6',
  paused: '#f97316',
};

function StatCard({ label, value, icon: Icon, color, bg, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`${bg} rounded-xl p-2.5 shrink-0`}>
        <Icon className={`${color} h-5 w-5`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ToolAvatar({ name }: { name: string }) {
  const colors = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-700'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-8 h-8 rounded-lg ${colors[idx]} flex items-center justify-center text-xs font-bold shrink-0`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function DashboardPage() {
  const { organization } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await subscriptionService.getAll({ limit: 500 });
      const all = result.data;
      const today = Date.now();
      const thirtyDays = 30 * 86400000;
      const expiringSoon = all.filter(s =>
        s.status === 'active' &&
        new Date(s.expiryDate).getTime() - today <= thirtyDays &&
        new Date(s.expiryDate).getTime() > today
      );
      // Compute annual spend
      const totalAnnualSpend = all
        .filter(s => s.status !== 'cancelled' && s.status !== 'expired')
        .reduce((sum, s) => {
          if (!s.cost) return sum;
          const annual = s.paymentCycle === 'monthly' ? s.cost * 12
            : s.paymentCycle === 'quarterly' ? s.cost * 4
              : s.cost;
          return sum + annual;
        }, 0);

      setStats({
        total: result.total,
        active: all.filter(s => s.status === 'active').length,
        expired: all.filter(s => s.status === 'expired').length,
        pending: all.filter(s => s.status === 'pending').length,
        expiringSoon,
        totalAnnualSpend,
        allSubs: all,
      });
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (error || !stats) return (
    <div className="text-center py-16"><p className="text-red-500">{error}</p><Button className="mt-4" onClick={fetchStats}>Retry</Button></div>
  );

  const pieData = [
    { name: 'Active', value: stats.active, status: 'active' as SubscriptionStatus },
    { name: 'Expired', value: stats.expired, status: 'expired' as SubscriptionStatus },
    { name: 'Pending', value: stats.pending, status: 'pending' as SubscriptionStatus },
    { name: 'Expiring Soon', value: stats.expiringSoon.length, status: 'trial' as SubscriptionStatus },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Total Subscriptions', value: stats.total, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'All subscriptions' },
    { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Currently active' },
    { label: 'Expiring Soon', value: stats.expiringSoon.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Within 30 days' },
    { label: 'Expired', value: stats.expired, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Require attention' },
    {
      label: 'Total Spend (Annual)',
      value: stats.totalAnnualSpend > 0 ? `$${stats.totalAnnualSpend.toLocaleString()}` : '—',
      icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50', sub: 'Across all subscriptions'
    },
  ];

  return (
    <div>
      {/* Org banner */}
      {organization && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Left: identity */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-indigo-200">
                {organization.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Organization</p>
                <p className="text-lg font-bold text-slate-900 truncate leading-tight">{organization.name}</p>
              </div>
            </div>

            {/* Right: stats + action */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Plan pill */}
              <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 min-w-[72px]">
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">Plan</p>
                <p className="text-sm font-bold text-indigo-700 capitalize mt-0.5">{organization.planType}</p>
              </div>

              {/* Subscriptions pill */}
              <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 min-w-[72px]">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Subs</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{stats.total}</p>
              </div>

              <Link href="/subscriptions/new">
                <Button size="sm">
                  <Plus size={14} />
                  Add Subscription
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <PageHeader title="Dashboard" description="Overview of your enterprise subscriptions" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Charts + renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Donut chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Subscriptions Status</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution across all statuses</p>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}
                  formatter={(val) => [val, 'Count']}
                />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming renewals */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Renewals</h3>
              <p className="text-xs text-slate-400">Expiring within 30 days</p>
            </div>
            <Link href="/subscriptions" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>
          {stats.expiringSoon.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
              <p className="text-sm">No subscriptions expiring soon</p>
            </div>
          ) : (
            <ul className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
              {stats.expiringSoon.map(sub => {
                const days = daysUntil(sub.expiryDate);
                const urgency = days <= 7 ? 'bg-rose-100 text-rose-700' : days <= 14 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
                return (
                  <li key={sub._id} className="flex items-center gap-3">
                    <ToolAvatar name={sub.toolName} />
                    <div className="flex-1 min-w-0">
                      <Link href={`/subscriptions/${sub._id}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600 truncate block">
                        {sub.toolName}
                      </Link>
                      <p className="text-xs text-slate-400">{formatDate(sub.expiryDate)}</p>
                    </div>
                    {sub.cost && <p className="text-xs font-semibold text-slate-700 hidden sm:block">${sub.cost.toLocaleString()}</p>}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${urgency}`}>
                      {days}d left
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Status summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Status Breakdown</h3>
          <Link href="/subscriptions" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View all</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {([
            { status: 'active' as SubscriptionStatus, bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-700', bar: 'bg-emerald-400' },
            { status: 'trial' as SubscriptionStatus, bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-500', text: 'text-indigo-700', bar: 'bg-indigo-400' },
            { status: 'paused' as SubscriptionStatus, bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500', text: 'text-orange-700', bar: 'bg-orange-400' },
            { status: 'pending' as SubscriptionStatus, bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500', text: 'text-amber-700', bar: 'bg-amber-400' },
            { status: 'expired' as SubscriptionStatus, bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500', text: 'text-red-700', bar: 'bg-red-400' },
            { status: 'cancelled' as SubscriptionStatus, bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', text: 'text-slate-600', bar: 'bg-slate-300' },
          ]).map(({ status, bg, border, dot, text, bar }) => {
            const count = stats.allSubs.filter(s => s.status === status).length;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <Link
                key={status}
                href={`/subscriptions?status=${status}`}
                className={`flex flex-col gap-2 p-3 rounded-xl border ${bg} ${border} hover:shadow-sm transition-all group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className={`text-xs font-semibold capitalize ${text}`}>{status}</span>
                  </div>
                  <span className={`text-base font-bold ${text}`}>{count}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 w-full bg-white/70 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">{pct}% of total</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pending alert */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            You have <strong>{stats.pending}</strong> subscription{stats.pending > 1 ? 's' : ''} in pending state.{' '}
            <Link href="/subscriptions?status=pending" className="underline font-semibold">View them</Link>
          </p>
        </div>
      )}
    </div>
  );
}
