'use client';

import React from 'react';
import { Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

export type JobSortField = 'created_at' | 'status' | 'credits' | 'updated';
export type JobStatusFilter = '' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface JobToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: JobSortField;
  onSortChange: (field: JobSortField) => void;
  statusFilter: JobStatusFilter;
  onStatusFilterChange: (status: JobStatusFilter) => void;
  total: number;
}

const sortOptions: { value: JobSortField; label: string }[] = [
  { value: 'created_at', label: 'Newest' },
  { value: 'status', label: 'Status' },
  { value: 'credits', label: 'Credits' },
  { value: 'updated', label: 'Updated' },
];

const statusOptions: { value: JobStatusFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Queued' },
  { value: 'processing', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function ToggleBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  const [h, setH] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '3px 10px', border: 'none', borderRadius: 7, cursor: 'pointer',
        fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
        background: active ? 'var(--color-accent-dim)' : h ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}

export function JobToolbar({
  search, onSearchChange, sort, onSortChange,
  statusFilter, onStatusFilterChange, total,
}: JobToolbarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: '1 1', minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%', height: 36, padding: '0 12px 0 36px',
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)',
              borderRadius: 10, color: 'var(--color-text-primary)',
              fontSize: 13, fontFamily: 'var(--font-body)',
              outline: 'none', transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-default)'; }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            border: '1px solid var(--color-border-subtle)', borderRadius: 10, padding: 4,
          }}>
            <SlidersHorizontal size={14} style={{ marginLeft: 4, color: 'var(--color-text-muted)' }} />
            {statusOptions.map((opt) => (
              <ToggleBtn key={opt.value} active={statusFilter === opt.value} label={opt.label} onClick={() => onStatusFilterChange(opt.value)} />
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            border: '1px solid var(--color-border-subtle)', borderRadius: 10, padding: 4,
          }}>
            <ArrowUpDown size={14} style={{ marginLeft: 4, color: 'var(--color-text-muted)' }} />
            {sortOptions.map((opt) => (
              <ToggleBtn key={opt.value} active={sort === opt.value} label={opt.label} onClick={() => onSortChange(opt.value)} />
            ))}
          </div>

          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
            {total} job{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
