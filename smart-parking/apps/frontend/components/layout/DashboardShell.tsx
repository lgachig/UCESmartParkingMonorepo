'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';

interface DashboardShellProps {
  children: ReactNode;
  allowedRoles?: Array<'ADMIN' | 'STUDENT' | 'PROFESSOR' | 'GUEST'>;
}

export function DashboardShell({
  children,
  allowedRoles,
}: DashboardShellProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-[#003366]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-h-screen p-6 pt-20 xl:ml-72 xl:pt-6">{children}</main>
    </div>
  );
}
