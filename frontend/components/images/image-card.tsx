'use client';

import React from 'react';
import { ImageActions } from '@/components/images/image-actions';
import type { ImageListItem } from '@/lib/types';

interface ImageCardProps {
  image: ImageListItem;
  onView: (image: ImageListItem) => void;
  onDownload: (image: ImageListItem) => void;
  onDelete: (image: ImageListItem) => void;
  onReprocess: (image: ImageListItem) => void;
  onOpenInWorkflow: (image: ImageListItem) => void;
}

const statusConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:    { label: 'Pending',    bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  processing: { label: 'Processing', bg: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: 'var(--color-accent-dim)' },
  completed:  { label: 'Completed',  bg: 'var(--color-success-dim)', color: 'var(--color-success)', border: 'var(--color-success-dim)' },
  failed:     { label: 'Failed',     bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageCard({
  image,
  onView,
  onDownload,
  onDelete,
  onReprocess,
  onOpenInWorkflow,
}: ImageCardProps) {
  const status = statusConfig[image.status] || statusConfig.completed;
  const [hover, setHover] = React.useState(false);

  return (
    <div
      style={{
        overflow: 'hidden', borderRadius: 'var(--radius-lg)',
        border: '1px solid', borderColor: hover ? 'var(--color-border-default)' : 'var(--color-border-subtle)',
        background: 'var(--color-bg-card)',
        boxShadow: hover ? 'var(--color-accent-glow-hover)' : 'var(--color-accent-glow)',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--color-bg-elevated)', cursor: 'pointer' }}
        onClick={() => onView(image)}
      >
        {image.thumbnail_url ? (
          <img
            src={image.thumbnail_url}
            alt={image.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', transform: hover ? 'scale(1.05)' : 'none' }}
            loading="lazy"
          />
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span style={{
          position: 'absolute', left: 8, top: 8, borderRadius: 6, border: '1px solid', borderColor: status.border,
          padding: '1px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          background: status.bg, color: status.color,
        }}>
          {status.label}
        </span>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={image.filename}>
          {image.filename}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
          <span>{formatDate(image.created_at)}</span>
          <span>{image.width}×{image.height}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
          <span>{formatSize(image.size_bytes)}</span>
          <span>.{image.format}</span>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 0,
        borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-elevated)', padding: '6px 8px',
        opacity: hover ? 1 : 0, transition: 'opacity 0.18s ease',
      }}>
        <ImageActions
          onView={() => onView(image)}
          onDownload={() => onDownload(image)}
          onDelete={() => onDelete(image)}
          onReprocess={() => onReprocess(image)}
          onOpenInWorkflow={() => onOpenInWorkflow(image)}
        />
      </div>
    </div>
  );
}
