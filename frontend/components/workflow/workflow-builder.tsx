'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings2, Play } from 'lucide-react';
import type { Stage } from '@/lib/types';

export function WorkflowBuilder({ 
  stages, 
  onToggle, 
  onExecute 
}: { 
  stages: Stage[], 
  onToggle: (idx: number) => void,
  onExecute: () => void 
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Recommended Enhancement Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">{stage.plugin}</span>
                  <Badge variant="secondary">Cost: {stage.plugin === 'upscale' ? 5 : 3}c</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{stage.reason}</p>
              </div>
              <Switch 
                checked={stage.enabled} 
                onCheckedChange={() => onToggle(idx)} 
              />
            </div>
          ))}
          
          <Button 
            className="w-full h-12 text-lg font-bold" 
            onClick={onExecute}
            disabled={!stages.some(s => s.enabled)}
          >
            <Play className="mr-2 w-5 h-5" /> Execute Workflow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}