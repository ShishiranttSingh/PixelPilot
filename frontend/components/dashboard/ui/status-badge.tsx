'use client';

type BadgeStatus = 'completed' | 'processing' | 'idle' | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  labels?: Partial<Record<string, string>>;
}

const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
  completed: {
    bg: 'var(--color-success-dim)',
    color: 'var(--color-success)',
    dot: 'var(--color-success)',
  },
  processing: {
    bg: 'var(--color-accent-blue-dim)',
    color: 'var(--color-accent-blue)',
    dot: 'var(--color-accent-blue)',
  },
};

const defaultLabels: Record<string, string> = {
  completed: 'Complete',
  processing: 'Processing...',
  idle: 'Ready',
};

export function StatusBadge({ status, labels }: StatusBadgeProps) {
  const style = statusStyles[status] || { bg: 'var(--color-border-subtle)', color: 'var(--color-text-secondary)', dot: 'var(--color-text-muted)' };
  const label = labels?.[status] || defaultLabels[status] || status;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 8,
        padding: '5px 10px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: style.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}
