'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CreditCard, Users, LogOut, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SidebarProps {
  onClose?: () => void;
}

const MANAGEMENT_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { label: 'Users', href: '/users', icon: Users },
];

function NavLink({ href, icon: Icon, label, onClick }: { href: string; icon: React.ElementType; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon size={17} className={active ? 'text-white' : 'text-slate-400'} />
      {label}
    </Link>
  );
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const { user, organization, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="flex flex-col w-64 h-full bg-white border-r border-slate-100">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">SubManage</p>
            <p className="text-xs text-slate-400 mt-0.5">Subscription Mgmt</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Management</p>
        {MANAGEMENT_NAV.map(({ label, href, icon }) => (
          <NavLink key={href} href={href} icon={icon} label={label} onClick={onClose} />
        ))}
      </div>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 group transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{organization?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
