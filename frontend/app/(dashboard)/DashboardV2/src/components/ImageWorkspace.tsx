import { useRef, useCallback, useState } from 'react'

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconZoomIn = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
    <path d="M9 9l3 3M5.5 3.5v4M3.5 5.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const IconZoomOut = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
    <path d="M9 9l3 3M3.5 5.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconFullscreen = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M1 4V1h3M9 1h3v3M12 9v3H9M4 12H1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconFile = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M3 1h5l3 3v8H3V1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M8 1v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M5 6.5h4M5 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImageStatus =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'processing'
  | 'completing'
  | 'completed'
  | 'failed'
  | 'cancelled'

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileTag({ label, color, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <span style={{
      fontSize: 11.5,
      fontFamily: 'var(--font-mono)',
      color: color ?? 'var(--color-text-muted)',
      background: bg ?? 'transparent',
      padding: bg ? '2px 8px' : 0,
      borderRadius: bg ? 6 : 0,
    }}>{label}</span>
  )
}

function StatusBadge({ status }: { status: ImageStatus }) {
  const config: Record<ImageStatus, { label: string; color: string; bg: string; border: string; pulse?: boolean }> = {
    idle:       { label: 'No Image',             color: 'var(--color-text-muted)',    bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    uploading:  { label: 'Uploading...',          color: 'var(--color-accent-blue)',   bg: 'var(--color-accent-blue-dim)', border: 'rgba(59,130,246,0.2)', pulse: true },
    analyzing:  { label: 'Analyzing Image...',    color: 'var(--color-accent-purple)', bg: 'rgba(109,92,231,0.12)', border: 'rgba(109,92,231,0.2)', pulse: true },
    processing: { label: 'Enhancing Image...',    color: 'var(--color-accent-blue)',   bg: 'var(--color-accent-blue-dim)', border: 'rgba(59,130,246,0.2)', pulse: true },
    completing: { label: 'Preparing Download...', color: 'var(--color-accent-blue)',   bg: 'var(--color-accent-blue-dim)', border: 'rgba(59,130,246,0.2)', pulse: true },
    completed:  { label: 'Enhancement Complete',  color: 'var(--color-success)',       bg: 'var(--color-success-dim)', border: 'rgba(16,185,129,0.2)' },
    failed:     { label: 'Enhancement Failed',    color: '#f87171',                    bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
    cancelled:  { label: 'Cancelled',             color: 'var(--color-text-muted)',    bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  }
  const c = config[status]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 10px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 8,
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: c.color,
        opacity: c.pulse ? 0.9 : 1,
      }} />
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: c.color, fontWeight: 500 }}>
        {c.label}
      </span>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function ControlBtn({ children, onClick, label, disabled }: { children: React.ReactNode; onClick?: () => void; label?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 7,
        color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        if (disabled) return
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(255,255,255,0.07)'
        el.style.color = 'var(--color-text-primary)'
      }}
      onMouseLeave={e => {
        if (disabled) return
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.color = 'var(--color-text-secondary)'
      }}
    >
      {children}
    </button>
  )
}

// ─── Comparison Slider ────────────────────────────────────────────────────────

interface ComparisonSliderProps {
  originalImageUrl: string
  enhancedImageUrl: string
  zoom: number
}

function ComparisonSlider({ originalImageUrl, enhancedImageUrl, zoom }: ComparisonSliderProps) {
  const [sliderPos, setSliderPos] = useState(0.48)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setSliderPos(x)
  }, [])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const handlePointerCancel = useCallback(() => {
    dragging.current = false
  }, [])

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'center',
    transition: 'transform 0.2s ease',
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: '#0a0b0e',
        userSelect: 'none',
        cursor: dragging.current ? 'ew-resize' : 'default',
      }}
    >
      {/* After (enhanced) — full width base */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <img src={enhancedImageUrl} alt="Enhanced image" style={imgStyle} />
        <div style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          padding: '4px 10px',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 6,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-success)',
          fontWeight: 500,
        }}>ENHANCED</div>
      </div>

      {/* Before (original) — clipped to left */}
      <div style={{
        position: 'absolute',
        inset: 0,
        clipPath: `inset(0 ${(1 - sliderPos) * 100}% 0 0)`,
        overflow: 'hidden',
      }}>
        <img
          src={originalImageUrl}
          alt="Original image before enhancement"
          style={{ ...imgStyle, filter: 'brightness(0.75) saturate(0.55) contrast(0.85)' }}
        />
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.6)',
          fontWeight: 500,
        }}>ORIGINAL</div>
      </div>

      {/* Divider line */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `calc(${sliderPos * 100}% - 1px)`,
        width: 2,
        background: 'rgba(255,255,255,0.85)',
        pointerEvents: 'none',
      }} />

      {/* Drag handle */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPos * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'ew-resize',
          zIndex: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 7H1M4 7L2 5M4 7L2 9M10 7h3M10 7l2-2M10 7l2 2" stroke="#111318" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// ─── Viewer States ────────────────────────────────────────────────────────────

function IdlePlaceholder() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 'var(--radius-md)',
      border: '1px dashed var(--color-border-subtle)',
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity={0.3}>
        <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 26l10-8 8 6 6-4 8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
        No image selected
      </span>
    </div>
  )
}

function ProcessingPlaceholder({ status }: { status: ImageStatus }) {
  const label: Record<string, string> = {
    uploading: 'Uploading image...',
    analyzing: 'Analyzing image...',
    processing: 'Enhancing image...',
    completing: 'Preparing download...',
  }
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border-subtle)',
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '2px solid var(--color-accent-blue)',
        borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
        {label[status] ?? 'Processing...'}
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function FailedPlaceholder() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      background: 'rgba(248,113,113,0.04)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(248,113,113,0.15)',
    }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity={0.6}>
        <circle cx="18" cy="18" r="14" stroke="#f87171" strokeWidth="1.5" />
        <path d="M18 11v8M18 23v2" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 13, color: '#f87171', fontFamily: 'var(--font-body)' }}>Enhancement failed</span>
      <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Please try again</span>
    </div>
  )
}

function CancelledPlaceholder() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 'var(--radius-md)',
      border: '1px dashed var(--color-border-subtle)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Enhancement cancelled</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ImageWorkspaceProps {
  filename: string
  originalImageUrl: string
  enhancedImageUrl?: string
  imageDimensions: string
  outputDimensions?: string
  fileSize: string
  processingTime?: string
  enhancementSummary: string
  enhancementDescription: string
  status: ImageStatus
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onDownload: () => void
  onFullscreen: () => void
}

export default function ImageWorkspace({
  filename,
  originalImageUrl,
  enhancedImageUrl,
  imageDimensions,
  outputDimensions,
  fileSize,
  processingTime,
  enhancementSummary,
  enhancementDescription,
  status,
  zoom,
  onZoomIn,
  onZoomOut,
  onDownload,
  onFullscreen,
}: ImageWorkspaceProps) {
  const isProcessing = ['uploading', 'analyzing', 'processing', 'completing'].includes(status)
  const isCompleted = status === 'completed'
  const hasImage = status !== 'idle'
  const downloadDisabled = !hasImage || isProcessing
  const fullscreenDisabled = !hasImage || isProcessing || status === 'failed' || status === 'cancelled'

  const renderViewer = () => {
    if (status === 'idle') return <IdlePlaceholder />
    if (isProcessing) return <ProcessingPlaceholder status={status} />
    if (status === 'failed') return <FailedPlaceholder />
    if (status === 'cancelled') return <CancelledPlaceholder />
    if (isCompleted && enhancedImageUrl) {
      return (
        <ComparisonSlider
          originalImageUrl={originalImageUrl}
          enhancedImageUrl={enhancedImageUrl}
          zoom={zoom}
        />
      )
    }
    // uploaded but not yet enhanced — show original only
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0a0b0e' }}>
        <img src={originalImageUrl} alt="Uploaded image" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform 0.2s ease' }} />
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: 560,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasImage && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 8,
              }}>
                <IconFile />
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {filename}
                </span>
              </div>
              <FileTag label={imageDimensions} />
              <FileTag label={fileSize} />
              {enhancementSummary && (
                <FileTag label={enhancementSummary} color="var(--color-accent-blue)" bg="var(--color-accent-blue-dim)" />
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Viewer */}
      <div style={{ flex: 1, minHeight: 380, position: 'relative' }}>
        {renderViewer()}
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
      }}>
        {/* Left: file info */}
        <div style={{ display: 'flex', gap: 20 }}>
          {outputDimensions && <InfoItem label="Output size" value={outputDimensions} />}
          {processingTime && <InfoItem label="Processing time" value={processingTime} />}
          {isCompleted && enhancementDescription && (
            <InfoItem label="Enhancement" value={enhancementDescription} />
          )}
          {!isCompleted && !hasImage && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              Upload an image to begin
            </span>
          )}
        </div>

        {/* Right: zoom + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <ControlBtn onClick={onZoomOut} disabled={zoom <= 50}><IconZoomOut /></ControlBtn>
            <span style={{
              padding: '0 8px',
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              minWidth: 40,
              textAlign: 'center',
            }}>{zoom}%</span>
            <ControlBtn onClick={onZoomIn} disabled={zoom >= 200}><IconZoomIn /></ControlBtn>
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--color-border-subtle)' }} />

          <ControlBtn label="Download" onClick={onDownload} disabled={downloadDisabled}><IconDownload /></ControlBtn>
          <ControlBtn label="Fullscreen" onClick={onFullscreen} disabled={fullscreenDisabled}><IconFullscreen /></ControlBtn>
        </div>
      </div>
    </div>
  )
}