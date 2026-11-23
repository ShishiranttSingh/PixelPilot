'use client';

import React from 'react';
import { ImageCard } from '@/components/images/image-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ImageListItem } from '@/lib/types';

interface ImageGridProps {
  images: ImageListItem[];
  loading?: boolean;
  onView: (image: ImageListItem) => void;
  onDownload: (image: ImageListItem) => void;
  onDelete: (image: ImageListItem) => void;
  onReprocess: (image: ImageListItem) => void;
  onOpenInWorkflow: (image: ImageListItem) => void;
}

function SkeletonCard() {
  return (
    <div style={{
      overflow: 'hidden', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-card)',
    }}>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ImageGrid({
  images,
  loading = false,
  onView,
  onDownload,
  onDelete,
  onReprocess,
  onOpenInWorkflow,
}: ImageGridProps) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onView={onView}
          onDownload={onDownload}
          onDelete={onDelete}
          onReprocess={onReprocess}
          onOpenInWorkflow={onOpenInWorkflow}
        />
      ))}
    </div>
  );
}
