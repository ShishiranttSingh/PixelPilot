// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  status: 'complete' | 'active' | 'disabled'
  enabled: boolean
  duration?: string
}

export interface WorkflowActivity {
  id: number | string
  file: string
  action: string
  time: string
  status: 'complete' | 'active' | 'error'
}

export interface WorkflowBuilderProps {
  steps: WorkflowStep[]
  recentActivity: WorkflowActivity[]
  running: boolean
  isLoading?: boolean
  onToggle: (id: string) => void
  onRun: () => void
}

// ─── Icons ───────────────────────────────────────────────────────────────────
// Unchanged from the original implementation.

export const IconUpscale = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 12L12 2M12 2H7M12 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 2h4M2 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const IconDenoise = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="4" cy="4" r="1" fill="currentColor" fillOpacity="0.4" />
    <circle cx="7" cy="3" r="0.8" fill="currentColor" fillOpacity="0.3" />
    <circle cx="10" cy="5" r="1" fill="currentColor" fillOpacity="0.4" />
    <circle cx="5" cy="8" r="0.8" fill="currentColor" fillOpacity="0.3" />
    <circle cx="9" cy="9" r="1" fill="currentColor" fillOpacity="0.4" />
    <path d="M2 11c4-4 6-4 10 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

export const IconFace = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="5" cy="6" r="0.8" fill="currentColor" />
    <circle cx="9" cy="6" r="0.8" fill="currentColor" />
    <path d="M4.5 9c.5 1 4.5 1 5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

export const IconSharpen = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1l1.5 4h4L9 7.5l1.5 4L7 9l-3.5 2.5L5 7.5 1.5 5H5.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

export const IconExport = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v7M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

export const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 2l9 5-9 5V2Z" fill="currentColor" />
  </svg>
)

// ─── WorkflowBuilder (root, presentational) ───────────────────────────────────

/**
 * Purely presentational. All workflow state, data fetching, execution logic,
 * and timers live in the parent page. This component only renders what it's
 * given and reports user intent (toggle / run) back up through callbacks.
 */
export default function WorkflowBuilder({
  steps,
  recentActivity,
  running,
  isLoading = false,
  onToggle,
  onRun,
}: WorkflowBuilderProps) {
  const activeCount = steps.filter(s => s.enabled).length

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Workflow Builder */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 18,
        flex: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 2,
            }}>Workflow Builder</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              Enhancement pipeline
            </div>
          </div>
          <span
            aria-label={isLoading ? 'Loading active step count' : `${activeCount} of ${steps.length} steps active`}
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              padding: '3px 8px',
              background: 'var(--color-bg-elevated)',
              borderRadius: 6,
            }}
          >
            {isLoading ? '—/—' : `${activeCount}/${steps.length}`} active
          </span>
        </div>

        {/* Pipeline steps */}
        <div
          role="list"
          aria-label="Enhancement pipeline steps"
          aria-busy={isLoading}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => (
                <div key={i}>
                  <WorkflowStepSkeleton />
                  {i < 4 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3px 0' }}>
                      <div style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                    </div>
                  )}
                </div>
              ))
            : steps.map((step, i) => (
                <div key={step.id} role="listitem">
                  <WorkflowStepCard step={step} onToggle={() => onToggle(step.id)} />
                  {i < steps.length - 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '3px 0',
                    }}>
                      <div style={{
                        width: 1,
                        height: 12,
                        background: step.enabled ? 'rgba(59,130,246,0.3)' : 'var(--color-border-subtle)',
                      }} />
                    </div>
                  )}
                </div>
              ))}
        </div>

        <WorkflowRunButton running={running} isLoading={isLoading} onRun={onRun} />
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 18,
        flex: 1,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 14,
        }}>Recent Activity</div>

        <ActivityTimeline activity={recentActivity} isLoading={isLoading} />
      </div>
    </div>
  )
}

// ─── WorkflowStepCard (presentational subcomponent) ───────────────────────────

function WorkflowStepCard({ step, onToggle }: { step: WorkflowStep; onToggle: () => void }) {
  const isComplete = step.status === 'complete' && step.enabled
  const isDisabled = !step.enabled

  const toggleLabel = `${step.enabled ? 'Disable' : 'Enable'} ${step.label}`
  const statusText = isDisabled ? 'Disabled' : step.status === 'complete' ? 'Complete' : 'Active'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 10px',
      background: isComplete
        ? 'rgba(16,185,129,0.04)'
        : isDisabled
          ? 'transparent'
          : 'var(--color-bg-elevated)',
      border: `1px solid ${isComplete ? 'rgba(16,185,129,0.15)' : isDisabled ? 'var(--color-border-subtle)' : 'var(--color-border-default)'}`,
      borderRadius: 10,
      transition: 'all 0.18s ease',
      opacity: isDisabled ? 0.45 : 1,
    }}>
      {/* Icon */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: isComplete
          ? 'var(--color-success-dim)'
          : isDisabled
            ? 'rgba(255,255,255,0.04)'
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
        {step.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5,
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          color: isDisabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        }}>
          {step.label}
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            {' '}— {statusText}
          </span>
        </div>
        <div style={{
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
        }}>
          {step.description}
        </div>
      </div>

      {/* Duration */}
      {step.duration && step.enabled && (
        <span
          aria-label={`Duration: ${step.duration}`}
          style={{
            fontSize: 10.5,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          {step.duration}
        </span>
      )}

      {/* Toggle */}
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={step.enabled}
        aria-label={toggleLabel}
        style={{
          width: 30,
          height: 17,
          borderRadius: 99,
          background: step.enabled ? 'var(--color-accent-blue)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: step.enabled ? 'calc(100% - 15px)' : 2,
          width: 13,
          height: 13,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}

// ─── WorkflowStepSkeleton ──────────────────────────────────────────────────────
// Matches WorkflowStepCard's box model exactly so no layout shift occurs
// when live data replaces the skeleton.

function WorkflowStepSkeleton() {
  const shimmer: React.CSSProperties = {
    background: 'var(--color-border-subtle)',
    borderRadius: 4,
    opacity: 0.5,
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading workflow step"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 10px',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 10,
      }}
    >
      <div style={{ ...shimmer, width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ ...shimmer, width: '45%', height: 12.5 }} />
        <div style={{ ...shimmer, width: '65%', height: 10.5 }} />
      </div>

      <div style={{ ...shimmer, width: 24, height: 10.5, flexShrink: 0 }} />
      <div style={{ ...shimmer, width: 30, height: 17, borderRadius: 99, flexShrink: 0 }} />
    </div>
  )
}

// ─── WorkflowRunButton (presentational subcomponent) ──────────────────────────

function WorkflowRunButton({
  running,
  isLoading,
  onRun,
}: {
  running: boolean
  isLoading: boolean
  onRun: () => void
}) {
  const disabled = running || isLoading

  return (
    <button
      onClick={onRun}
      disabled={disabled}
      aria-label={running ? 'Enhancement pipeline is processing' : 'Execute enhancement pipeline'}
      style={{
        width: '100%',
        marginTop: 16,
        padding: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: running
          ? 'rgba(59,130,246,0.15)'
          : 'linear-gradient(135deg, #3b82f6 0%, #6d5ce7 100%)',
        border: running ? '1px solid rgba(59,130,246,0.3)' : 'none',
        borderRadius: 10,
        color: 'white',
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: running ? 'none' : '0 0 20px rgba(59,130,246,0.25)',
        transition: 'all 0.2s ease',
      }}
    >
      <IconPlay />
      {running ? 'Processing…' : 'Run Enhancement'}
    </button>
  )
}

// ─── ActivityTimeline (presentational subcomponent) ───────────────────────────

function ActivityTimeline({
  activity,
  isLoading,
}: {
  activity: WorkflowActivity[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading recent workflow activity"
        style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <ActivitySkeleton key={i} isLast={i === 3} />
        ))}
      </div>
    )
  }

  return (
    <div
      role="list"
      aria-label="Recent workflow activity"
      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
    >
      {activity.map((item, i) => (
        <div
          key={item.id}
          role="listitem"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            paddingBottom: i < activity.length - 1 ? 14 : 0,
            position: 'relative',
          }}
        >
          {/* Timeline line */}
          {i < activity.length - 1 && (
            <div style={{
              position: 'absolute',
              left: 6,
              top: 16,
              bottom: 0,
              width: 1,
              background: 'var(--color-border-subtle)',
            }} />
          )}

          {/* Dot */}
          <div
            aria-hidden="true"
            style={{
              width: 13,
              height: 13,
              borderRadius: '50%',
              background: 'var(--color-success-dim)',
              border: '1.5px solid var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
              zIndex: 1,
            }}
          >
            <IconCheck />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 2,
            }}>
              {item.file}
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: 'var(--color-success)', fontFamily: 'var(--font-body)' }}>
                {item.action}
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {item.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ActivitySkeleton ──────────────────────────────────────────────────────────
// Matches a single ActivityTimeline row's box model exactly.

function ActivitySkeleton({ isLast }: { isLast: boolean }) {
  const shimmer: React.CSSProperties = {
    background: 'var(--color-border-subtle)',
    borderRadius: 4,
    opacity: 0.5,
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      paddingBottom: isLast ? 0 : 14,
      position: 'relative',
    }}>
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: 6,
          top: 16,
          bottom: 0,
          width: 1,
          background: 'var(--color-border-subtle)',
        }} />
      )}

      <div style={{
        width: 13,
        height: 13,
        borderRadius: '50%',
        background: 'var(--color-border-subtle)',
        flexShrink: 0,
        marginTop: 1,
        zIndex: 1,
      }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ ...shimmer, width: '60%', height: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ ...shimmer, width: 50, height: 11 }} />
          <div style={{ ...shimmer, width: 40, height: 10 }} />
        </div>
      </div>
    </div>
  )
}