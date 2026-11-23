const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 9V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const IconZap = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M7 1L2 7h4.5L5 11l5-6H6L7 1Z" fill="currentColor" />
  </svg>
)

interface HeroSectionProps {
  username: string;
  creditsRemaining: number;
  maxCredits: number;
  monthlyEnhancements: number;
  successRate: string;
  aiRecommendation: string | null;
  isLoading?: boolean;
  onNewEnhancement: () => void;
  onImportImages: () => void;
}

export default function HeroSection({
  username,
  creditsRemaining,
  maxCredits,
  monthlyEnhancements,
  successRate,
  aiRecommendation,
  isLoading = false,
  onNewEnhancement,
  onImportImages,
}: HeroSectionProps) {
  const progressPercentage = (() => {
    if (!maxCredits || maxCredits <= 0) return 0;
    const pct = (creditsRemaining / maxCredits) * 100;
    return Math.min(100, Math.max(0, pct));
  })();

  const formattedCredits = `${Math.max(0, creditsRemaining).toLocaleString()} / ${maxCredits.toLocaleString()}`;

  if (isLoading) {
    return (
      <section style={{
        padding: '28px 24px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 20, width: 140, background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 12 }} />
          <div style={{ height: 32, width: 260, background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 10 }} />
          <div style={{ height: 16, width: 320, background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ height: 38, width: 148, background: 'rgba(255,255,255,0.06)', borderRadius: 10 }} />
            <div style={{ height: 38, width: 130, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />
          </div>
        </div>
        <div style={{
          padding: '18px 20px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          minWidth: 340,
        }}>
          <div style={{ height: 12, width: '60%', background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 10 }} />
          <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 99, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 14, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 4 }} />
                <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            background: 'var(--color-accent-blue-dim)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 99,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-accent-blue)',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            <IconZap />
            AI Enhancement Studio
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: 0,
          letterSpacing: '-0.03em',
          lineHeight: 1.25,
          marginBottom: 6,
        }}>
          Good morning, {username}.
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          margin: 0,
          marginBottom: 20,
        }}>
          Your AI pipeline is ready. {creditsRemaining.toLocaleString()} credits available — enhance images with a single click.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onNewEnhancement}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6d5ce7 100%)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(59,130,246,0.3)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 36px rgba(59,130,246,0.45)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(59,130,246,0.3)' }}
          >
            <IconPlus />
            New Enhancement
          </button>

          <button
            onClick={onImportImages}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 10,
              color: 'var(--color-text-primary)',
              fontSize: 13.5,
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-default)' }}
          >
            <IconUpload />
            Import Images
          </button>
        </div>
      </div>

      {/* Right: Usage summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '18px 20px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        minWidth: 340,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>Credits remaining</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{formattedCredits}</span>
          </div>
          <div style={{
            height: 4,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 99,
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercentage}%`,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: 99,
            }} />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Stat
              label="This month"
              value={monthlyEnhancements > 0 ? String(monthlyEnhancements) : '0'}
              unit="enhanced"
            />
            <div style={{ width: 1, background: 'var(--color-border-subtle)' }} />
            <Stat
              label="Success rate"
              value={successRate || '—'}
              unit="completed jobs"
              color="var(--color-success)"
            />
            <div style={{ width: 1, background: 'var(--color-border-subtle)' }} />
            <Stat
              label="AI recommendation"
              value={aiRecommendation || 'None'}
              unit={aiRecommendation ? 'suggested' : 'upload an image'}
              color="var(--color-accent-purple)"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 500, color: color ?? 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>{unit}</div>
    </div>
  )
}