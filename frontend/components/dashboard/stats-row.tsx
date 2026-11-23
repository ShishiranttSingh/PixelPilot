'use client';

import {
  IconCreditCard,
  IconImages,
  IconClock,
  IconActivity,
} from './ui';

interface StatCardData {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  subtext: string;
  subtextColor?: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtext,
  subtextColor,
  trend,
  trendUp,
}: StatCardData) {
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
        cursor: 'default',
        boxShadow: 'var(--color-accent-glow)',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          boxShadow: `0 0 16px 0 ${iconColor}`,
        }}>
          {icon}
        </div>

        {trend && (
          <span style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: trendUp ? 'var(--color-success)' : 'var(--color-warning)',
            background: trendUp ? 'var(--color-success-dim)' : 'var(--color-warning-dim)',
            padding: '3px 10px',
            borderRadius: 6,
          }}>
            {trend}
          </span>
        )}
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: 6,
        }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-body)', color: subtextColor ?? 'var(--color-text-muted)' }}>
          {subtext}
        </div>
      </div>
    </div>
  );
}

interface StatsRowProps {
  cards: StatCardData[];
}

export function StatsRow({ cards }: StatsRowProps) {
  if (cards.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      padding: '0 24px 28px',
    }}>
      {cards.map((card, idx) => (
        <StatCard key={card.label + idx} {...card} />
      ))}
    </div>
  );
}

export type { StatCardData };