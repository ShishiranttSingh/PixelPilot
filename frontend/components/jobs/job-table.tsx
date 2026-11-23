'use client';

import React from 'react';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';
import type { JobListItem } from '@/lib/types';

interface JobTableProps {
  jobs: JobListItem[];
  loading?: boolean;
  onSelect: (job: JobListItem) => void;
  onCancel: (job: JobListItem) => void;
  onRetry: (job: JobListItem) => void;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '—';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function JobTable({ jobs, loading = false, onSelect, onCancel, onRetry }: JobTableProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            {['Image', 'Workflow', 'Status', 'Progress', 'Duration', 'Credits', 'Created', ''].map((h, i) => (
              <th key={h} style={{
                textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em',
                padding: '12px 16px', whiteSpace: 'nowrap',
                display: i >= 3 && i <= 5 ? 'none' : i === 6 ? 'none' : 'table-cell',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onSelect(job)}
              style={{
                borderBottom: '1px solid var(--color-border-subtle)',
                cursor: 'pointer', transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, flexShrink: 0, overflow: 'hidden', borderRadius: 8, background: 'var(--color-bg-elevated)' }}>
                    {job.image.thumbnail_url ? (
                      <img src={job.image.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </div>
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }} title={job.image.filename}>
                    {job.image.filename}
                  </span>
                </div>
              </td>
              <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{job.config_name}</td>
              <td style={{ padding: '10px 16px' }}><JobStatusBadge status={job.status} /></td>
              <td style={{ padding: '10px 16px', display: 'none' }}>
                <ProgressBar status={job.status} progress={job.progress} />
              </td>
              <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', display: 'none' }}>
                {formatDuration(job.duration)}
              </td>
              <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--color-text-secondary)', display: 'none' }}>
                {job.total_credits}
              </td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', display: 'none' }}>
                {formatDate(job.created_at)}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                <GroupHover>
                  {job.status === 'processing' && (
                    <MiniBtn label="Cancel" danger onClick={(e) => { e.stopPropagation(); onCancel(job); }} />
                  )}
                  {job.status === 'failed' && (
                    <MiniBtn label="Retry" accent onClick={(e) => { e.stopPropagation(); onRetry(job); }} />
                  )}
                </GroupHover>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ status, progress }: { status: string; progress?: number }) {
  // Real progress reported by the backend; no value means none is known yet.
  const pct = status === 'completed' ? 100 : status === 'processing' ? Math.max(0, Math.min(progress ?? 0, 99)) : 0;
  const getColor = () => {
    if (status === 'completed') return 'var(--color-success)';
    if (status === 'processing') return 'var(--color-accent)';
    if (status === 'failed') return '#ef4444';
    return 'rgba(255,255,255,0.08)';
  };
  return (
    <div style={{ height: 6, width: 64, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: getColor(), transition: 'width 0.3s ease' }} />
    </div>
  );
}

function GroupHover({ children }: { children: React.ReactNode }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {h ? children : null}
    </div>
  );
}

function MiniBtn({ label, danger, accent, onClick }: { label: string; danger?: boolean; accent?: boolean; onClick: (e: React.MouseEvent) => void }) {
  const [h, setH] = React.useState(false);
  const getStyle = () => {
    if (danger) return { bg: h ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)', color: '#ef4444' };
    if (accent) return { bg: h ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)', color: 'var(--color-accent)' };
    return { bg: 'transparent', color: 'var(--color-text-secondary)' };
  };
  const s = getStyle();
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
        fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
        background: s.bg, color: s.color, transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}
