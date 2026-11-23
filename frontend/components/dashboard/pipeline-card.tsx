'use client';

import { PipelineStep } from './pipeline-step';
import { ActivityCard, type ActivityItemData } from './activity-card';
import { DashboardSwitch } from './ui/dashboard-switch';
import type { Stage } from '@/lib/types';

interface PipelineCardProps {
  stages: Stage[];
  onToggle: (idx: number) => void;
  onExecute: () => void;
  running: boolean;
}

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

function getStepStatus(stage: Stage): 'complete' | 'active' | 'disabled' {
  if (!stage.enabled) return 'disabled';
  return 'complete';
}

function PipelineStepCard({ stage, index, isLast, onToggle }: { stage: Stage; index: number; isLast: boolean; onToggle: () => void }) {
  const status = getStepStatus(stage);
  const icon = stepIcons[stage.plugin] || (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1L2 7h4.5L5 11l5-6H6L7 1Z" fill="currentColor" />
    </svg>
  );
  const duration = stepDurations[stage.plugin] || '—';
  const isComplete = status === 'complete' && stage.enabled;
  const isDisabled = !stage.enabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: isComplete
          ? 'rgba(16,185,129,0.04)'
          : isDisabled
            ? 'transparent'
            : 'var(--color-bg-elevated)',
        border: `1px solid ${isComplete ? 'var(--color-success-dim)' : isDisabled ? 'var(--color-border-subtle)' : 'var(--color-border-default)'}`,
        borderRadius: 12,
        transition: 'all 0.18s ease',
        opacity: isDisabled ? 0.4 : 1,
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: isComplete
            ? 'var(--color-success-dim)'
            : isDisabled
              ? 'rgba(255,255,255,0.03)'
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
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
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
            marginTop: 1,
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
            marginRight: 8,
          }}>
            {duration}
          </span>
        )}

        <DashboardSwitch
          checked={stage.enabled}
          onCheckedChange={onToggle}
        />
      </div>

      {!isLast && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '4px 0',
        }}>
          <div style={{
            width: 1,
            height: 16,
            background: stage.enabled ? 'var(--color-accent-dim)' : 'var(--color-border-subtle)',
          }} />
        </div>
      )}
    </div>
  );
}

export function PipelineCard({ stages, onToggle, onExecute, running }: PipelineCardProps) {
  const activeCount = stages.filter((s) => s.enabled).length;

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 22,
      flex: 0,
      boxShadow: 'var(--color-accent-glow)',
      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }}
    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)' }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}>Workflow Builder</div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
            Enhancement pipeline
          </div>
        </div>
        <span style={{
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          padding: '4px 12px',
          background: 'var(--color-bg-elevated)',
          borderRadius: 8,
        }}>
          {activeCount}/{stages.length} active
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stages.map((stage, index) => (
          <PipelineStepCard
            key={stage.plugin}
            stage={stage}
            index={index}
            isLast={index === stages.length - 1}
            onToggle={() => onToggle(index)}
          />
        ))}
      </div>

      <button
        onClick={onExecute}
        disabled={activeCount === 0 || running}
        style={{
          width: '100%',
          marginTop: 22,
          padding: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: running
            ? 'var(--color-accent-dim)'
            : 'var(--color-accent-gradient)',
          border: running ? '1px solid var(--color-accent)' : 'none',
          borderRadius: 12,
          color: 'white',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: running ? 'not-allowed' : 'pointer',
          boxShadow: running ? 'none' : 'var(--color-accent-button-glow)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 2l9 5-9 5V2Z" fill="currentColor" />
        </svg>
        {running ? 'Processing…' : 'Run Enhancement'}
      </button>
    </div>
  );
}