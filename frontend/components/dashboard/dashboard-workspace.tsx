import { ImageWorkspace } from './image-workspace';
import { WorkflowPanel } from './workflow-panel';
import type { ActivityItemData } from './activity-card';
import type { Image, Stage } from '@/lib/types';

interface DashboardWorkspaceProps {
  currentImage: Image | null;
  jobStatus: string;
  progress: number;
  resultUrl: string | null;
  uploading: boolean;
  stages: Stage[];
  activity: ActivityItemData[];
  onToggle: (idx: number) => void;
  onExecute: () => void;
  onUpload: (file: File) => void;
}

export function DashboardWorkspace({
  currentImage,
  jobStatus,
  progress,
  resultUrl,
  uploading,
  stages,
  activity,
  onToggle,
  onExecute,
  onUpload,
}: DashboardWorkspaceProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: 32,
    }}>
      <ImageWorkspace
        currentImage={currentImage}
        jobStatus={jobStatus}
        progress={progress}
        resultUrl={resultUrl}
        uploading={uploading}
        stages={stages}
        onUpload={onUpload}
      />

      <WorkflowPanel
        stages={stages}
        onToggle={onToggle}
        onExecute={onExecute}
        running={jobStatus === 'processing'}
        activity={activity}
      />
    </div>
  );
}
