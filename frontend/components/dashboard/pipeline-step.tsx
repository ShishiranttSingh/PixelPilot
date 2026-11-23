'use client';

import { DashboardSwitch } from './ui/dashboard-switch';
import type { Stage } from '@/lib/types';

const stepIcons: Record<string, React.ReactNode> = {
  upscale: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 12L12 2M12 2H7M12 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 2h4M2 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  denoise: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="1" fill="currentColor" fillOpacity="0.4" />
      <circle cx="7" cy="3" r="0.8" fill="currentColor" fillOpacity="0.3" />
      <circle cx="10" cy="5" r="1" fill="currentColor" fillOpacity="0.4" />
      <circle cx="5" cy="8" r="0.8" fill="currentColor" fillOpacity="0.3" />
      <circle cx="9" cy="9" r="1" fill="currentColor" fillOpacity="0.4" />
      <path d="M2 11c4-4 6-4 10 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  'face-restore': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="6" r="0.8" fill="currentColor" />
      <circle cx="9" cy="6" r="0.8" fill="currentColor" />
      <path d="M4.5 9c.5 1 4.5 1 5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  sharpen: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1l1.5 4h4L9 7.5l1.5 4L7 9l-3.5 2.5L5 7.5 1.5 5H5.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  export: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v7M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

const stepDurations: Record<string, string> = {
  upscale: '0.4s',
  denoise: '0.3s',
  'face-restore': '—',
  sharpen: '0.2s',
  export: '0.3s',
};

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface PipelineStepProps {
  stage: Stage;
  index: number;
  onToggle: () => void;
}

export function PipelineStep({ stage, onToggle }: PipelineStepProps) {
  const isComplete = stage.enabled;
  const isDisabled = !stage.enabled;
  const icon = stepIcons[stage.plugin] || stepIcons.upscale;
  const duration = stepDurations[stage.plugin] || '—';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 10px',
      background: isComplete
        ? 'rgba(16,185,129,0.04)'
        : isDisabled
        ? 'transparent'
        : 'var(--color-bg-elevated)',
      border: `1px solid ${isComplete
        ? 'var(--color-success-dim)'
        : isDisabled
        ? 'var(--color-border-subtle)'
        : 'var(--color-border-default)'}`,
      borderRadius: 10,
      transition: 'all 0.18s ease',
      opacity: isDisabled ? 0.45 : 1,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: isComplete
          ? 'var(--color-success-dim)'
          : isDisabled
          ? 'rgba(255,255,255,0.04)'
          : 'var(--color-accent-blue-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isComplete
          ? 'var(--color-success)'
          : isDisabled
          ? 'var(--color-text-muted)'
          : 'var(--color-accent-blue)',
        flexShrink: 0,
      }}>
        {isComplete ? (
          <IconCheck />
        ) : (
          icon
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5,
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          color: isDisabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        }}>
          {stage.plugin.replace('-', ' ')}
        </div>
        <div style={{
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
        }}>
          {stage.reason}
        </div>
      </div>

      {duration && stage.enabled && (
        <span style={{
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          flexShrink: 0,
        }}>
          {duration}
        </span>
      )}

      <DashboardSwitch
        checked={stage.enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}