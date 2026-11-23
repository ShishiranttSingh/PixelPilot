'use client';

export interface ActivityItemData {
  file: string;
  action: string;
  time: string;
}

interface ActivityCardProps {
  items: ActivityItemData[];
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityEntry({ file, action, time, isLast }: ActivityItemData & { isLast: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      paddingBottom: isLast ? 0 : 14,
      position: 'relative',
    }}>
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: 6,
          top: 16,
          bottom: 0,
          width: 1,
          background: 'var(--color-border-subtle)',
        }} />
      )}

      <div style={{
        width: 13,
        height: 13,
        borderRadius: '50%',
        background: 'var(--color-success-dim)',
        border: '1.5px solid var(--color-success)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
        zIndex: 1,
      }}>
        <IconCheck />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-primary)',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 2,
        }}>
          {file}
        </div>
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'var(--color-success)', fontFamily: 'var(--font-body)' }}>
            {action}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ActivityCard({ items }: ActivityCardProps) {
  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 18,
      flex: 1,
      boxShadow: 'var(--color-accent-glow)',
      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }}
    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)' }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)' }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: 16,
      }}>Recent Activity</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, index) => (
          <ActivityEntry key={index} {...item} isLast={index === items.length - 1} />
        ))}
      </div>
    </div>
  );
}