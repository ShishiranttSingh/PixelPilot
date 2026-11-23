'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import {
  IconCreditCard,
  IconImages,
  IconClock,
  IconActivity,
  IconFolder,
  IconWorkflow,
  IconSparkles,
} from '@/components/dashboard/ui';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { formatProcessingTime, recentImageThumbs } from '@/lib/dashboard-helpers';
import { HeroSection } from '@/components/dashboard/hero-section';
import { StatsRow, type StatCardData } from '@/components/dashboard/stats-row';
import { DashboardWorkspace } from '@/components/dashboard/dashboard-workspace';
import { BottomWidgets, type WidgetData } from '@/components/dashboard/bottom-widgets';
import { ComparisonViewer } from '@/components/workflow/comparison-viewer';
import type { Image as ImageType, Stage, WorkflowDetail } from '@/lib/types';
import { getWorkflow } from '@/lib/workflow-service';
import { trackWorkflow, getApiErrorMessage, getHttpStatus, type WorkflowTracker } from '@/lib/workflow-tracker';

export default function Dashboard() {
  const router = useRouter();
  const { addToast } = useToast();
  const data = useDashboardData();
  const user = data.user;
  const creditsRemaining = data.creditsRemaining ?? null;
  const totalImages = data.totalImages ?? null;
  const avgTime = data.avgTime ?? null;
  const systemHealth: string | null = data.systemHealth;
  const recentActivity = data.recentActivity;
  const recentImages = data.recentImages.length > 0 ? data.recentImages : [];
  const recentJobs = data.recentJobs.length > 0 ? data.recentJobs : [];
  const refetch = data.refetch;

  const [uploading, setUploading] = React.useState(false);
  const [currentImage, setCurrentImage] = React.useState<ImageType | null>(null);
  const [stages, setStages] = React.useState<Stage[]>([]);
  const [jobStatus, setJobStatus] = React.useState<string>('idle');
  const [progress, setProgress] = React.useState(0);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const trackerRef = React.useRef<WorkflowTracker | null>(null);

  React.useEffect(() => {
    return () => trackerRef.current?.stop();
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/images/upload', formData);
      setCurrentImage(res.data.data.image);
      setStages(res.data.data.recommendations.map((s: Stage) => ({ ...s, enabled: true })));
      setJobStatus('idle');
      refetch();
      router.push(`/workflows?imageId=${res.data.data.image.id}`);
    } catch {
      addToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const executeWorkflow = async () => {
    setJobStatus('processing');
    setProgress(0);
    setResultUrl(null);
    try {
      const res = await api.post('/workflows', {
        image_id: currentImage?.id,
        config: stages.filter((s) => s.enabled),
      });
      // Poll the backend (the source of truth) until the workflow is terminal.
      trackerRef.current?.stop();
      trackerRef.current = trackWorkflow<WorkflowDetail>({
        workflowId: res.data.data.id,
        fetchWorkflow: getWorkflow,
        onUpdate: (snap) => setProgress(snap.progress),
        onTerminal: (snap) => {
          if (snap.status === 'completed') {
            setResultUrl(snap.outputUrl);
            setJobStatus('completed');
            refetch();
          } else {
            setJobStatus('idle');
            if (snap.status === 'failed') addToast(snap.error ?? 'Workflow failed', 'error');
            else addToast('Workflow cancelled', 'info');
          }
        },
        onGiveUp: (failure) => {
          setJobStatus('idle');
          addToast(failure.message, 'error');
        },
      });
    } catch (err: unknown) {
      setJobStatus('idle');
      const msg = getApiErrorMessage(err)
        ?? (getHttpStatus(err) === 402 ? 'Insufficient credits' : 'Workflow execution failed');
      addToast(msg, 'error');
    }
  };

  const handleToggle = (idx: number) => {
    const newStages = [...stages];
    newStages[idx].enabled = !newStages[idx].enabled;
    setStages(newStages);
  };
  const isHealthy = systemHealth === "healthy";
  const statCards: StatCardData[] = [
    {
      icon: <IconCreditCard />,
      iconColor: 'var(--color-accent-blue)',
      iconBg: 'var(--color-accent-blue-dim)',
      label: 'Credits Remaining',
      value: creditsRemaining != null ? creditsRemaining.toLocaleString() : '—',
      subtext: 'Rolling monthly',
    },
    {
      icon: <IconImages />,
      iconColor: 'var(--color-accent-purple)',
      iconBg: 'var(--color-accent-purple-dim)',
      label: 'Images Enhanced',
      value: totalImages != null ? totalImages.toLocaleString() : '—',
      subtext: 'Across all projects',
    },
    {
      icon: <IconClock />,
      iconColor: 'var(--color-warning)',
      iconBg: 'var(--color-warning-dim)',
      label: 'Avg Processing Time',
      value: avgTime != null ? formatProcessingTime(avgTime) : '—',
      subtext: 'Last 30 days',
    },
    {
      icon: <IconActivity />,
      iconColor: "var(--color-success)",
      iconBg: "var(--color-success-dim)",
      label: "System Status",
      value: isHealthy ? "Operational" : "Degraded",
      subtext: isHealthy ? "All services running" : "Issues detected",
      subtextColor: isHealthy
        ? "var(--color-success)"
        : "var(--color-warning)",
    }
  ];

  const { visible: projectThumbs, remaining: extraProjects } = recentImageThumbs(recentImages);

  const widgets: WidgetData[] = [
    {
      icon: <IconFolder />,
      iconColor: 'var(--color-accent-blue)',
      iconBg: 'var(--color-accent-blue-dim)',
      title: 'Saved Projects',
      subtitle: `${recentImages.length} uploaded images`,
      count: String(totalImages ?? 0),
      preview: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {projectThumbs.map((img) => (
            <div
              key={img.id}
              style={{
                height: 32, width: 44, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: 'white',
                overflow: 'hidden', backgroundSize: 'cover', backgroundPosition: 'center',
                backgroundColor: 'var(--color-accent)',
                backgroundImage: img.thumbnail_url ? `url(${img.thumbnail_url})` : undefined,
                flexShrink: 0,
              }}
            >
              {!img.thumbnail_url && (img.filename[0]?.toUpperCase() || '?')}
            </div>
          ))}
          {extraProjects > 0 && (
            <div style={{
              height: 32, width: 44, borderRadius: 8,
              border: '1px dashed var(--color-border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0,
            }}>
              +{extraProjects}
            </div>
          )}
        </div>
      ),
    },
    {
      icon: <IconWorkflow />,
      iconColor: 'var(--color-accent-purple)',
      iconBg: 'var(--color-accent-purple-dim)',
      title: 'Saved Workflows',
      subtitle: 'Recent job pipelines',
      count: String(recentJobs.length),
      preview: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {recentJobs.length > 0 ? (
            recentJobs.slice(0, 3).map((j) => (
              <span key={j.id} style={{
                borderRadius: 8, padding: '5px 12px', fontSize: 11.5,
                fontFamily: 'var(--font-mono)', fontWeight: 500,
                maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                color: 'var(--color-accent-purple)', backgroundColor: 'var(--color-accent-purple-dim)',
              }}>
                {j.stages[0] ?? j.status}
              </span>
            ))
          ) : (
            <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>No workflows yet</p>
          )}
        </div>
      ),
    },
    {
      icon: <IconSparkles />,
      iconColor: 'var(--color-warning)',
      iconBg: 'var(--color-warning-dim)',
      title: 'AI Recommendations',
      subtitle: 'Personalized suggestions',
      count: '3',
      preview: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Try batch upscale on unprocessed images',
            'Face Restore improves portrait quality',
            'Denoise before upscale for best results',
          ].map((text) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                marginTop: 3, height: 5, width: 5, flexShrink: 0,
                borderRadius: '50%', backgroundColor: 'var(--color-warning)',
              }} />
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      <HeroSection
        username={user?.username ?? 'there'}
        creditsRemaining={creditsRemaining}
        totalImages={totalImages}
        totalJobs={recentJobs.length > 0 ? recentJobs.length : null}
        avgTime={avgTime}
        onNewEnhancement={() => router.push('/workflows')}
        onImportImages={() => router.push('/images?upload=true')}
      />

      <StatsRow cards={statCards} />

      <main style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 24px', gap: 32 }}>
        <DashboardWorkspace
          currentImage={currentImage}
          jobStatus={jobStatus}
          progress={progress}
          resultUrl={resultUrl}
          uploading={uploading}
          stages={stages}
          activity={recentActivity}
          onToggle={handleToggle}
          onExecute={executeWorkflow}
          onUpload={uploadFile}
        />

        {currentImage && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: 24,
              display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: 'var(--color-accent-glow)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Before & After Comparison
              </div>
              {jobStatus === 'completed' && resultUrl ? (
                <ComparisonViewer beforeUrl={currentImage.original_url} afterUrl={resultUrl} />
              ) : (
                <div style={{
                  aspectRatio: '16/9', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 14,
                }}>
                  Run a workflow to see comparison
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomWidgets widgets={widgets} />
    </div>
  );
}