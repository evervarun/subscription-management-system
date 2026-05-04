'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import Spinner from '@/components/ui/Spinner';

const AUTH_ROUTES = ['/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isAuthRoute) {
      router.replace('/login');
    }
    if (!isLoading && user && isAuthRoute) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, isAuthRoute, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
