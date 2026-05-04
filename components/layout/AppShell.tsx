'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Bell, X, Plus, RefreshCw, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import Spinner from '@/components/ui/Spinner';
import { auditService, NotificationLog } from '@/services/audit.service';

const AUTH_ROUTES = ['/login', '/signup'];

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { label: 'Subscription added', icon: <Plus size={13} />, color: 'bg-emerald-100 text-emerald-700' },
  updated: { label: 'Subscription updated', icon: <Pencil size={13} />, color: 'bg-indigo-100 text-indigo-700' },
  deleted: { label: 'Subscription removed', icon: <Trash2 size={13} />, color: 'bg-red-100 text-red-700' },
  status_changed: { label: 'Status changed', icon: <RefreshCw size={13} />, color: 'bg-amber-100 text-amber-700' },
  ownership_changed: { label: 'Ownership transferred', icon: <ArrowLeftRight size={13} />, color: 'bg-violet-100 text-violet-700' },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await auditService.getRecent());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-400 mt-0.5">Recent activity in your org</p>
          </div>
          <div className="flex items-center gap-1">
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="md" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Bell size={18} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No activity yet</p>
              <p className="text-xs text-slate-400 mt-1">Actions will appear here</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {logs.map((log) => {
                const meta = ACTION_META[log.action] ?? ACTION_META.updated;
                return (
                  <li key={log._id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
                        {log.subscription && (
                          <p className="text-xs text-slate-600 mt-0.5 truncate">
                            <span className="font-medium">{log.subscription.toolName}</span>
                            <span className="text-slate-400"> · {log.subscription.vendor}</span>
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          by <span className="font-medium text-slate-500">{log.changedBy.name}</span>
                          <span className="mx-1">·</span>
                          {timeAgo(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function TopHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);

  const pageTitle = (() => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/subscriptions') && pathname !== '/subscriptions') return 'Subscription Detail';
    if (pathname.startsWith('/subscriptions')) return 'Subscriptions';
    if (pathname.startsWith('/users')) return 'Users';
    return 'Dashboard';
  })();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-base font-semibold text-slate-900">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Bell size={17} />
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isAuthRoute) router.replace('/login');
    if (!isLoading && user && isAuthRoute) router.replace('/dashboard');
  }, [isLoading, user, isAuthRoute, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthRoute) return <>{children}</>;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 md:relative md:z-auto
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
