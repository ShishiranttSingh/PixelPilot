'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { StageMetric, StageInfo } from '@/lib/types';

interface JobTimelineProps {
  config?: StageInfo[] | null;
  metaStages?: StageMetric[] | null;
  status: string;
}

function formatDuration(seconds?: number) {
  if (!seconds) return '';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  return `${seconds.toFixed(1)}s`;
}

export function JobTimeline({ config, metaStages, status }: JobTimelineProps) {
  if (!config || config.length === 0) {
    return (
      <div style={{
        display: 'flex', height: 80, alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border-subtle)',
        background: 'var(--color-bg-elevated)',
      }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No stage data available</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {config.map((stage, idx) => {
        const metric = metaStages?.[idx];
        const isComplete = metric?.status === 'success';
        const isFailed = metric?.status === 'failed';
        const isLast = idx === config.length - 1;

        const getDotBg = () => {
          if (isComplete) return 'var(--color-success-dim)';
          if (isFailed) return 'rgba(239,68,68,0.12)';
          return 'var(--color-bg-elevated)';
        };
        const getDotBorder = () => {
          if (isComplete) return 'var(--color-success)';
          if (isFailed) return '#ef4444';
          return 'var(--color-border-subtle)';
        };

        return (
          <div key={idx} style={{ position: 'relative', display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: getDotBg(), border: '2px solid', borderColor: getDotBorder(),
              }}>
                {isComplete ? <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} /> :
                 isFailed ? <XCircle size={14} style={{ color: '#ef4444' }} /> :
                 <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />}
              </div>
              {!isLast && (
                <div style={{ marginTop: 4, width: 1, flex: 1, background: isComplete ? 'var(--color-success)' : 'var(--color-border-subtle)' }} />
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
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
        Status: <span style={{ fontWeight: 500, textTransform: 'capitalize', color: 'var(--color-text-primary)' }}>{status}</span>
      </div>
    </div>
  );
}
