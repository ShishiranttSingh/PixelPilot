'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/toast-context';
import { PageContainer } from '@/components/layout/page-container';
import { JobToolbar } from '@/components/jobs/job-toolbar';
import type { JobSortField, JobStatusFilter } from '@/components/jobs/job-toolbar';
import { JobTable } from '@/components/jobs/job-table';
import { JobDetailsDrawer } from '@/components/jobs/job-details-drawer';
import { EmptyState } from '@/components/images/empty-state';
import { fetchJobs, retryJob, cancelJob } from '@/lib/job-service';
import { getHttpStatus } from '@/lib/workflow-tracker';
import type { JobListItem } from '@/lib/types';
import { Play, CheckCircle2, XCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';

const POLL_INTERVAL = 5000;

function SummaryCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string; color: string; bg: string;
}) {
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: 'var(--color-accent-glow)',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)'; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)'; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<JobSortField>('created_at');
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('');
  const [includeFailed, setIncludeFailed] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null);
  const [paused, setPaused] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusParam = useMemo(() => {
    if (statusFilter) return statusFilter;
    return includeFailed ? 'pending,processing,completed,failed' : 'pending,processing,completed';
  }, [statusFilter, includeFailed]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetchJobs({ page, size: 20, sort, status: statusParam, search: debouncedSearch });
      setJobs(res.items);
      setTotal(res.total);
    } catch {
      if (!silent) setError('Failed to load jobs.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, sort, statusParam, debouncedSearch]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    if (paused) return;
    pollTimer.current = setInterval(() => loadJobs(true), POLL_INTERVAL);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [loadJobs, paused]);

  const handleRetry = useCallback(async (job: JobListItem) => {
    try {
      await retryJob(job.id);
      addToast('Job retry initiated', 'info');
      loadJobs(true);
    } catch {
      addToast('Failed to retry job', 'error');
    }
  }, [addToast, loadJobs]);

  const handleCancel = useCallback(async (job: JobListItem) => {
    try {
      await cancelJob(job.id);
      addToast('Job cancelled', 'info');
      loadJobs(true);
    } catch (err) {
      if (getHttpStatus(err) === 409) {
        // Finished before the cancel arrived: say so instead of reporting a failure.
        addToast('Job had already finished, so there was nothing to cancel', 'info');
        loadJobs(true);
      } else {
        addToast('Failed to cancel job', 'error');
      }
    }
  }, [addToast, loadJobs]);

  const handleUploadClick = useCallback(() => {
    router.push('/workflows');
  }, [router]);

  const summaryCounts = {
    running:   jobs.filter(j => j.status === 'processing').length,
    queued:    jobs.filter(j => j.status === 'pending').length,
    failed:    jobs.filter(j => j.status === 'failed').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  const hasJobs = jobs.length > 0;

  return (
    <PageContainer>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Job Summary</h1>
          <p style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>Showing all historical jobs.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setPaused(p => !p)}
            style={{
              height: 40, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: '1px solid var(--color-border-default)', borderRadius: 10,
              color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)',
              cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.05)'; el.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = 'var(--color-text-secondary)'; }}
          >
            {paused ? <Play size={14} /> : <Loader2 size={14} />} {paused ? 'Resume' : 'Pause'} Polling
          </button>
          <button
            onClick={() => loadJobs()}
            style={{
              height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 10,
              color: 'var(--color-text-secondary)', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'var(--color-bg-elevated)'; el.style.color = 'var(--color-text-secondary)'; }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 12 }}>
        <SummaryCard icon={<Play size={18} />}         label="Running"   value={summaryCounts.running.toString()}   color="var(--color-accent)"   bg="var(--color-accent-dim)" />
        <SummaryCard icon={<Clock size={18} />}         label="Queued"    value={summaryCounts.queued.toString()}    color="var(--color-warning)"  bg="var(--color-warning-dim)" />
        <SummaryCard icon={<XCircle size={18} />}       label="Failed"    value={summaryCounts.failed.toString()}    color="#ef4444"               bg="rgba(239,68,68,0.12)" />
        <SummaryCard icon={<CheckCircle2 size={18} />}  label="Completed" value={summaryCounts.completed.toString()} color="var(--color-success)"  bg="var(--color-success-dim)" />
      </div>

      {/* Include failed toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '0 4px' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)',
          userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={includeFailed}
            onChange={e => setIncludeFailed(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)' }}
          />
          Include Failed Jobs
        </label>
      </div>

      {/* Content — master-detail layout (#14) */}
      {hasJobs || loading ? (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Left: table column */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '8px 16px',
              boxShadow: 'var(--color-accent-glow)',
            }}>
              <JobToolbar
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
                <button onClick={() => loadJobs()} style={{ marginLeft: 8, textDecoration: 'underline', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Retry</button>
              </div>
            )}

            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--color-accent-glow)',
            }}>
              <JobTable
                jobs={jobs}
                loading={loading}
                onSelect={setSelectedJob}
                onCancel={handleCancel}
                onRetry={handleRetry}
              />
            </div>

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
                  Page {page} of {totalPages} ({total} jobs)
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-border-subtle)',
                    background: 'var(--color-bg-elevated)',
                    color: page <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    fontSize: 13, fontFamily: 'var(--font-body)',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1,
                  }}>Previous</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-border-subtle)',
                    background: 'var(--color-bg-elevated)',
                    color: page >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    fontSize: 13, fontFamily: 'var(--font-body)',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1,
                  }}>Next</button>
                </div>
              </div>
            )}
          </div>

          {/* Right: persistent detail panel (#6, #14) */}
          <div style={{
            width: 380,
            flexShrink: 0,
            position: 'sticky',
            top: 88, // navbar height (64) + 24px gap
            maxHeight: 'calc(100vh - 112px)',
            overflowY: 'auto',
          }}>
            <JobDetailsDrawer
              job={selectedJob}
              onClose={() => setSelectedJob(null)}
              onRetry={handleRetry}
              onCancel={handleCancel}
              hasJobs={hasJobs}
            />
          </div>

        </div>
      ) : (
        !loading && <EmptyState onUploadClick={handleUploadClick} />
      )}
    </PageContainer>
  );
}