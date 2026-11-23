'use client';

import React from 'react';
import { Play, XCircle, RotateCcw } from 'lucide-react';
import type { WorkflowStatus } from '@/lib/types';
import { canCancel } from '@/lib/workflow-tracker';

interface ProgressCardProps {
  status: WorkflowStatus | 'idle';
  progress: number;
  currentStage: string;
  onExecute: () => void;
  onCancel: () => void;
  onRetry: () => void;
  /** Reason shown for a failed workflow. */
  errorMessage?: string | null;
  /** Connection / tracking problem to show without changing the workflow's status. */
  notice?: { text: string; giveUp: boolean } | null;
  /** Restarts status tracking after it gave up. */
  onRecheck?: () => void;
}

const statusLabel: Record<string, string> = {
  idle: 'Ready', pending: 'Queued', processing: 'Processing',
  completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
  idle: 'var(--color-text-secondary)', pending: 'var(--color-accent)',
  processing: 'var(--color-accent)', completed: 'var(--color-success)',
  failed: '#ef4444', cancelled: 'var(--color-text-muted)',
};

const statusBg: Record<string, string> = {
  idle: 'transparent', pending: 'var(--color-accent-dim)',
  processing: 'var(--color-accent-dim)', completed: 'var(--color-success-dim)',
  failed: 'rgba(239,68,68,0.12)', cancelled: 'rgba(255,255,255,0.04)',
};

export function ProgressCard({
  status, progress, currentStage, onExecute, onCancel, onRetry,
  errorMessage, notice, onRecheck,
}: ProgressCardProps) {
  const isProcessing = status === 'processing' || status === 'pending';
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  const isIdle = status === 'idle';
  // A completed workflow is always shown as 100%, whatever value arrived last.
  const shownProgress = isComplete ? 100 : progress;

  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--color-accent-glow)',
      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Execution
        </h3>
        <span style={{
          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '2px 10px',
          borderRadius: 6, background: statusBg[status] || 'transparent',
          color: statusColors[status] || 'var(--color-text-secondary)',
          border: '1px solid', borderColor: statusBg[status] || 'var(--color-border-subtle)',
        }}>
          {statusLabel[status] || status}
        </span>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Progress</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{shownProgress}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${shownProgress}%`, borderRadius: 99,
              background: 'var(--color-accent-gradient-horiz)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {isProcessing && currentStage && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Stage: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{currentStage}</span>
          </p>
        )}

        {isComplete && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
            Processing completed successfully
          </p>
        )}

        {isFailed && (
          <p style={{ margin: 0, fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            {errorMessage || 'Processing failed. Please try again.'}
          </p>
        )}

        {isCancelled && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
            Workflow was cancelled.
          </p>
        )}

        {notice && (
          <p role="status" style={{ margin: 0, fontSize: 12, color: 'var(--color-warning)' }}>
            {notice.text}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {isIdle && (
            <ActionBtn icon={<Play size={15} />} label="Execute" onClick={onExecute} primary />
          )}
          {canCancel(status) && !notice?.giveUp && (
            <ActionBtn icon={<XCircle size={15} />} label="Cancel" onClick={onCancel} danger />
          )}
          {notice?.giveUp && onRecheck && (
            <ActionBtn icon={<RotateCcw size={15} />} label="Check again" onClick={onRecheck} primary />
          )}
          {isFailed && (
            <ActionBtn icon={<RotateCcw size={15} />} label="Retry" onClick={onRetry} primary />
          )}
          {isCancelled && (
            <ActionBtn icon={<RotateCcw size={15} />} label="Start over" onClick={onRetry} primary />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, primary, danger }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean; danger?: boolean }) {
  const [h, setH] = React.useState(false);
  const getStyle = () => {
    if (danger) return { bg: h ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none' };
    if (primary) return { bg: h ? 'var(--color-accent-glow-hover)' : 'var(--color-accent-gradient)', color: 'white', border: 'none', shadow: 'var(--color-accent-button-glow)' };
    return { bg: h ? 'rgba(255,255,255,0.06)' : 'transparent', color: h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: '1px solid', borderColor: h ? 'var(--color-border-strong)' : 'var(--color-border-default)' };
  };
  const s = getStyle();
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: 38, padding: '0 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        fontFamily: 'var(--font-body)', cursor: 'pointer',
        transition: 'all 0.15s ease', ...s,
      }}
    >
      {icon} {label}
    </button>
  );
}
