'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { StageMetric } from '@/lib/types';

interface ProcessingTimelineProps {
  stages: { plugin: string }[];
  stageMetrics?: StageMetric[] | null;
  currentStageIndex: number;
  status: string;
}

function formatDuration(seconds?: number) {
  if (!seconds) return '';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  return `${seconds.toFixed(1)}s`;
}

export function ProcessingTimeline({
  stages,
  stageMetrics,
  currentStageIndex,
  status,
}: ProcessingTimelineProps) {
  const isFinished = status === 'completed' || status === 'failed' || status === 'cancelled';

  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--color-accent-glow)',
      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} /> Processing Timeline
        </h3>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ position: 'relative' }}>
          {stages.map((stage, idx) => {
            const metric = stageMetrics?.[idx];
            const isActive = !isFinished && idx === currentStageIndex;
            const isPast = metric?.status === 'success' || (isFinished && idx < currentStageIndex);
            const isFailed = metric?.status === 'failed';
            const isLast = idx === stages.length - 1;

            const getDotBg = () => {
              if (isPast) return 'var(--color-success-dim)';
              if (isActive) return 'var(--color-accent-dim)';
              if (isFailed) return 'rgba(239,68,68,0.12)';
              return 'var(--color-bg-elevated)';
            };
            const getDotBorder = () => {
              if (isPast) return 'var(--color-success)';
              if (isActive) return 'var(--color-accent)';
              if (isFailed) return '#ef4444';
              return 'var(--color-border-subtle)';
            };
            const getIcon = () => {
              if (isPast) return <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />;
              if (isFailed) return <XCircle size={14} style={{ color: '#ef4444' }} />;
              if (isActive) return <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)' }} />;
              return <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-muted)', opacity: 0.4 }} />;
            };

            return (
              <div key={idx} style={{ position: 'relative', display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: getDotBg(), border: '2px solid', borderColor: getDotBorder(),
                  }}>
                    {getIcon()}
                  </div>
                  {!isLast && (
                    <div style={{
                      marginTop: 4, width: 1, flex: 1,
                      background: isPast ? 'var(--color-success)' : 'var(--color-border-subtle)',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                      color: isFailed ? '#ef4444' : 'var(--color-text-primary)',
                    }}>
                      {stage.plugin}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {formatDuration(metric?.duration)}
                    </span>
                  </div>
                  {isFailed && metric?.error && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>{metric.error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
