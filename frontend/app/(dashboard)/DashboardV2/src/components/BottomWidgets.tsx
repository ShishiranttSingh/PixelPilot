import { useState, KeyboardEvent } from 'react'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface WidgetData {
  id: string
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  title: string
  subtitle: string
  count: string
  /** Pre-built preview content (thumbnails, tags, or list) supplied by the parent. */
  preview: React.ReactNode
  /** Accessible label for the widget's toggle control, e.g. "Open Saved Projects". */
  ariaLabel?: string
}

export interface BottomWidgetsProps {
  widgets: WidgetData[]
  isLoading?: boolean
  onWidgetClick?: (id: string) => void
}

export interface WidgetCardProps {
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  title: string
  subtitle: string
  count: string
  preview: React.ReactNode
  expanded: boolean
  onToggle: () => void
  ariaLabel?: string
}

// ─── Icons ───────────────────────────────────────────────────────────────────
// Unchanged from the original implementation.

export const IconFolder = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H5l2 2h5.5A1.5 1.5 0 0 1 14 5.5v6A1.5 1.5 0 0 1 12.5 13h-10A1.5 1.5 0 0 1 1 11.5v-8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

export const IconWorkflow = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="10" y="5.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5 3h3.5a2 2 0 0 1 2 2v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 12h3.5a2 2 0 0 0 2-2v-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

export const IconSparkle = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7.5 1l1.3 4H13l-3.5 2.5 1.3 4L7.5 9 4.2 11.5l1.3-4L2 5h4.2L7.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

export const IconChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── WidgetCard (presentational subcomponent) ─────────────────────────────────

function WidgetCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  count,
  preview,
  expanded,
  onToggle,
  ariaLabel,
}: WidgetCardProps) {
  const [hovered, setHovered] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={ariaLabel ?? `Open ${title}`}
      style={{
        background: 'var(--color-bg-card)',
        border: `1px solid ${hovered ? 'var(--color-border-default)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{
              fontSize: 13.5,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 1,
            }}>{title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            aria-label={`${count} items`}
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              padding: '2px 8px',
              background: 'var(--color-bg-elevated)',
              borderRadius: 6,
            }}
          >{count}</span>
          <div
            aria-hidden="true"
            style={{
              color: 'var(--color-text-muted)',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <IconChevronRight />
          </div>
        </div>
      </div>

      {/* Preview row (always visible) */}
      <div style={{ display: 'flex', gap: 6 }}>
        {preview}
      </div>

      {/* Expanded state */}
      {expanded && (
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid var(--color-border-subtle)',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}>
          Click to open full view →
        </div>
      )}
    </div>
  )
}

// ─── WidgetCardSkeleton ────────────────────────────────────────────────────────
// Matches WidgetCard's collapsed box model exactly so no layout shift occurs
// when live data replaces the skeleton.

function WidgetCardSkeleton() {
  const shimmer: React.CSSProperties = {
    background: 'var(--color-border-subtle)',
    borderRadius: 4,
    opacity: 0.5,
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading widget"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...shimmer, width: 34, height: 34, borderRadius: 10 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ ...shimmer, width: 90, height: 13.5 }} />
            <div style={{ ...shimmer, width: 120, height: 11.5 }} />
          </div>
        </div>
        <div style={{ ...shimmer, width: 28, height: 18, borderRadius: 6 }} />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ ...shimmer, width: 40, height: 28, borderRadius: 6 }} />
        <div style={{ ...shimmer, width: 40, height: 28, borderRadius: 6 }} />
        <div style={{ ...shimmer, width: 40, height: 28, borderRadius: 6 }} />
        <div style={{ ...shimmer, width: 40, height: 28, borderRadius: 6 }} />
      </div>
    </div>
  )
}

// ─── BottomWidgets (root, presentational) ─────────────────────────────────────

/**
 * Purely presentational. Renders whatever `widgets` it's given, or skeleton
 * placeholders while `isLoading` is true. Never knows where widget data came
 * from — project counts, workflow counts, and AI recommendation content all
 * live in the parent page.
 */
export default function BottomWidgets({ widgets, isLoading = false, onWidgetClick }: BottomWidgetsProps) {
  // Expanded/collapsed is transient UI state, not business data, so it's fine
  // for this presentational component to own it locally.
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
    onWidgetClick?.(id)
  }

  const skeletonCount = widgets.length || 3

  return (
    <section style={{ padding: '0 24px 32px' }}>
      <div style={{
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        Workspace
      </div>
      <div
        role="list"
        aria-label="Workspace widgets"
        aria-busy={isLoading}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {isLoading
          ? Array.from({ length: skeletonCount }, (_, i) => <WidgetCardSkeleton key={i} />)
          : widgets.map(widget => (
              <div key={widget.id} role="listitem">
                <WidgetCard
                  icon={widget.icon}
                  iconColor={widget.iconColor}
                  iconBg={widget.iconBg}
                  title={widget.title}
                  subtitle={widget.subtitle}
                  count={widget.count}
                  preview={widget.preview}
                  expanded={expandedId === widget.id}
                  onToggle={() => handleToggle(widget.id)}
                  ariaLabel={widget.ariaLabel}
                />
              </div>
            ))}
      </div>
    </section>
  )
}