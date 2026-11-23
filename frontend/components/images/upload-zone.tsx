'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useToast } from '@/context/toast-context';
import { uploadImage } from '@/lib/image-service';
import { UploadCloud, X, File, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ImageListItem } from '@/lib/types';

interface UploadZoneProps {
  onUploadComplete: (image: ImageListItem) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE_MB = 50;

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const { addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported file type. Only PNG, JPEG, and WebP are allowed.';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File exceeds ${MAX_SIZE_MB} MB limit.`;
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      addToast(error, 'error');
      return;
    }

    setCurrentFile(file);
    setPhase('uploading');
    setUploading(true);
    setProgress(0);

    try {
      const payload = await uploadImage(file, (pct) => {
        setProgress(pct);
      });

      setPhase('success');
      addToast('Image uploaded successfully', 'success');
      onUploadComplete(payload.image);

      setTimeout(() => {
        setPhase('idle');
        setCurrentFile(null);
        setUploading(false);
        setProgress(0);
      }, 2000);
    } catch {
      setPhase('error');
      setUploading(false);
      addToast('Upload failed. Please try again.', 'error');
    }
  }, [validateFile, addToast, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (phase === 'idle') inputRef.current?.click();
  }, [phase]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  const handleRetry = useCallback(() => {
    setPhase('idle');
    setCurrentFile(null);
    setUploading(false);
    setProgress(0);
  }, []);

  const handleCancel = useCallback(() => {
    setPhase('idle');
    setCurrentFile(null);
    setUploading(false);
    setProgress(0);
  }, []);

  const getBorderColor = () => {
    if (phase === 'success') return 'var(--color-success)';
    if (phase === 'error') return '#ef4444';
    if (dragOver) return 'var(--color-accent)';
    return 'var(--color-border-default)';
  };

  const getBgColor = () => {
    if (phase === 'success') return 'var(--color-success-dim)';
    if (phase === 'error') return 'rgba(239,68,68,0.05)';
    if (dragOver) return 'var(--color-accent-dim)';
    return 'var(--color-bg-card)';
  };

  const getShadow = () => {
    if (dragOver) return 'var(--color-accent-glow-hover)';
    return 'var(--color-accent-glow)';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        position: 'relative',
        cursor: phase === 'idle' ? 'pointer' : 'default',
        borderRadius: 20,
        border: '2px dashed',
        borderColor: getBorderColor(),
        backgroundColor: getBgColor(),
        boxShadow: getShadow(),
        padding: 32,
        textAlign: 'center',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (phase === 'idle') {
          const el = e.currentTarget;
          el.style.borderColor = 'var(--color-accent)';
          el.style.boxShadow = 'var(--color-accent-glow-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (phase === 'idle' && !dragOver) {
          const el = e.currentTarget;
          el.style.borderColor = 'var(--color-border-default)';
          el.style.boxShadow = 'var(--color-accent-glow)';
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {phase === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 16, background: 'var(--color-accent-dim)',
            boxShadow: '0 0 14px 0 var(--color-accent-dim)',
          }}>
            <UploadCloud size={28} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', margin: 0 }}>
              Drop image here or click to upload
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
              PNG, JPEG, or WebP up to {MAX_SIZE_MB} MB
            </p>
          </div>
        </div>
      )}

      {phase === 'uploading' && currentFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 16, background: 'var(--color-accent-dim)',
          }}>
            <File size={28} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div style={{ width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentFile.name}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 8px' }}>
              Uploading... {progress}%
            </p>
            <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'var(--color-accent-gradient-horiz)',
                borderRadius: 99, width: `${progress}%`, transition: 'width 0.2s ease',
              }} />
            </div>
          </div>
          <button
            onClick={handleCancel}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px',
              border: 'none', borderRadius: 8, background: 'transparent',
              color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <X size={14} /> Cancel
          </button>
        </div>
      )}

      {phase === 'success' && currentFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 16, background: 'var(--color-success-dim)',
          }}>
            <CheckCircle2 size={28} style={{ color: 'var(--color-success)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-success)', fontFamily: 'var(--font-body)', margin: 0 }}>
            Upload complete
          </p>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 16, background: 'rgba(239,68,68,0.12)',
          }}>
            <AlertCircle size={28} style={{ color: '#ef4444' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#ef4444', fontFamily: 'var(--font-body)', margin: 0 }}>
            Upload failed
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleRetry}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                background: 'var(--color-accent-gradient)', border: 'none', borderRadius: 10,
                color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Try Again
            </button>
            <button
              onClick={handleCancel}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                background: 'transparent', border: '1px solid var(--color-border-default)',
                borderRadius: 10, color: 'var(--color-text-secondary)', fontSize: 13,
                fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
