// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface DashboardStat {
  /** Icon element rendered inside the colored badge */
  icon: React.ReactNode
  /** CSS color value for the icon itself */
  iconColor: string
  /** CSS background value for the icon badge */
  iconBackground: string
  /** Short metric label shown below the value */
  label: string
  /** Primary display value (e.g. "847", "1.4s", "Operational") */
  value: string
  /** Secondary line shown below the label */
  subtext: string
  /** Optional override for subtext color; defaults to muted text token */
  subtextColor?: string
  /** Optional trend badge text (e.g. "+12%", "-0.3s") */
  trend?: string
  /**
   * Whether the trend represents an improvement.
   * true  → success color
   * false → warning color
   * undefined → no trend badge
   */
  trendUp?: boolean
  /** Accessible label for screen readers (defaults to `${label}: ${value}`) */
  ariaLabel?: string
}

export interface StatsRowProps {
  statistics: DashboardStat[]
  /**
   * When true, skeleton placeholders are rendered instead of live data.
   * Prevents layout shift while data is being fetched.
   */
  isLoading?: boolean
}

// ─── Icons ───────────────────────────────────────────────────────────────────
// Kept co-located so the file is self-contained; move to an icons module if
// your project already has one.

export const IconCreditCard = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1 7h14" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4 10.5h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

export const IconImages = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.5" y="3.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4.5 13.5h8a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="5.5" cy="7" r="1" fill="currentColor" />
    <path d="M2 11l3-3 2.5 2.5 2-2 2 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconActivity = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3" fill="currentColor" fillOpacity="0.25" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
  </svg>
)

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/** Renders a single shimmering placeholder card. Matches StatCard dimensions exactly. */
function StatCardSkeleton() {
  const shimmer: React.CSSProperties = {
    background: 'var(--color-border-subtle)',
    borderRadius: 4,
    // A real project would animate this with a CSS keyframe; kept static here
    // so no extra global stylesheet is required.
    opacity: 0.5,
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading statistic"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Icon badge + optional trend row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ ...shimmer, width: 34, height: 34, borderRadius: 10 }} />
        <div style={{ ...shimmer, width: 44, height: 20, borderRadius: 6 }} />
      </div>

      {/* Value + label + subtext block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...shimmer, width: '55%', height: 26, borderRadius: 4 }} />
        <div style={{ ...shimmer, width: '70%', height: 13, borderRadius: 4, marginTop: 3 }} />
        <div style={{ ...shimmer, width: '50%', height: 11, borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  stat: DashboardStat
}

function StatCard({ stat }: StatCardProps) {
  const {
    icon,
    iconColor,
    iconBackground,
    label,
    value,
    subtext,
    subtextColor,
    trend,
    trendUp,
    ariaLabel,
  } = stat

  // Derive an accessible label so screen readers announce the full meaning,
  // not just the numeric value in isolation.
  const accessibleLabel = ariaLabel ?? `${label}: ${value}`

  // Trend direction communicated in text for screen readers, not just color.
  const trendAriaLabel = trend
    ? `${trend} — ${trendUp ? 'increasing' : 'decreasing'}`
    : undefined

  return (
    <div
      role="status"
      aria-label={accessibleLabel}
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.18s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-default)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-subtle)'
      }}
    >
      {/* Icon badge + trend chip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: iconBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
          }}
        >
          {icon}
        </div>

        {trend && (
          <span
            aria-label={trendAriaLabel}
            style={{
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              color: trendUp ? 'var(--color-success)' : 'var(--color-warning)',
              background: trendUp ? 'var(--color-success-dim)' : 'var(--color-warning-dim)',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Value, label, subtext */}
      <div>
        <div
          aria-hidden="true" // full meaning already conveyed by role="status" aria-label above
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: 5,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-body)',
            color: subtextColor ?? 'var(--color-text-muted)',
          }}
        >
          {subtext}
        </div>
      </div>
    </div>
  )
}

// ─── StatsRow ─────────────────────────────────────────────────────────────────

/**
 * Purely presentational statistics grid.
 *
 * Responsibilities:
 *   - Render the supplied `statistics` array as a responsive card grid.
 *   - Show skeleton placeholders while `isLoading` is true.
 *
 * Non-responsibilities (handled by DashboardPage):
 *   - Fetching data
 *   - Calculating trends
 *   - Deriving system health
 *   - Knowing which metrics exist
 */
export default function StatsRow({ statistics, isLoading = false }: StatsRowProps) {
  // When loading, render the same number of skeletons as we expect cards.
  // If the count isn't known yet, fall back to 4 to match the typical layout.
  const skeletonCount = statistics.length || 4

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        padding: '0 24px 20px',
      }}
    >
      {isLoading
        ? Array.from({ length: skeletonCount }, (_, i) => <StatCardSkeleton key={i} />)
        : statistics.map(stat => <StatCard key={stat.label} stat={stat} />)}
    </div>
  )
}