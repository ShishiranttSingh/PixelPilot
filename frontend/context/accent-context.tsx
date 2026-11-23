'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ACCENT_PALETTES, getAccentCSSVars } from '@/lib/accent-theme';
import type { AccentId } from '@/lib/accent-theme';

interface AccentContextType {
  accentId: AccentId;
  setAccentId: (id: AccentId) => void;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

export function useAccent() {
  const context = useContext(AccentContext);
  if (!context) throw new Error('useAccent must be used within AccentProvider');
  return context;
}

function applyAccentVars(id: AccentId) {
  const palette = ACCENT_PALETTES[id];
  const vars = getAccentCSSVars(palette);
  const root = document.querySelector('.dashboard-theme') as HTMLElement;
  if (root) {
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

function getStoredAccent(): AccentId {
  if (typeof window === 'undefined') return 'blue';
  const stored = localStorage.getItem('pixelpilot-accent');
  if (stored && stored in ACCENT_PALETTES) return stored as AccentId;
  return 'blue';
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accentId, setAccentIdState] = useState<AccentId>('blue');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredAccent();
    setAccentIdState(stored);
    applyAccentVars(stored);
    setMounted(true);
  }, []);

  const setAccentId = useCallback((id: AccentId) => {
    setAccentIdState(id);
    localStorage.setItem('pixelpilot-accent', id);
    applyAccentVars(id);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AccentContext.Provider value={{ accentId, setAccentId }}>
      {children}
    </AccentContext.Provider>
  );
}
