'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageIcon, CheckCircle2 } from 'lucide-react';
import type { ImageListItem } from '@/lib/types';

interface WorkflowSelectorProps {
  images: ImageListItem[];
  selectedId: string | null;
  onSelect: (image: ImageListItem) => void;
}

export function WorkflowSelector({ images, selectedId, onSelect }: WorkflowSelectorProps) {
  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--color-accent-glow)',
      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={16} /> Select Image
        </h3>
      </div>
      <ScrollArea className="max-h-80">
        <div>
          {images.length === 0 && (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              No images available. Upload an image first.
            </p>
          )}
          {images.map((img) => {
            const isSelected = selectedId === img.id;
            return (
              <button
                key={img.id}
                onClick={() => onSelect(img)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', border: 'none', borderBottom: '1px solid var(--color-border-subtle)',
                  background: isSelected ? 'var(--color-accent-dim)' : 'transparent',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                  cursor: 'pointer', transition: 'background 0.15s ease', textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 40, height: 40, flexShrink: 0, overflow: 'hidden', borderRadius: 8, background: 'var(--color-bg-elevated)' }}>
                  {img.thumbnail_url ? (
                    <img src={img.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.filename}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{img.width}×{img.height}</p>
                </div>
                {isSelected && <CheckCircle2 size={20} style={{ flexShrink: 0, color: 'var(--color-accent)' }} />}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
