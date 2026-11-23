'use client';

import { useState } from 'react';
import { IconChevronRight, IconFolder, IconWorkflow, IconSparkles } from './ui';

interface WidgetCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  count: string;
  preview: React.ReactNode;
}

export function WidgetCard({ icon, iconColor, iconBg, title, subtitle, count, preview }: WidgetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: `1px solid ${hovered ? 'var(--color-border-default)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '22px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.25), var(--color-accent-glow-hover)' : 'var(--color-accent-glow)',
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            boxShadow: `0 0 14px 0 ${iconColor}`,
          }}>
            {icon}
          </div>
          <div>
            <div style={{
              fontSize: 16,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 3,
            }}>{title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
            padding: '3px 10px',
            background: 'var(--color-bg-elevated)',
            borderRadius: 7,
          }}>{count}</span>
          <div style={{
            color: 'var(--color-text-muted)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}>
            <IconChevronRight />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {preview}
      </div>

      {expanded && (
        <div style={{
          marginTop: 18,
          paddingTop: 18,
          borderTop: '1px solid var(--color-border-subtle)',
          fontSize: 12.5,
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}>
          Click to open full view →
        </div>
      )}
    </div>
  );
}

const PROJECT_THUMBS = [
  { color: '#1e3a5f', label: 'Mountain Series' },
  { color: '#1a2e1a', label: 'Nature Portfolio' },
  { color: '#2e1a2e', label: 'Studio Portraits' },
  { color: '#2e2a1a', label: 'Architecture' },
];

const WORKFLOW_THUMBS = [
  { label: '4× Upscale', color: 'var(--color-accent-blue-dim)', text: 'var(--color-accent-blue)' },
  { label: 'Portrait', color: 'var(--color-accent-purple-dim)', text: 'var(--color-accent-purple)' },
  { label: 'Fast Batch', color: 'var(--color-success-dim)', text: 'var(--color-success)' },
];

const AI_RECS = [
  { label: 'Try batch upscale on 23 unprocessed RAWs', type: 'batch' },
  { label: 'Face Restore may improve portrait_studio_raw.cr2', type: 'quality' },
  { label: 'Night cityscape benefits from Denoise first', type: 'tip' },
];

export interface WidgetData {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  count: string;
  preview: React.ReactNode;
}

interface BottomWidgetsProps {
  widgets: WidgetData[];
}

export function BottomWidgets({ widgets }: BottomWidgetsProps) {
  if (widgets.length === 0) return null;

  return (
    <section style={{ padding: '0 24px 32px' }}>
      <div style={{
        fontSize: 13,
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        Workspace
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
      }}>
        {widgets.map((w) => (
          <WidgetCard key={w.title} {...w} />
        ))}
      </div>
    </section>
  );
}