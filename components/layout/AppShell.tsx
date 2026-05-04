'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import Spinner from '@/components/ui/Spinner';

const AUTH_ROUTES = ['/login', '/signup'];

function TopHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, organization } = useAuth();
  const pathname = usePathname();

  // Derive page title from pathname
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

      <div className="flex items-center gap-2">
        {/* Org badge */}
        {organization && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
              {organization.name[0]}
            </div>
            <span className="text-xs font-medium text-slate-600 max-w-28 truncate">{organization.name}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell size={17} />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
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
