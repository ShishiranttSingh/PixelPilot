'use client';

import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showMock, setShowMock] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const t = setTimeout(() => setShowMock(true), 1500);
      return () => clearTimeout(t);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user || showMock) {
    return <>{children}</>;
  }

  return null;
}
