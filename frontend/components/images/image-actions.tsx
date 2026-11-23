'use client';

import React from 'react';
import { Eye, Download, Trash2, RefreshCw, GitBranch, Sparkles } from 'lucide-react';

interface ImageActionsProps {
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onReprocess: () => void;
  onOpenInWorkflow: () => void;
}

function ActionBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  const [h, setH] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', borderRadius: 7, cursor: 'pointer',
        background: h ? (danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)') : 'transparent',
        color: danger && h ? '#ef4444' : h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        transition: 'all 0.15s ease',
      }}
    >
      {icon}
    </button>
  );
}

export function ImageActions({
  onView,
  onDownload,
  onDelete,
  onReprocess,
  onOpenInWorkflow,
}: ImageActionsProps) {
  return (
    <>
      <ActionBtn icon={<Eye size={15} />} title="View details" onClick={onView} />
      <ActionBtn icon={<Download size={15} />} title="Download" onClick={onDownload} />
      <ActionBtn icon={<Sparkles size={15} />} title="Enhance in Workflow Builder" onClick={onOpenInWorkflow} />
      <ActionBtn icon={<RefreshCw size={15} />} title="Reprocess" onClick={onReprocess} />
      <ActionBtn icon={<Trash2 size={15} />} title="Delete" onClick={onDelete} danger />
    </>
  );
}
