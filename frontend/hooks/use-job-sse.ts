'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SSEOptions {
  url: string;
  onUpdate: (data: { status: string; progress: number; output_url?: string }) => void;
  onError?: () => void;
  enabled?: boolean;
}

const RECONNECT_DELAY_MS = 3000;
const POLL_INTERVAL_MS = 5000;

export function useJobSSE({ url, onUpdate, onError, enabled = true }: SSEOptions) {
  const esRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  onUpdateRef.current = onUpdate;
  onErrorRef.current = onError;

  const cleanup = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled || !url) {
      cleanup();
      return;
    }

    let reconnectAttempts = 0;

    function connect() {
      cleanup();
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('update', (e: MessageEvent) => {
        reconnectAttempts = 0;
        try {
          onUpdateRef.current(JSON.parse(e.data));
        } catch { /* ignore malformed data */ }
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        onErrorRef.current?.();

        if (reconnectAttempts < 3) {
          reconnectAttempts++;
          retryTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        } else {
          startPolling();
        }
      };
    }

    function startPolling() {
      pollTimerRef.current = setInterval(() => {
        onUpdateRef.current({ status: 'polling', progress: 0 });
      }, POLL_INTERVAL_MS);
    }

    connect();

    return cleanup;
  }, [url, enabled, cleanup]);
}
