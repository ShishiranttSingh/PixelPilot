//workflow-execution-panel.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/context/toast-context';
import { WorkflowSelector } from '@/components/workflow/workflow-selector';
import { StageConfigurationPanel } from '@/components/workflow/stage-configuration-panel';
import { ProcessingTimeline } from '@/components/workflow/processing-timeline';
import { ProgressCard } from '@/components/workflow/progress-card';
import { ResultPanel } from '@/components/workflow/result-panel';
import { fetchImages, uploadImage } from '@/lib/image-service';
import { createWorkflow, cancelWorkflow, getWorkflow } from '@/lib/workflow-service';
import { getCreditBalance } from '@/lib/credit-service';
import type { ImageListItem, Stage, WorkflowDetail, WorkflowStatus } from '@/lib/types';
import {
  trackWorkflow,
  getHttpStatus,
  getApiErrorMessage,
  type WorkflowTracker,
} from '@/lib/workflow-tracker';
import { UploadCloud, Loader2, ImageIcon, CreditCard } from 'lucide-react';

export function WorkflowExecutionPanel() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const trackerRef = useRef<WorkflowTracker | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageListItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageListItem | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const [status, setStatus] = useState<WorkflowStatus | 'idle'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; giveUp: boolean } | null>(null);

  useEffect(() => {
    fetchImages({ size: 50 })
      .then((r) => {
        setImages(r.items);
        const preselectedId = searchParams.get('imageId');
        if (preselectedId) {
          const match = r.items.find((img) => img.id === preselectedId);
          if (match) {
            setSelectedImage(match);
            const recs = match.analysis_results as Record<string, unknown> | undefined;
            const recommendations = recs?.recommendations as Array<{ plugin: string; reason: string; params: Record<string, unknown> }> | undefined;
            if (recommendations?.length) {
              setStages(recommendations.map((s) => ({ ...s, enabled: true })));
            }
          }
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    getCreditBalance().then(setCredits).catch(() => {});
  }, []);

  useEffect(() => {
    return () => trackerRef.current?.stop();
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const payload = await uploadImage(file);
      setSelectedImage(payload.image);
      setStages(payload.recommendations.map((s: Stage) => ({ ...s, enabled: true })));
      setImages((prev) => [payload.image, ...prev]);
      addToast('Image uploaded', 'success');
    } catch {
      addToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }, [addToast]);

  const handleUploadClick = useCallback(() => {
    uploadInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  }, [handleFileUpload]);

  const handleSelect = useCallback((img: ImageListItem) => {
    setSelectedImage(img);
  }, []);

  const handleToggle = useCallback((idx: number) => {
    setStages((prev) => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  }, []);

  const handleParam = useCallback((idx: number, key: string, value: unknown) => {
    setStages((prev) => prev.map((s, i) =>
      i === idx ? { ...s, params: { ...s.params, [key]: value } } : s
    ));
  }, []);

  // The backend database is the source of truth: poll it until the workflow is
  // terminal. Every state change on screen comes from here.
  const startTracking = useCallback((wfId: string) => {
    trackerRef.current?.stop();
    setNotice(null);
    trackerRef.current = trackWorkflow<WorkflowDetail>({
      workflowId: wfId,
      fetchWorkflow: getWorkflow,
      onUpdate: (snap, wf) => {
        setNotice(null);
        setStatus(snap.status);
        setProgress(snap.progress);
        setCurrentStageIdx(snap.currentStage);
        setDetail(wf);
      },
      onTerminal: (snap) => {
        if (snap.status === 'completed') addToast('Workflow completed', 'success');
        else if (snap.status === 'failed') addToast(snap.error ?? 'Workflow failed', 'error');
        else if (snap.status === 'cancelled') addToast('Workflow cancelled', 'info');
      },
      onTransientError: () => setNotice({ text: 'Connection problem. Retrying…', giveUp: false }),
      onGiveUp: (failure) => {
        setNotice({ text: failure.message, giveUp: true });
        addToast(failure.message, 'error');
      },
    });
  }, [addToast]);

  const execute = useCallback(async () => {
    if (!selectedImage) return;
    const enabled = stages.filter((s) => s.enabled);
    if (enabled.length === 0) { addToast('Enable at least one stage.', 'error'); return; }

    setStatus('pending');
    setProgress(0);
    setCurrentStageIdx(0);
    setDetail(null);
    setNotice(null);

    try {
      const result = await createWorkflow({ image_id: selectedImage.id, config: stages });
      setWorkflowId(result.id);
      setCreditsRemaining(result.credits_remaining);
      startTracking(result.id);
    } catch (err: unknown) {
      setStatus('idle'); // nothing was created, so return to the configuration form
      const msg = getApiErrorMessage(err)
        ?? (getHttpStatus(err) === 402 ? 'Insufficient credits' : 'Failed to start workflow');
      addToast(msg, 'error');
    }
  }, [selectedImage, stages, addToast, startTracking]);

  const handleCancel = useCallback(async () => {
    if (!workflowId) return;
    try {
      await cancelWorkflow(workflowId);
    } catch (err: unknown) {
      if (getHttpStatus(err) === 409) {
        // It finished (or failed) before the cancel arrived: not an error, just
        // show what actually happened.
        addToast('Too late to cancel: the workflow had already finished.', 'info');
      } else {
        addToast(getApiErrorMessage(err) ?? 'Failed to cancel workflow', 'error');
        return;
      }
    }
    // Whatever the outcome, re-read the real status from the server. Restarting
    // tracking also discards any poll that was still in flight.
    startTracking(workflowId);
  }, [workflowId, addToast, startTracking]);

  const reset = useCallback(() => {
    trackerRef.current?.stop();
    setStatus('idle');
    setProgress(0);
    setCurrentStageIdx(0);
    setWorkflowId(null);
    setDetail(null);
    setNotice(null);
  }, []);

  const handleRetry = reset;

  const handleReprocess = useCallback(() => {
    reset();
    setSelectedImage(null);
    setStages([]);
  }, [reset]);

  const handleDownload = useCallback(() => {
    if (!detail?.output_url) return;
    const a = document.createElement('a');
    a.href = detail.output_url;
    a.download = `output-${detail.id}`;
    a.click();
    addToast('Download started', 'info');
  }, [detail, addToast]);

  const isRunning = status === 'processing' || status === 'pending';
  const isDone = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  const hasImage = !!selectedImage;
  const canExecute = hasImage && stages.some((s) => s.enabled);
  const estimatedCost = stages.filter((s) => s.enabled).length * 3;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
      {/* Main column: upload / image preview / result */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {!hasImage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              onClick={handleUploadClick}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                cursor: 'pointer', borderRadius: 20, border: '2px dashed',
                borderColor: 'var(--color-border-default)', padding: 24,
                background: 'var(--color-bg-card)',
                boxShadow: 'var(--color-accent-glow)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-accent)'; el.style.boxShadow = 'var(--color-accent-glow-hover)'; el.style.background = 'var(--color-accent-dim)'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow)'; el.style.background = 'var(--color-bg-card)'; }}
            >
              <input
                ref={uploadInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                style={{ display: 'none' }}
                onChange={handleInputChange}
              />
              {uploading ? (
                <Loader2 size={20} style={{ color: 'var(--color-accent)' }} className="animate-spin" />
              ) : (
                <UploadCloud size={20} style={{ color: 'var(--color-accent)' }} />
              )}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                {uploading ? 'Uploading...' : 'Upload a new image to get started, or select an existing one below'}
              </span>
            </div>
            <WorkflowSelector
              images={images}
              selectedId={null}
              onSelect={handleSelect}
            />
          </div>
        )}

        {hasImage && !isRunning && !isDone && !isFailed && (
          <div style={{
            borderRadius: 20, border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-card)', overflow: 'hidden',
            boxShadow: 'var(--color-accent-glow)',
          }}>
            <div style={{ position: 'relative', aspectRatio: '16 / 10', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedImage.original_url ? (
                <img src={selectedImage.original_url} alt={selectedImage.filename}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : selectedImage.thumbnail_url ? (
                <img src={selectedImage.thumbnail_url} alt={selectedImage.filename}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <ImageIcon size={48} style={{ color: 'var(--color-text-muted)' }} />
              )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedImage.filename}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {selectedImage.width} × {selectedImage.height}
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '4px 10px',
                borderRadius: 6, background: 'var(--color-accent-dim)', color: 'var(--color-accent)',
                textTransform: 'capitalize',
              }}>
                Analysis Ready
              </span>
            </div>
          </div>
        )}

        {(isDone || isFailed) && detail && (
          <ResultPanel
            workflow={detail}
            onDownload={handleDownload}
            onReprocess={handleReprocess}
          />
        )}
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {hasImage && !isRunning && !isDone && !isFailed && !isCancelled && (
          <StageConfigurationPanel
            stages={stages}
            onToggle={handleToggle}
            onParamChange={handleParam}
          />
        )}

        {(isRunning || isDone || isFailed || isCancelled) && workflowId && (
          <ProgressCard
            status={status}
            progress={progress}
            currentStage={stages[currentStageIdx]?.plugin ?? ''}
            onExecute={execute}
            onCancel={handleCancel}
            onRetry={handleRetry}
            errorMessage={detail?.error}
            notice={notice}
            onRecheck={() => { if (workflowId) startTracking(workflowId); }}
          />
        )}

        {(isRunning || isDone || isFailed || isCancelled) && stages.length > 0 && (
          <ProcessingTimeline
            stages={stages.filter((s) => s.enabled)}
            stageMetrics={detail?.meta?.stages ?? null}
            currentStageIndex={currentStageIdx}
            status={status}
          />
        )}

        {hasImage && !isRunning && !isDone && !isFailed && !isCancelled && canExecute && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-dim)',
            }}>
              <CreditCard size={14} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                Cost: <strong style={{ color: 'var(--color-accent)' }}>{estimatedCost}</strong> credits
                {credits != null && (
                  <span> · Balance: <strong style={{ color: credits >= estimatedCost ? 'var(--color-success)' : '#ef4444' }}>{credits}</strong></span>
                )}
              </span>
            </div>
            <button
              onClick={execute}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, height: 48, padding: '0 24px',
                background: 'var(--color-accent-gradient)', border: 'none', borderRadius: 12,
                color: 'white', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)',
                cursor: 'pointer', boxShadow: 'var(--color-accent-button-glow)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-glow-hover)'; el.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.boxShadow = 'var(--color-accent-button-glow)'; el.style.transform = 'none'; }}
            >
              Execute Workflow
            </button>
          </div>
        )}

        {hasImage && !isRunning && !isDone && !isFailed && !isCancelled && (
          <button
            onClick={() => { setSelectedImage(null); setStages([]); }}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            Choose a different image
          </button>
        )}
      </div>
    </div>
  );
}
