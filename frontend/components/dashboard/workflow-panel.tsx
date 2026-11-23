'use client';

import { PipelineCard } from './pipeline-card';
import { ActivityCard, type ActivityItemData } from './activity-card';
import type { Stage } from '@/lib/types';

interface WorkflowPanelProps {
  stages: Stage[];
  onToggle: (idx: number) => void;
  onExecute: () => void;
  running: boolean;
  activity: ActivityItemData[];
}

export function WorkflowPanel({ stages, onToggle, onExecute, running, activity }: WorkflowPanelProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: 520,
    }}>
      <PipelineCard
        stages={stages}
        onToggle={onToggle}
        onExecute={onExecute}
        running={running}
      />
      <ActivityCard items={activity} />
    </div>
  );
}