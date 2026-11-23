'use client';

import React, { useState, useCallback } from 'react';
import { ComparisonViewer } from '@/components/workflow/comparison-viewer';
import { Download, RotateCcw, ZoomIn, ZoomOut, ExternalLink, BarChart3 } from 'lucide-react';
import type { WorkflowDetail } from '@/lib/types';

interface ResultPanelProps {
  workflow: WorkflowDetail;
  onDownload: () => void;
  onReprocess: () => void;
}

function formatDuration(seconds?: number) {
  if (!seconds) return 'N/A';
  return seconds < 1 ? `${(seconds * 1000).toFixed(0)}ms` : `${seconds.toFixed(1)}s`;
}

function IconBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  const [h, setH] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid', borderColor: h ? 'var(--color-border-strong)' : 'var(--color-border-subtle)',
        borderRadius: 8, cursor: 'pointer',
        background: h ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        transition: 'all 0.15s ease',
      }}
    >
      {icon}
    </button>
  );
}

function ActionBtn({ icon, label, onClick, href }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string }) {
  const [h, setH] = React.useState(false);
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 34,
    padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    fontFamily: 'var(--font-body)', cursor: 'pointer',
    border: '1px solid', borderColor: h ? 'var(--color-border-strong)' : 'var(--color-border-subtle)',
    background: h ? 'rgba(255,255,255,0.06)' : 'transparent',
    color: h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    textDecoration: 'none', transition: 'all 0.15s ease',
  };

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={base} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{icon} {label}</a>;
  }
  return <button onClick={onClick} style={base} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{icon} {label}</button>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)',
      background: 'var(--color-bg-card)', padding: 12,
    }}>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{value}</p>
    </div>
  );
}

export function ResultPanel({ workflow, onDownload, onReprocess }: ResultPanelProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const hasOutput = workflow.status === 'completed' && workflow.output_url;
  const stageMetrics = workflow.meta?.stages ?? [];
  const totalDuration = workflow.meta?.total_duration;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(5, z - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--color-accent-glow)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} /> Results
          </h3>
          <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            {stageMetrics.length} stage{stageMetrics.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ padding: 20 }}>
          {hasOutput ? (
            <div
              style={{
                overflow: 'hidden', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)',
                cursor: isPanning ? 'grabbing' : 'grab',
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.1s ease',
              }}>
                <ComparisonViewer beforeUrl={workflow.image.original_url} afterUrl={workflow.output_url!} />
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', height: 192, alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border-subtle)',
              background: 'var(--color-bg-elevated)',
            }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No results available</p>
            </div>
          )}
        </div>
      </div>

      {hasOutput && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBtn icon={<ZoomIn size={15} />} title="Zoom in" onClick={() => setZoom((z) => Math.min(5, z + 0.25))} />
            <IconBtn icon={<ZoomOut size={15} />} title="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', minWidth: 40 }}>{Math.round(zoom * 100)}%</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <ActionBtn icon={<Download size={15} />} label="Download" onClick={onDownload} />
              <ActionBtn icon={<RotateCcw size={15} />} label="Reprocess" onClick={onReprocess} />
              <ActionBtn icon={<ExternalLink size={15} />} label="Original" href={workflow.image.original_url} />
            </div>
          </div>

          <div style={{
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--color-accent-glow)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                Processing Statistics
              </h3>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <StatBox label="Total Time" value={formatDuration(totalDuration)} />
                <StatBox label="Stages" value={String(stageMetrics.length)} />
                <StatBox label="Credits" value={String(workflow.total_credits)} />
                <StatBox label="Status" value={workflow.status} />
              </div>
              {stageMetrics.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border-subtle)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stage Breakdown</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stageMetrics.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--color-text-primary)' }}>{m.plugin}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {m.error && <span style={{ fontSize: 12, color: '#ef4444' }}>Failed</span>}
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{formatDuration(m.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
