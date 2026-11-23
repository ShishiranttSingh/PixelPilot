'use client';

import React, { useState, useEffect } from 'react';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { JobTimeline } from '@/components/jobs/job-timeline';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, RotateCcw, XCircle, ImageIcon, BarChart3, Clock, DollarSign, Zap } from 'lucide-react';
import { getJob } from '@/lib/job-service';
import type { JobListItem, WorkflowDetail } from '@/lib/types';

interface JobDetailsDrawerProps {
  job: JobListItem | null;
  onClose: () => void;
  onRetry: (job: JobListItem) => void;
  onCancel: (job: JobListItem) => void;
  hasJobs: boolean;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return 'N/A';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatBox({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
        <Icon className="h-4 w-4" />
        <p style={{ margin: 0, fontSize: 11 }}>{label}</p>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{value}</p>
    </div>
  );
}

function DrawerBtn({ icon, label, onClick, href, variant }: {
  icon: React.ReactNode; label: string; onClick?: () => void; href?: string;
  variant?: 'default' | 'danger' | 'ghost';
}) {
  const [h, setH] = React.useState(false);
  const getStyle = () => {
    if (variant === 'danger') return { bg: h ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none' };
    if (variant === 'default') return { bg: h ? 'var(--color-accent-glow-hover)' : 'var(--color-accent-gradient)', color: 'white', border: 'none', shadow: 'var(--color-accent-button-glow)' };
    return { bg: h ? 'rgba(255,255,255,0.06)' : 'transparent', color: h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: '1px solid', borderColor: h ? 'var(--color-border-strong)' : 'var(--color-border-default)' };
  };
  const s = getStyle();
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    width: '100%', height: 38, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    fontFamily: 'var(--font-body)', cursor: 'pointer', textDecoration: 'none',
    transition: 'all 0.15s ease', ...s,
  };
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={base} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{icon} {label}</a>;
  return <button onClick={onClick} style={base} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{icon} {label}</button>;
}

export function JobDetailsDrawer({ job, onClose, onRetry, onCancel, hasJobs }: JobDetailsDrawerProps) {
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    if (job) {
      setLoading(true);
      setApiError(false);
      setDetail(null);
      getJob(job.id)
        .then(setDetail)
        .catch(() => setApiError(true))
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
      setApiError(false);
    }
  }, [job?.id]);

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--color-accent-glow)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Job Details
        </p>
        {detail && !loading && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
              color: 'var(--color-text-muted)', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = 'var(--color-text-muted)'; }}
          >
            <XCircle size={16} />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>

        {/* STATE 1: No jobs */}
        {!hasJobs && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 8, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              You haven't processed any images yet.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
              Run your first workflow to see<br />processing details here.
            </p>
          </div>
        )}

        {/* STATE 2: Jobs exist, nothing selected */}
        {hasJobs && !job && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 8, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Select a Workflow
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              to view details.
            </p>
          </div>
        )}

        {/* STATE 3: Loading */}
        {hasJobs && job && loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton style={{ height: 80, borderRadius: 'var(--radius-xl)' }} />
            <Skeleton style={{ height: 120, borderRadius: 'var(--radius-xl)' }} />
            <Skeleton style={{ height: 160, borderRadius: 'var(--radius-xl)' }} />
          </div>
        )}

        {/* STATE 5: API failure */}
        {hasJobs && job && !loading && apiError && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 8, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Failed to load Job Details.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              Please try again.
            </p>
          </div>
        )}

        {/* STATE 4: Loaded */}
        {hasJobs && job && !loading && detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Image + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, flexShrink: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)' }}>
                {detail.image.thumbnail_url ? (
                  <img src={detail.image.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {detail.image.filename}
                </p>
                <div style={{ marginTop: 6 }}><JobStatusBadge status={detail.status} /></div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <StatBox icon={BarChart3} label="Stages"   value={String(detail.config?.length ?? 0)} />
              <StatBox icon={Clock}    label="Duration"  value={formatDuration(job?.duration)} />
              <StatBox icon={DollarSign} label="Credits" value={String(detail.total_credits)} />
              <StatBox icon={Zap}      label="Status"    value={detail.status} />
            </div>

            {/* Dates */}
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-primary)' }}>{formatDate(detail.created_at)}</p>
            </div>
            {detail.completed_at && (
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completed</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-primary)' }}>{formatDate(detail.completed_at)}</p>
              </div>
            )}

            {/* Timeline */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Processing Timeline</p>
              <JobTimeline config={detail.config} metaStages={detail.meta?.stages ?? null} status={detail.status} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(detail.status === 'processing' || detail.status === 'pending') && job && (
                <DrawerBtn icon={<XCircle size={15} />} label="Cancel Job" onClick={() => { onCancel(job); onClose(); }} variant="danger" />
              )}
              {detail.status === 'failed' && job && (
                <DrawerBtn icon={<RotateCcw size={15} />} label="Retry Job" onClick={() => { onRetry(job); onClose(); }} variant="default" />
              )}
              {detail.output_url && (
                <DrawerBtn icon={<ExternalLink size={15} />} label="View Result" href={detail.output_url} />
              )}
              <DrawerBtn icon={<ExternalLink size={15} />} label="Open Original" href={detail.image.original_url} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}