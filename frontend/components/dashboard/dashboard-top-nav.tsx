'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  IconPixelPilot,
  IconBell,
} from '@/components/dashboard/ui/dashboard-icons';
import { NotificationDropdown } from '@/components/dashboard/notification-dropdown';
import { fetchNotifications, fetchUnreadCount } from '@/lib/notifications';
import type { Notification } from '@/types/notification';

const NAV_ITEMS = ['Dashboard', 'Images', 'Workflows', 'Jobs', 'Settings'];

const NAV_HREF_MAP: Record<string, string> = {
  Dashboard: '/dashboard',
  Images: '/images',
  Workflows: '/workflows',
  Jobs: '/jobs',
  Settings: '/settings',
};

const IconLogOut = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function UserMenu({ initials, onLogout }: { initials: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open user menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--color-accent-gradient, linear-gradient(135deg, #3b82f6, #8b5cf6))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-display)',
          color: 'white', flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          <IconChevronDown />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 180,
          background: 'var(--color-bg-card, #111318)',
          border: '1px solid var(--color-border-subtle, rgba(255,255,255,0.08))',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle, rgba(255,255,255,0.06))' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Signed in as</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>{initials}</div>
          </div>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13.5, color: '#f87171', fontFamily: 'var(--font-body)', textAlign: 'left',
              transition: 'background 0.12s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <IconLogOut /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

const POLL_INTERVAL = 30000;

export function DashboardTopNav() {
  const [active, setActive] = useState('Dashboard');
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/images')) setActive('Images');
    else if (pathname.startsWith('/workflows')) setActive('Workflows');
    else if (pathname.startsWith('/jobs')) setActive('Jobs');
    else if (pathname.startsWith('/settings')) setActive('Settings');
    else setActive('Dashboard');
  }, [pathname]);

  const loadUnreadCount = useCallback(async () => {
    // Only poll when tab is visible — #8
    if (document.visibilityState !== 'visible') return;
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    // Poll on interval
    const timer = setInterval(loadUnreadCount, POLL_INTERVAL);

    // Also re-fetch when tab becomes visible again — #8
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadUnreadCount();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadUnreadCount]);

  const handleBellClick = async () => {
    if (notifOpen) { setNotifOpen(false); return; }
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
    setNotifOpen(true);
  };

  // Optimistic read update — #10
  const handleNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNavClick = (item: string) => {
    setActive(item);
    const href = NAV_HREF_MAP[item];
    if (href) router.push(href);
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

  return (
    <nav style={{
      height: 64, display: 'flex', alignItems: 'center', padding: '0 24px',
      borderBottom: '1px solid var(--color-border-subtle)',
      background: 'rgba(9,10,13,0.85)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 100, gap: 32,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
        <div style={{ filter: 'var(--color-accent-drop-shadow-filter)' }}>
          <IconPixelPilot />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
          PixelPilot
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item}
            href={NAV_HREF_MAP[item]}
            onClick={e => { e.preventDefault(); handleNavClick(item); }}
            style={{
              border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 8,
              fontFamily: 'var(--font-body)', fontSize: 14,
              fontWeight: active === item ? 500 : 400,
              color: active === item ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: active === item ? 'rgba(255,255,255,0.06)' : 'transparent',
              transition: 'all 0.15s ease', textDecoration: 'none', lineHeight: 1,
            }}
            onMouseEnter={e => { if (item !== active) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { if (item !== active) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'; }}
          >
            {item}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleBellClick}
            aria-label="Notifications"
            style={{
              position: 'relative', width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: notifOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: '1px solid transparent', borderRadius: 8,
              color: notifOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = notifOpen ? 'rgba(255,255,255,0.06)' : 'transparent'; el.style.color = notifOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'; }}
          >
            <IconBell />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 5, right: 5, width: 6, height: 6,
                borderRadius: '50%', background: 'var(--color-accent-blue, #6366f1)',
                border: '1.5px solid var(--color-bg-base)',
              }} />
            )}
          </button>

          {notifOpen && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setNotifOpen(false)}
              onNotificationRead={handleNotificationRead}
            />
          )}
        </div>

        <UserMenu initials={initials} onLogout={logout} />
      </div>
    </nav>
  );
}