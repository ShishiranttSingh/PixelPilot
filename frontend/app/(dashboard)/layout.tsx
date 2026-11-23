'use client';

import { DashboardTopNav } from '@/components/dashboard/dashboard-top-nav';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  // Still checking authentication.
  if (loading) {
    return (
      <div
        className="dashboard-theme h-screen w-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-base)' }}
      >
        <Loader2
          className="h-10 w-10 animate-spin"
          style={{ color: 'var(--color-accent-blue)' }}
        />
      </div>
    );
  }

  // Prevent rendering the dashboard while redirecting.
  if (!user) {
    return null;
  }

  return (
    <div
      className="dashboard-theme"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-base)',
      }}
    >
      <DashboardTopNav />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}