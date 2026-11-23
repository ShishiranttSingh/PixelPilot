'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Settings2, Info } from 'lucide-react';
import { fetchPlugins, type PluginMeta } from '@/lib/plugin-service';
import type { Stage } from '@/lib/types';

interface StageConfigurationPanelProps {
  stages: Stage[];
  onToggle: (idx: number) => void;
  onParamChange: (idx: number, key: string, value: unknown) => void;
}

export function StageConfigurationPanel({
  stages,
  onToggle,
  onParamChange,
}: StageConfigurationPanelProps) {
  const [plugins, setPlugins] = useState<Record<string, PluginMeta>>({});

  useEffect(() => {
    fetchPlugins().then((list) => {
      const map: Record<string, PluginMeta> = {};
      list.forEach((p) => { map[p.id] = p; });
      setPlugins(map);
    }).catch(() => {});
  }, []);

  const totalCost = stages.filter((s) => s.enabled).reduce(
    (sum, s) => sum + (plugins[s.plugin]?.credits ?? 3), 0
  );

  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--color-accent-glow)',
      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings2 size={16} /> Processing Stages
        </h3>
        <Badge variant="secondary">{totalCost} credits</Badge>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {stages.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No stages configured.</p>
        )}
        {stages.map((stage, idx) => {
          const meta = plugins[stage.plugin];
          const params = meta?.params ?? {};
          return (
            <div
              key={idx}
              style={{
                borderRadius: 'var(--radius-md)', border: '1px solid',
                borderColor: stage.enabled ? 'var(--color-border-default)' : 'var(--color-border-subtle)',
                background: stage.enabled ? 'var(--color-bg-card)' : 'var(--color-bg-elevated)',
                opacity: stage.enabled ? 1 : 0.5,
                padding: 14, transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                      {meta?.name ?? stage.plugin}
                    </span>
                    <Badge variant="outline" style={{ fontSize: 10 }}>{meta?.credits ?? '?'}c</Badge>
                  </div>
                  {meta?.description && (
                    <p style={{ marginTop: 4, fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <Info size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                      {meta.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onToggle(idx)}
                  style={{
                    width: 36, height: 20, borderRadius: 99, border: 'none', cursor: 'pointer',
                    position: 'relative', flexShrink: 0,
                    background: stage.enabled ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                    background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    left: stage.enabled ? 18 : 2, transition: 'left 0.15s ease',
                  }} />
                </button>
              </div>

              {stage.enabled && Object.keys(params).length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(params).map(([key, param]) => {
                    const value = (stage.params[key] as number | undefined) ?? param.default;
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        {param.type === 'float' || param.type === 'int' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="range"
                              min={param.min} max={param.max} step={param.step}
                              value={value as number}
                              onChange={(e) => onParamChange(idx, key, Number(e.target.value))}
                              style={{
                                width: 80, height: 6, cursor: 'pointer', borderRadius: 99,
                                accentColor: 'var(--color-accent)',
                              }}
                            />
                            <span style={{ width: 28, fontSize: 12, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{value}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
