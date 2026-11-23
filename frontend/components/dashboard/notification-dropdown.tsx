'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationItem } from './notification-item';
import { markNotificationRead } from '@/lib/notifications';
import type { Notification } from '@/types/notification';

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationRead: (id: string) => void;
}

export function NotificationDropdown({
  notifications,
  onClose,
  onNotificationRead,
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleRead = (notification: Notification) => {
    // Optimistic update — mark read immediately, fire API in background
    onNotificationRead(notification.id);
    onClose();

    if (notification.redirect_url) {
      router.push(notification.redirect_url);
    }

    // Background API call — failure is silent, UI already updated
    markNotificationRead(notification.id).catch(() => undefined);
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: 340,
        background: 'var(--color-bg-card, #111318)',
        border: '1px solid var(--color-border-subtle, rgba(255,255,255,0.08))',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border-subtle, rgba(255,255,255,0.06))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          Notifications
        </span>
        {notifications.some(n => !n.is_read) && (
          <span style={{
            fontSize: 11,
            color: 'var(--color-accent-blue, #6366f1)',
            fontFamily: 'var(--font-mono)',
          }}>
            {notifications.filter(n => !n.is_read).length} unread
          </span>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '36px 24px',
            textAlign: 'center',
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
            }}>
              No notifications yet.
            </span>
            <span style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.5,
            }}>
              We'll let you know when<br />something important happens.
            </span>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={() => handleRead(n)} />
          ))
        )}
      </div>
    </div>
  );
}