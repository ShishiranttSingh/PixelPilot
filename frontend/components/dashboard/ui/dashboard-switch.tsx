'use client';

import { useId } from 'react';

interface DashboardSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function DashboardSwitch({ checked, onCheckedChange, disabled, 'aria-label': ariaLabel }: DashboardSwitchProps) {
  const switchId = useId();

  return (
    <button
      role="switch"
      type="button"
      id={switchId}
      aria-checked={checked}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      onClick={() => !disabled && onCheckedChange(!checked)}
      style={{
        width: 30,
        height: 17,
        borderRadius: 99,
        background: checked ? 'var(--color-accent-blue)' : 'rgba(255,255,255,0.1)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease',
        opacity: disabled ? 0.45 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 'calc(100% - 15px)' : 2,
          width: 13,
          height: 13,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}