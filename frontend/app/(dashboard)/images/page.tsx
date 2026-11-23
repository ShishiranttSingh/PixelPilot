'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { PageContainer } from '@/components/layout/page-container';
import { ImageGrid } from '@/components/images/image-grid';
import { ImageToolbar } from '@/components/images/image-toolbar';
import type { SortField, StatusFilter } from '@/components/images/image-toolbar';
import { UploadZone } from '@/components/images/upload-zone';
import { EmptyState } from '@/components/images/empty-state';
import { ImageDetailsDrawer } from '@/components/images/image-details-drawer';
import { UploadCloud, ImageIcon, Play } from 'lucide-react';
import { fetchImages, deleteImage, reprocessImage } from '@/lib/image-service';
import type { ImageListItem } from '@/lib/types';

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: 'var(--color-accent-glow)',
      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }}
    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)' }}
    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `var(--${color}-dim)`, color: `var(--${color})`, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
        <p style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>{sub}</p>
      </div>
    </div>
  );
}

const FILTER_TAGS = ['All', 'Completed', 'Processing', 'Failed', 'Pending'];

export default function ImagesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [images, setImages] = useState<ImageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortField>('created_at');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailImage, setDetailImage] = useState<ImageListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchImages({ page, size: pageSize, sort, status: statusFilter, search: debouncedSearch });
      setImages(res.items);
      setTotal(res.total);
    } catch {
      setError('Failed to load images. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, statusFilter, debouncedSearch]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const handleDelete = useCallback(async (image: ImageListItem) => {
    try {
      await deleteImage(image.id);
      setImages((prev) => prev.filter((i) => i.id !== image.id));
      setTotal((prev) => prev - 1);
      addToast('Image deleted', 'success');
      if (detailImage?.id === image.id) setDetailImage(null);
    } catch {
      addToast('Failed to delete image', 'error');
    }
  }, [addToast, detailImage]);

  const handleDownload = useCallback((image: ImageListItem) => {
    const link = document.createElement('a');
    link.href = image.original_url;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Download started', 'info');
  }, [addToast]);

  const handleReprocess = useCallback(async (image: ImageListItem) => {
    try {
      await reprocessImage(image.id);
      addToast('Reprocess started', 'info');
    } catch {
      addToast('Failed to start reprocess', 'error');
    }
  }, [addToast]);

  const handleOpenInWorkflow = useCallback((image: ImageListItem) => {
    router.push(`/workflows?imageId=${image.id}`);
  }, [router]);

  const handleUploadComplete = useCallback((newImage: ImageListItem) => {
    setImages((prev) => [newImage, ...prev]);
    setTotal((prev) => prev + 1);
    setUploadOpen(false);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const statItems = [
    { icon: <ImageIcon size={18} />, label: 'Total Images', value: total.toLocaleString(), sub: 'All time', color: 'color-accent' },
    { icon: <Play size={18} />, label: 'Processing', value: images.filter(i => i.status === 'processing').length.toString(), sub: 'Active jobs', color: 'color-success' },
  ];

  return (
    <PageContainer>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Images Library</h1>
          <p style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>Browse, manage, and enhance your uploaded images.</p>
        </div>
        <button onClick={() => setUploadOpen(true)} style={{
          height: 44, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-accent-gradient)',
          border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600,
          fontFamily: 'var(--font-body)', cursor: 'pointer',
          boxShadow: 'var(--color-accent-button-glow)',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-glow-hover)'; el.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-button-glow)'; el.style.transform = 'none' }}
        >
          <UploadCloud size={16} />
          Upload Image
        </button>
      </div>

      {/* Upload zone */}
      {uploadOpen && <div style={{ marginBottom: 24 }}><UploadZone onUploadComplete={handleUploadComplete} /></div>}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {statItems.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Content area: sidebar filters + main */}
      <div style={{ display: 'flex', gap: 24, flex: 1 }}>
        {/* Sidebar filters */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 16,
            boxShadow: 'var(--color-accent-glow)',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Filters</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FILTER_TAGS.map(tag => (
                <button key={tag} onClick={() => setStatusFilter(tag === 'All' ? '' : tag.toLowerCase() as StatusFilter)} style={{
                  textAlign: 'left', padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'var(--font-body)',
                  background: (tag === 'All' ? !statusFilter : statusFilter === tag.toLowerCase()) ? 'var(--color-accent-dim)' : 'transparent',
                  color: (tag === 'All' ? !statusFilter : statusFilter === tag.toLowerCase()) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontWeight: (tag === 'All' ? !statusFilter : statusFilter === tag.toLowerCase()) ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!((tag === 'All' ? !statusFilter : statusFilter === tag.toLowerCase()))) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!((tag === 'All' ? !statusFilter : statusFilter === tag.toLowerCase()))) e.currentTarget.style.background = 'transparent' }}
                >
                  {tag === 'All' ? 'All Images' : tag}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 16,
            boxShadow: 'var(--color-accent-glow)',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sort By</p>
            {['created_at', 'filename', 'size_bytes'].map(f => (
              <button key={f} onClick={() => setSort(f as SortField)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontFamily: 'var(--font-body)',
                background: sort === f ? 'var(--color-accent-dim)' : 'transparent',
                color: sort === f ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontWeight: sort === f ? 600 : 400,
                transition: 'all 0.15s ease', marginBottom: 2,
              }}
              onMouseEnter={e => { if (sort !== f) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (sort !== f) e.currentTarget.style.background = 'transparent' }}
              >
                {f === 'created_at' ? 'Date Uploaded' : f === 'filename' ? 'File Name' : 'File Size'}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {images.length > 0 || loading ? (
            <>
              <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xl)',
                padding: '8px 16px',
                display: 'flex', alignItems: 'center',
                boxShadow: 'var(--color-accent-glow)',
              }}>
                <ImageToolbar
                  search={search}
                  onSearchChange={setSearch}
                  sort={sort}
                  onSortChange={setSort}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  total={total}
                />
              </div>

              {error && (
                <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', padding: 16, fontSize: 13, color: '#ef4444' }}>
                  {error}
                  <button onClick={loadImages} style={{ marginLeft: 8, textDecoration: 'underline', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Retry</button>
                </div>
              )}

              <ImageGrid
                images={images}
                loading={loading}
                onView={setDetailImage}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onReprocess={handleReprocess}
                onOpenInWorkflow={handleOpenInWorkflow}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '12px 20px',
                  boxShadow: 'var(--color-accent-glow)',
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
                    Page {page} of {totalPages} ({total} images)
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{
                      padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-border-subtle)',
                      background: 'var(--color-bg-elevated)', color: page <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                      fontSize: 13, fontFamily: 'var(--font-body)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1,
                    }}>Previous</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{
                      padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-border-subtle)',
                      background: 'var(--color-bg-elevated)', color: page >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                      fontSize: 13, fontFamily: 'var(--font-body)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1,
                    }}>Next</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            !loading && <EmptyState onUploadClick={() => setUploadOpen(true)} />
          )}
        </div>
      </div>

      <ImageDetailsDrawer
        image={detailImage}
        open={!!detailImage}
        onClose={() => setDetailImage(null)}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onReprocess={handleReprocess}
        onOpenInWorkflow={handleOpenInWorkflow}
      />
    </PageContainer>
  );
}
