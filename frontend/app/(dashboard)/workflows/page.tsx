'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { WorkflowExecutionPanel } from '@/components/workflow/workflow-execution-panel';
import { GitBranch, Plus, Layers, Sparkles, ScanLine, Palette, Copy } from 'lucide-react';
import { fetchJobs } from '@/lib/job-service';

const WORKFLOW_TEMPLATES = [
  { name: 'AI Upscale', desc: '4× super-resolution with detail enhancement', icon: <Layers size={20} />, color: 'var(--color-accent)', bg: 'var(--color-accent-dim)' },
  { name: 'Face Restore', desc: 'Portrait enhancement and facial detail reconstruction', icon: <Sparkles size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { name: 'Anime Cleanup', desc: 'Upscale and denoise anime & illustration art', icon: <Palette size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { name: 'Batch Denoise', desc: 'Remove noise and artifacts from batch images', icon: <ScanLine size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
];

function TemplateCard({ t, active, onClick }: { t: typeof WORKFLOW_TEMPLATES[0]; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--color-bg-card)',
      border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 16,
      cursor: 'pointer',
      boxShadow: active ? '0 0 0 1px var(--color-accent-dim), 0 0 28px rgba(var(--color-accent-rgb),0.25)' : 'var(--color-accent-glow)',
      transition: 'all 0.18s ease',
    }}
    onMouseEnter={e => { const el = e.currentTarget; if (!active) { el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)' } }}
    onMouseLeave={e => { const el = e.currentTarget; if (!active) { el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, color: t.color }}>
          {t.icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{t.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{t.desc}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>ONNX</span>
        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>GPU</span>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [view, setView] = useState<'templates' | 'builder'>('templates');
  const [totalJobs, setTotalJobs] = useState<number | null>(null);

  useEffect(() => {
    if (view === 'templates') {
      fetchJobs({ size: 1 }).then((r) => setTotalJobs(r.total)).catch(() => {});
    }
  }, [view]);

  return (
    <PageContainer>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {view === 'templates' ? 'Workflow Builder' : 'Pipeline Editor'}
          </h1>
          <p style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            {view === 'templates' ? 'Choose a template or create a custom AI pipeline.' : 'Configure and run your AI processing pipeline.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {view === 'builder' && (
            <button onClick={() => setView('templates')} style={{
              height: 40, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: '1px solid var(--color-border-default)', borderRadius: 10,
              color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer',
              fontWeight: 500, transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.05)'; el.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = 'var(--color-text-secondary)' }}
            >
              <GitBranch size={15} /> Templates
            </button>
          )}
          {view === 'templates' && (
            <button onClick={() => setView('builder')} style={{
              height: 40, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--color-accent-gradient)',
          border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer',
          fontWeight: 600, boxShadow: 'var(--color-accent-button-glow)',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-glow-hover)'; el.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-button-glow)'; el.style.transform = 'none' }}
            >
              <Plus size={15} /> New Workflow
            </button>
          )}
        </div>
      </div>

      {view === 'templates' ? (
        <>
          {/* Template cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {WORKFLOW_TEMPLATES.map(t => (
              <TemplateCard key={t.name} t={t} active={selectedTemplate === t.name} onClick={() => { setSelectedTemplate(t.name); setView('builder'); }} />
            ))}
          </div>

          {/* Info cards row */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
            <div style={{
              flex: 1, background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)', padding: 16,
              boxShadow: 'var(--color-accent-glow)',
            }}>
              <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Workflow Runs</p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{totalJobs != null ? totalJobs.toLocaleString() : '—'}</p>
            </div>
          </div>

          {/* Recent workflows */}
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 20,
            boxShadow: 'var(--color-accent-glow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <GitBranch size={16} style={{ color: 'var(--color-accent)' }} />
              <p style={{ margin: 0, fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Workflow History</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {totalJobs != null && totalJobs > 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: 8 }}>
                  {totalJobs} workflow{totalJobs !== 1 ? 's' : ''} processed. View full history on the <a href="/jobs" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Jobs page</a>.
                </p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: 8 }}>No workflow runs yet. Select a template to get started.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <WorkflowExecutionPanel />
      )}
    </PageContainer>
  );
}
