'use client';

import { 
  User
} from 'lucide-react';
import type { User as UserType } from '@/lib/types';

export function UserMenu({ user }: { user: UserType | null }) {
  return (
    <div className="flex items-center gap-3 pl-4 border-l">
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium leading-none">{user?.username}</span>
        <span className="text-xs text-muted-foreground mt-1">Free Plan</span>
      </div>
      <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden cursor-pointer hover:ring-2 ring-primary/30 transition-all">
        {user?.username?.[0].toUpperCase() || <User className="h-5 w-5" />}
      </div>
    </div>
  );
}