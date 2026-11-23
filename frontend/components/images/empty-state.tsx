'use client';

import { UploadCloud } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
      <div style={{
        marginBottom: 24, width: 64, height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'center', borderRadius: 16, background: 'var(--color-accent-dim)',
        boxShadow: '0 0 16px 0 var(--color-accent-dim)',
      }}>
        <UploadCloud size={32} style={{ color: 'var(--color-accent)' }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
        No images yet
      </h3>
      <p style={{ marginTop: 8, maxWidth: 320, fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
        Upload your first image to get started with AI-powered enhancement.
      </p>
      <button
        onClick={onUploadClick}
        style={{
          marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
          height: 44, padding: '0 24px',
          background: 'var(--color-accent-gradient)',
          border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600,
          fontFamily: 'var(--font-body)', cursor: 'pointer',
          boxShadow: 'var(--color-accent-button-glow)',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-glow-hover)'; el.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-button-glow)'; el.style.transform = 'none'; }}
      >
        <UploadCloud size={16} />
        Upload Image
      </button>
    </div>
  );
}
