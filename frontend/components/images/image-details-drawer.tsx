'use client';

import React from 'react';
import { Sheet } from '@/components/ui/sheet';
import { Download, Trash2, RefreshCw, GitBranch, Sparkles, Info } from 'lucide-react';
import type { ImageListItem } from '@/lib/types';

interface ImageDetailsDrawerProps {
  image: ImageListItem | null;
  open: boolean;
  onClose: () => void;
  onDownload: (image: ImageListItem) => void;
  onDelete: (image: ImageListItem) => void;
  onReprocess: (image: ImageListItem) => void;
  onOpenInWorkflow: (image: ImageListItem) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusStyles: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:    { label: 'Pending',    bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  processing: { label: 'Processing', bg: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: 'var(--color-accent-dim)' },
  completed:  { label: 'Completed',  bg: 'var(--color-success-dim)', color: 'var(--color-success)', border: 'var(--color-success-dim)' },
  failed:     { label: 'Failed',     bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
};

function DrawerBtn({ icon, label, onClick, variant }: { icon: React.ReactNode; label: string; onClick: () => void; variant?: 'default' | 'danger' | 'ghost' }) {
  const [h, setH] = React.useState(false);
  const getStyle = () => {
    if (variant === 'danger') return {
      background: h ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)',
      color: '#ef4444', border: 'none',
    };
    if (variant === 'ghost') return {
      background: h ? 'rgba(255,255,255,0.06)' : 'transparent',
      color: h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      border: '1px solid', borderColor: h ? 'var(--color-border-strong)' : 'var(--color-border-default)',
    };
    return {
      background: h ? 'var(--color-accent-glow-hover)' : 'var(--color-accent-gradient)',
      color: 'white', border: 'none', boxShadow: 'var(--color-accent-button-glow)',
    };
  };
  const s = getStyle();
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        flex: 1, height: 36, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s ease',
        ...s,
      }}
    >
      {icon} {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 16, maxWidth: 200 }} title={value}>
        {value}
      </span>
    </div>
  );
}

export function ImageDetailsDrawer({
  image,
  open,
  onClose,
  onDownload,
  onDelete,
  onReprocess,
  onOpenInWorkflow,
}: ImageDetailsDrawerProps) {
  if (!image) return null;

  const st = statusStyles[image.status] || statusStyles.completed;

  return (
    <Sheet open={open} onClose={onClose} title={image.filename}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
          {image.thumbnail_url ? (
            <img src={image.thumbnail_url} alt={image.filename} style={{ width: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', height: 192, alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
              No preview available
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Status</span>
            <span style={{
              borderRadius: 6, border: '1px solid', borderColor: st.border,
              padding: '2px 10px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
              background: st.bg, color: st.color, letterSpacing: '0.02em',
            }}>
              {st.label}
            </span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)' }} />
          <DetailRow label="Filename" value={image.filename} />
          <DetailRow label="Uploaded" value={formatDate(image.created_at)} />
          <DetailRow label="Dimensions" value={`${image.width} × ${image.height} px`} />
          <DetailRow label="Format" value={image.format.toUpperCase()} />
          <DetailRow label="Size" value={formatSize(image.size_bytes)} />
          {image.analysis_results && Object.keys(image.analysis_results).length > 0 && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)' }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Analysis & Recommendations
              </p>
              {(() => {
                const analysis = image.analysis_results as Record<string, unknown>;
                const recs = analysis?.recommendations as Array<{ plugin: string; reason: string; params: Record<string, unknown> }> | undefined;
                const props = analysis?.analysis as Record<string, unknown> | undefined;
                return (
                  <>
                    {props && Object.entries(props).map(([key, val]) => (
                      <DetailRow
                        key={key}
                        label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        value={String(val)}
                      />
                    ))}
                    {recs && recs.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Recommended:</span>
                        {recs.map((r, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 8,
                            background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-dim)',
                          }}>
                            <Sparkles size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{r.plugin}</span>
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>{r.reason}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <DrawerBtn icon={<Download size={15} />} label="Download" onClick={() => onDownload(image)} />
          <DrawerBtn icon={<RefreshCw size={15} />} label="Reprocess" onClick={() => onReprocess(image)} variant="ghost" />
          <DrawerBtn icon={<GitBranch size={15} />} label="Workflow" onClick={() => onOpenInWorkflow(image)} variant="ghost" />
          <DrawerBtn icon={<Trash2 size={15} />} label="Delete" onClick={() => onDelete(image)} variant="danger" />
        </div>
      </div>
    </Sheet>
  );
}
