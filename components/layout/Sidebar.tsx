'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CreditCard, Users, LogOut } from 'lucide-react';
import { classNames } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { label: 'Users', href: '/users', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organization, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">SubsManager</h1>
        {organization && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{organization.name}</p>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 capitalize">{user.role}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
