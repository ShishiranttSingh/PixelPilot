'use client';

import React from 'react';
import type { WorkflowStatus } from '@/lib/types';

const statusConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:    { label: 'Queued',     bg: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)', border: 'rgba(245,158,11,0.2)' },
  processing: { label: 'Running',    bg: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: 'var(--color-accent-dim)' },
  completed:  { label: 'Completed',  bg: 'var(--color-success-dim)', color: 'var(--color-success)', border: 'var(--color-success-dim)' },
  failed:     { label: 'Failed',     bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  cancelled:  { label: 'Cancelled',  bg: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)', border: 'var(--color-border-subtle)' },
};

interface JobStatusBadgeProps {
  status: WorkflowStatus | string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, bg: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)', border: 'var(--color-border-subtle)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 6,
      border: '1px solid', borderColor: cfg.border,
      padding: '2px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}
