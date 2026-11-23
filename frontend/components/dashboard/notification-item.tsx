'use client';

import type { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void; // parent owns navigation + API call
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const { title, message, is_read, created_at } = notification;

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  return (
    <button
      onClick={onRead}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        padding: '10px 16px',
        background: is_read ? 'transparent' : 'rgba(99,102,241,0.06)',
        border: 'none',
        borderBottom: '1px solid var(--color-border-subtle, rgba(255,255,255,0.06))',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = is_read
          ? 'transparent'
          : 'rgba(99,102,241,0.06)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
        {!is_read && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-accent-blue, #6366f1)',
            flexShrink: 0,
          }} />
        )}
        <span style={{
          fontSize: 13,
          fontWeight: is_read ? 400 : 600,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
      </div>
      <span style={{
        fontSize: 12,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-body)',
        paddingLeft: is_read ? 0 : 12,
        lineHeight: 1.4,
      }}>
        {message}
      </span>
      <span style={{
        fontSize: 11,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
        paddingLeft: is_read ? 0 : 12,
        marginTop: 2,
      }}>
        {relativeTime(created_at)}
      </span>
    </button>
  );
}