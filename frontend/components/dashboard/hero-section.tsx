'use client';

import { IconPlus, IconUpload, IconZap } from './ui';

interface HeroSectionProps {
  username?: string;
  creditsRemaining: number | null;
  totalImages: number | null;
  totalJobs: number | null;
  avgTime: number | null;
  onNewEnhancement?: () => void;
  onImportImages?: () => void;
}

function Stat({ label, value, unit, color }: {
  label: string; value: string; unit: string; color?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 600, color: color ?? 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', marginTop: 1 }}>{unit}</div>
    </div>
  );
}

function formatAvgTime(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
}

export function HeroSection({
  username,
  creditsRemaining,
  totalImages,
  totalJobs,
  avgTime,
  onNewEnhancement,
  onImportImages,
}: HeroSectionProps) {

   console.log('HeroSection creditsRemaining:', creditsRemaining);

  const creditsDisplay = creditsRemaining != null ? creditsRemaining.toLocaleString() : '—';

  // Bar cap matches the Starter plan max (250 credits)
  const BAR_CAP = 250;
  const barPercent = creditsRemaining != null
    ? Math.min(100, Math.round((creditsRemaining / BAR_CAP) * 100))
    : null;

  const barColor =
    barPercent === null ? 'var(--color-accent-gradient-horiz)'
    : barPercent > 50   ? 'linear-gradient(90deg, #10b981, #34d399)'
    : barPercent > 20   ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    :                     'linear-gradient(90deg, #ef4444, #f87171)';

  return (
    <section style={{
      padding: '28px 24px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
    }}>
      {/* Left: Welcome + actions */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px',
            background: 'var(--color-accent-dim)',
            border: '1px solid var(--color-accent-dim)',
            borderRadius: 99,
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: 'var(--color-accent-blue)', fontWeight: 500, letterSpacing: '0.02em',
          }}>
            <IconZap />
            AI Enhancement Studio
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 600,
          color: 'var(--color-text-primary)', margin: 0,
          letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8,
        }}>
          Good morning, {username ?? 'there'}.
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 17,
          color: 'var(--color-text-secondary)', margin: 0, marginBottom: 36,
          lineHeight: 1.55, maxWidth: 540,
        }}>
          Your AI pipeline is ready.{' '}
          {creditsRemaining != null
            ? `${creditsRemaining.toLocaleString()} credits available — enhance images with a single click.`
            : 'Upload an image to get started.'}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onNewEnhancement}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 48, padding: '0 24px',
              background: 'var(--color-accent-gradient)', border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: 'pointer', boxShadow: 'var(--color-accent-button-glow)', transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--color-accent-glow-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--color-accent-button-glow)'; }}
          >
            <IconPlus /> New Enhancement
          </button>

          <button
            onClick={onImportImages}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 48, padding: '0 24px',
              background: 'transparent', border: '1px solid var(--color-border-default)', borderRadius: 12,
              color: 'var(--color-text-secondary)', fontSize: 15, fontWeight: 500,
              fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-strong)'; el.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-default)'; el.style.color = 'var(--color-text-secondary)'; }}
          >
            <IconUpload /> Import Images
          </button>
        </div>
      </div>

      {/* Right: Usage summary */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '24px 28px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)',
          minWidth: 380,
          boxShadow: 'var(--color-accent-glow)',
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)'; }}
      >
        <div style={{ flex: 1 }}>
          {/* Credits row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              Credits remaining
            </span>
            <span style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
              {creditsDisplay}
            </span>
          </div>

          {/* Bar */}
          <div style={{
            height: 8, background: 'rgba(255,255,255,0.06)',
            borderRadius: 99, overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              height: '100%',
              width: barPercent !== null ? `${barPercent}%` : '0%',
              background: barColor,
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 20 }}>
            <Stat
              label="Images stored"
              value={totalImages != null ? totalImages.toLocaleString() : '—'}
              unit="total"
              color="var(--color-accent-blue)"
            />
            <div style={{ width: 1, background: 'var(--color-border-subtle)' }} />
            <Stat
              label="Jobs run"
              value={totalJobs != null ? totalJobs.toLocaleString() : '—'}
              unit="all time"
              color="var(--color-accent-purple, #8b5cf6)"
            />
            <div style={{ width: 1, background: 'var(--color-border-subtle)' }} />
            <Stat
              label="Avg process"
              value={formatAvgTime(avgTime)}
              unit="per job"
              color="var(--color-success)"
            />
          </div>
        </div>
      </div>
    </section>
  );
}