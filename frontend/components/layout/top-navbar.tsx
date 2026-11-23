'use client';

import { Bell } from 'lucide-react';
import { UserMenu } from './user-menu';
import { useAuth } from '@/context/auth-context';

export function TopNavbar({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="container flex h-full items-center justify-between px-8">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>

        <div className="flex items-center gap-6">
          <button className="relative p-2 text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </button>

          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}