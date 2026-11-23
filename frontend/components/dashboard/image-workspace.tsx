'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { DashboardSwitch } from './ui/dashboard-switch';
import type { Image as ImageType, Stage } from '@/lib/types';
import {
  IconFile,
  IconZoomIn,
  IconZoomOut,
  IconDownload,
  IconFullscreen,
  IconUploadCloud,
} from './ui';

interface ImageWorkspaceProps {
  currentImage: ImageType | null;
  jobStatus: string;
  progress: number;
  resultUrl: string | null;
  uploading: boolean;
  stages: Stage[];
  onUpload: (file: File) => void;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

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
  );
}

function ProcessingBadge() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 10px',
      background: 'var(--color-success-dim)',
      border: '1px solid var(--color-success-dim)',
      borderRadius: 8,
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--color-success)',
      }} />
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', fontWeight: 500 }}>
        Enhancement Complete
      </span>
    </div>
  );
}

function UploadDropTarget({ uploading, progress, onUpload }: { uploading: boolean; progress: number; onUpload: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={dropRef}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onUpload(file);
      }}
      style={{
        borderRadius: 24,
        border: '2px dashed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 440,
        padding: 40,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        borderColor: dragOver ? 'var(--color-accent)' : 'rgba(255,255,255,0.09)',
        backgroundColor: dragOver ? 'var(--color-accent-dim)' : 'var(--color-bg-card)',
        boxShadow: dragOver ? 'var(--color-accent-glow-hover)' : 'var(--color-accent-glow)',
      }}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.png,.jpg,.jpeg,.webp';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) onUpload(file);
        };
        input.click();
      }}
    >
      {/* Inner placeholder box */}
      <div style={{
        width: 240,
        height: 240,
        border: '1px dashed var(--color-accent-dim)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(var(--color-accent-rgb),0.06) 0%, rgba(139,92,246,0.04) 50%, rgba(var(--color-accent-rgb),0.02) 100%)',
      }}>
        <div style={{
          width: 68,
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 24,
          marginBottom: 16,
          backgroundColor: 'var(--color-accent-dim)',
        }}>
          <div style={{ color: 'var(--color-accent-blue)' }}>
            <IconUploadCloud />
          </div>
        </div>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, marginBottom: 6 }}>Drop image here</p>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--color-text-muted)' }}>or click to upload</p>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>PNG, JPEG, or WebP up to 50 MB</p>
      {uploading && (
        <div style={{ marginTop: 20, width: 280 }}>
          <Progress value={progress} style={{ height: 5 }} />
          <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 6 }}>Uploading... {progress}%</p>
        </div>
      )}
    </div>
  );
}

function ControlBtn({ children, onClick, label, style }: { children: React.ReactNode; onClick?: () => void; label?: string; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 7,
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ...style,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(255,255,255,0.07)';
        el.style.color = 'var(--color-text-primary)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'transparent';
        el.style.color = 'var(--color-text-secondary)';
      }}
    >
      {children}
    </button>
  );
}

export function ImageWorkspace({
  currentImage,
  jobStatus,
  progress,
  resultUrl,
  uploading,
  stages,
  onUpload,
}: ImageWorkspaceProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(z => Math.min(200, z + 10));
  const handleZoomOut = () => setZoom(z => Math.max(50, z - 10));

  const handleDownload = () => {
    const url = jobStatus === 'completed' && resultUrl ? resultUrl : currentImage?.original_url;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = currentImage?.filename || 'image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentImage) {
    return <UploadDropTarget uploading={uploading} progress={progress} onUpload={onUpload} />;
  }

  const fileTags = [
    ...(currentImage.width ? [{ label: `${currentImage.width} × ${currentImage.height}` }] : []),
    ...(currentImage.size_bytes ? [{ label: `${(currentImage.size_bytes / 1024 / 1024).toFixed(1)} MB` }] : []),
    ...(stages.some((s) => s.plugin === 'upscale' && s.enabled)
      ? [{ label: '4× Upscale', color: 'var(--color-accent-blue)', bg: 'var(--color-accent-blue-dim)' as string }]
      : []),
  ];

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      boxShadow: 'var(--color-accent-glow)',

    }}
    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)' }}

    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 10,
          }}>
            <IconFile />
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {currentImage.filename || 'image'}
            </span>
          </div>
          {fileTags.map((tag) => (
            <FileTag key={tag.label} {...tag} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {jobStatus === 'processing' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              background: 'var(--color-accent-dim)',
              border: '1px solid var(--color-accent-dim)',
              borderRadius: 8,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--color-accent-blue)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-blue)', fontWeight: 500 }}>
                Processing...
              </span>
            </div>
          ) : jobStatus === 'completed' ? (
            <ProcessingBadge />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                Ready
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Original image viewer */}
      <div style={{ aspectRatio: '16/9', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
        {jobStatus === 'processing' ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 48,
          }}>
            <p style={{ fontWeight: 500, marginBottom: 16, color: 'var(--color-text-primary)' }}>Analyzing & Enhancing...</p>
            <Progress value={progress} style={{ height: 6, width: '100%', maxWidth: 400 }} />
          </div>
        ) : currentImage.original_url ? (
          <Image
            src={currentImage.original_url}
            alt={currentImage.filename || 'Original image'}
            fill
            className="object-contain"
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>Original Image Ready</p>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
      }}>
        {/* Left: file info */}
        <div style={{ display: 'flex', gap: 24 }}>
          <InfoItem label="Output size" value="21,888 × 14,592 px" />
          <InfoItem label="Processing time" value="1.2s" />
          <InfoItem label="Enhancement" value="4× Upscale + Denoise + Sharpen" />
        </div>

        {/* Right: zoom + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Zoom controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <ControlBtn onClick={handleZoomOut} style={{ width: 36, height: 36 }}><IconZoomOut /></ControlBtn>
            <span style={{
              padding: '0 10px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              minWidth: 44,
              textAlign: 'center',
            }}>{zoom}%</span>
            <ControlBtn onClick={handleZoomIn} style={{ width: 36, height: 36 }}><IconZoomIn /></ControlBtn>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--color-border-subtle)' }} />

          <ControlBtn label="Download" onClick={handleDownload} style={{ width: 36, height: 36 }}><IconDownload /></ControlBtn>
          <ControlBtn label="Fullscreen" style={{ width: 36, height: 36 }}><IconFullscreen /></ControlBtn>
        </div>
      </div>
    </div>
  );
}