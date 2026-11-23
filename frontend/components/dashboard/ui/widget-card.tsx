'use client';

import { useState } from 'react';

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
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        transition: 'all 0.18s ease',
        cursor: 'pointer',
        backgroundColor: 'var(--color-bg-card)',
        border: hovered ? '1px solid var(--color-border-default)' : '1px solid var(--color-border-subtle)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: iconBg,
              color: iconColor,
            }}
          >
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', margin: 0 }}>{title}</p>
            <p style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', margin: 0 }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            padding: '1px 8px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-secondary)',
          }}>{count}</span>
        </div>
      </div>

      <div>{preview}</div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
          <p style={{ fontSize: 11, color: 'var(--color-accent-blue)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Click to open full view →</p>
        </div>
      )}
    </div>
  );
}
