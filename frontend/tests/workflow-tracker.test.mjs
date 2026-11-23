// Run with: npm test   (compiles lib/workflow-tracker.ts, then runs node --test)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const T = require('./.build/workflow-tracker.js');

// ---------------------------------------------------------------------------
// Virtual clock: deterministic timers, no real waiting.
// ---------------------------------------------------------------------------
function makeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  return {
    scheduler: {
      setTimeout(fn, ms) { const id = nextId++; timers.set(id, { at: now + ms, fn }); return id; },
      clearTimeout(id) { timers.delete(id); },
      now: () => now,
    },
    pending: () => timers.size,
    delays: [],
    async advance(ms) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        const [id, t] = due;
        timers.delete(id);
        now = Math.max(now, t.at);
        t.fn();
        await flush();
      }
      now = target;
    },
  };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

function track(clock, responses, extra = {}) {
  const calls = { fetch: 0, updates: [], terminals: [], transient: [], giveUps: [] };
  const queue = [...responses];
  const tracker = T.trackWorkflow({
    workflowId: 'wf-1',
    scheduler: clock.scheduler,
    fetchWorkflow: async () => {
      calls.fetch += 1;
      const next = queue.length > 1 ? queue.shift() : queue[0];
      const value = typeof next === 'function' ? await next() : next;
      if (value instanceof Error) throw value;
      return value;
    },
    onUpdate: (snap, wf) => calls.updates.push({ snap, wf }),
    onTerminal: (snap) => calls.terminals.push(snap),
    onTransientError: (_e, n) => calls.transient.push(n),
    onGiveUp: (f) => calls.giveUps.push(f),
    ...extra,
  });
  return { tracker, calls };
}

const wf = (status, extra = {}) => ({ id: 'wf-1', status, ...extra });
const httpError = (status, message) => Object.assign(new Error(`HTTP ${status}`), {
  response: { status, data: { error: { message } } },
});

// ---------------------------------------------------------------------------
// Lifecycle vocabulary
// ---------------------------------------------------------------------------
test('status vocabulary matches the backend lifecycle', () => {
  assert.deepEqual([...T.ACTIVE_STATUSES], ['pending', 'processing']);
  assert.deepEqual([...T.TERMINAL_STATUSES], ['completed', 'failed', 'cancelled']);
});

test('cancellation is offered only for active workflows', () => {
  assert.equal(T.canCancel('pending'), true);
  assert.equal(T.canCancel('processing'), true);
  for (const s of ['completed', 'failed', 'cancelled', 'idle', 'bogus']) {
    assert.equal(T.canCancel(s), false, s);
  }
});

// ---------------------------------------------------------------------------
// Snapshot mapping: completed recognition, 100%, output URL, errors
// ---------------------------------------------------------------------------
test('completed payload maps to 100% with the real output URL', () => {
  const s = T.toSnapshot(wf('completed', { progress: 40, output_url: 'https://res.cloudinary.com/x/processed/a.png' }));
  assert.equal(s.status, 'completed');
  assert.equal(s.progress, 100);
  assert.equal(s.outputUrl, 'https://res.cloudinary.com/x/processed/a.png');
  assert.equal(s.error, null);
});

test('completed with a stale or missing progress value is still 100%', () => {
  assert.equal(T.toSnapshot(wf('completed')).progress, 100);
  assert.equal(T.toSnapshot(wf('completed', { progress: 0 })).progress, 100);
});

test('processing shows the backend progress, never 100 and never invented', () => {
  assert.equal(T.toSnapshot(wf('processing', { progress: 50 })).progress, 50);
  assert.equal(T.toSnapshot(wf('processing', { progress: 100 })).progress, 99);
  assert.equal(T.toSnapshot(wf('processing')).progress, 0);
  assert.equal(T.toSnapshot(wf('pending', { progress: null })).progress, 0);
  assert.equal(T.toSnapshot(wf('processing', { progress: Number.NaN })).progress, 0);
  assert.equal(T.toSnapshot(wf('processing', { progress: -4 })).progress, 0);
});

test('output URL is only exposed for completed workflows', () => {
  assert.equal(T.toSnapshot(wf('processing', { output_url: 'https://x/y.png' })).outputUrl, null);
  assert.equal(T.toSnapshot(wf('cancelled', { output_url: 'https://x/y.png' })).outputUrl, null);
});

test('failed payload carries a meaningful error, with a fallback', () => {
  assert.equal(T.toSnapshot(wf('failed', { error: 'HTTPError: download failed' })).error, 'HTTPError: download failed');
  assert.equal(T.toSnapshot(wf('failed')).error, T.DEFAULT_FAILURE_MESSAGE);
  assert.equal(T.toSnapshot(wf('failed', { error: '   ' })).error, T.DEFAULT_FAILURE_MESSAGE);
  assert.equal(T.toSnapshot(wf('processing', { error: 'ignored' })).error, null);
});

test('cancelled payload keeps its real state', () => {
  const s = T.toSnapshot(wf('cancelled', { progress: 50 }));
  assert.equal(s.status, 'cancelled');
  assert.equal(s.progress, 50);
});

test('current stage comes from the backend and is sanitised', () => {
  assert.equal(T.toSnapshot(wf('processing', { current_stage: 2 })).currentStage, 2);
  assert.equal(T.toSnapshot(wf('processing')).currentStage, 0);
  assert.equal(T.toSnapshot(wf('processing', { current_stage: -1 })).currentStage, 0);
});

test('error helpers read axios-shaped errors safely', () => {
  assert.equal(T.getHttpStatus(httpError(409)), 409);
  assert.equal(T.getHttpStatus(new Error('x')), undefined);
  assert.equal(T.getHttpStatus(null), undefined);
  assert.equal(T.getApiErrorMessage(httpError(402, 'Insufficient credits. Need 3')), 'Insufficient credits. Need 3');
  assert.equal(T.getApiErrorMessage(httpError(500, '')), undefined);
  assert.equal(T.getApiErrorMessage(undefined), undefined);
});

// ---------------------------------------------------------------------------
// Tracker: processing -> completed
// ---------------------------------------------------------------------------
test('tracker follows queued -> processing -> completed and ends at 100% with the output', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [
    wf('pending'),
    wf('processing', { progress: 0 }),
    wf('processing', { progress: 50, current_stage: 1 }),
    wf('completed', { output_url: 'https://res.cloudinary.com/x/processed/a.png' }),
  ]);

  await clock.advance(0);
  await clock.advance(2000);
  await clock.advance(2000);
  await clock.advance(2000);

  assert.deepEqual(calls.updates.map((u) => [u.snap.status, u.snap.progress]), [
    ['pending', 0], ['processing', 0], ['processing', 50], ['completed', 100],
  ]);
  assert.equal(calls.updates[2].snap.currentStage, 1);
  assert.equal(calls.terminals.length, 1);
  assert.equal(calls.terminals[0].outputUrl, 'https://res.cloudinary.com/x/processed/a.png');
  assert.equal(calls.updates.at(-1).wf.output_url, 'https://res.cloudinary.com/x/processed/a.png');
});

test('tracker stops polling after the terminal state (no timers, no more requests)', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [wf('processing'), wf('completed', { output_url: 'u' })]);

  await clock.advance(0);
  await clock.advance(2000);
  assert.equal(calls.terminals.length, 1);
  const fetchesAtTerminal = calls.fetch;

  await clock.advance(60_000);
  assert.equal(calls.fetch, fetchesAtTerminal);
  assert.equal(clock.pending(), 0);
  assert.equal(calls.updates.length, 2);
});

test('an already-completed workflow is recognised on the very first response', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [wf('completed', { output_url: 'https://x/done.png' })]);

  await clock.advance(0);

  assert.equal(calls.fetch, 1);
  assert.equal(calls.updates[0].snap.status, 'completed');
  assert.equal(calls.updates[0].snap.progress, 100);
  assert.equal(calls.updates[0].snap.outputUrl, 'https://x/done.png');
  assert.equal(calls.terminals.length, 1);
  assert.equal(clock.pending(), 0);
});

test('failed workflows stop polling and surface the error', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [wf('processing', { progress: 50 }), wf('failed', { error: 'ValueError: bad image' })]);

  await clock.advance(0);
  await clock.advance(2000);
  await clock.advance(60_000);

  assert.equal(calls.terminals.length, 1);
  assert.equal(calls.terminals[0].status, 'failed');
  assert.equal(calls.terminals[0].error, 'ValueError: bad image');
  assert.equal(calls.fetch, 2);
});

test('cancelled workflows stop polling and display the cancelled state', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [wf('processing'), wf('cancelled', { progress: 50 })]);

  await clock.advance(0);
  await clock.advance(2000);

  assert.equal(calls.terminals[0].status, 'cancelled');
  assert.equal(calls.terminals[0].outputUrl, null);
  assert.equal(calls.fetch, 2);
});

test('requests never overlap even if the server is slower than the poll interval', async () => {
  const clock = makeClock();
  let inFlight = 0;
  let maxInFlight = 0;
  const slow = async () => {
    inFlight += 1; maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
    inFlight -= 1;
    return wf('processing');
  };
  track(clock, [slow]);

  for (let i = 0; i < 6; i++) await clock.advance(2000);

  assert.equal(maxInFlight, 1);
});

// ---------------------------------------------------------------------------
// Tracker: error handling and recovery
// ---------------------------------------------------------------------------
test('polling recovers after temporary network errors', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [
    new Error('Network Error'),
    httpError(503),
    wf('processing', { progress: 50 }),
    wf('completed', { output_url: 'https://x/ok.png' }),
  ]);

  await clock.advance(0);       // fails (1)
  await clock.advance(4000);    // retry after 2s*2^1 backoff -> 503 (2)
  await clock.advance(8000);    // retry -> processing
  await clock.advance(2000);    // -> completed

  assert.deepEqual(calls.transient, [1, 2]);
  assert.equal(calls.giveUps.length, 0);
  assert.equal(calls.terminals.length, 1);
  assert.equal(calls.terminals[0].outputUrl, 'https://x/ok.png');
});

test('backoff grows between failures and resets after a success', async () => {
  const clock = makeClock();
  const times = [];
  const { calls } = track(clock, [
    () => { times.push(clock.scheduler.now()); return new Error('down'); },
    () => { times.push(clock.scheduler.now()); return new Error('down'); },
    () => { times.push(clock.scheduler.now()); return new Error('down'); },
    () => { times.push(clock.scheduler.now()); return wf('processing'); },
    () => { times.push(clock.scheduler.now()); return wf('processing'); },
  ].map((fn) => async () => fn()));

  await clock.advance(100_000);

  // 0, +4000, +8000, +16000->capped 15000 ... then back to the normal 2000 interval
  assert.deepEqual(times.slice(0, 3).map((t, i, a) => (i === 0 ? t : t - a[i - 1])), [0, 4000, 8000]);
  assert.equal(times[3] - times[2], 15000);
  assert.equal(times[4] - times[3], 2000);
  assert.equal(calls.giveUps.length, 0);
});

test('gives up after repeated failures instead of polling forever', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [new Error('Network Error')], { maxConsecutiveFailures: 3 });

  await clock.advance(200_000);

  assert.equal(calls.giveUps.length, 1);
  assert.equal(calls.giveUps[0].kind, 'network');
  assert.match(calls.giveUps[0].message, /Jobs page/);
  assert.equal(calls.fetch, 3);
  assert.equal(clock.pending(), 0);
});

test('a 404 gives up immediately with a clear message (no pointless retries)', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [httpError(404, 'Workflow not found')]);

  await clock.advance(60_000);

  assert.equal(calls.fetch, 1);
  assert.equal(calls.giveUps[0].kind, 'not_found');
  assert.equal(calls.transient.length, 0);
});

test('401/403 and other 4xx are permanent; 429 and 5xx are retried', async () => {
  for (const [status, expectedKind] of [[401, 'unauthorized'], [403, 'unauthorized'], [400, 'rejected'], [422, 'rejected']]) {
    const clock = makeClock();
    const { calls } = track(clock, [httpError(status)]);
    await clock.advance(10_000);
    assert.equal(calls.giveUps[0]?.kind, expectedKind, String(status));
    assert.equal(calls.fetch, 1, String(status));
  }
  for (const status of [429, 500, 502, 503, 408]) {
    const clock = makeClock();
    const { calls } = track(clock, [httpError(status), wf('completed', { output_url: 'u' })]);
    await clock.advance(0); await clock.advance(10_000);
    assert.equal(calls.giveUps.length, 0, String(status));
    assert.equal(calls.terminals.length, 1, String(status));
  }
});

test('gives up with a timeout message once the overall time limit passes', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [wf('processing', { progress: 10 })], { maxDurationMs: 10_000 });

  await clock.advance(60_000);

  assert.equal(calls.giveUps.length, 1);
  assert.equal(calls.giveUps[0].kind, 'timeout');
  assert.equal(clock.pending(), 0);
  const fetchesAtGiveUp = calls.fetch;
  await clock.advance(60_000);
  assert.equal(calls.fetch, fetchesAtGiveUp);
});

test('an unrecognised status keeps polling (bounded by the time limit)', async () => {
  const clock = makeClock();
  const { calls } = track(clock, [wf('mystery')], { maxDurationMs: 6000 });

  await clock.advance(30_000);

  assert.equal(calls.updates[0].snap.status, 'processing');
  assert.equal(calls.giveUps[0].kind, 'timeout');
});

test('a throwing UI callback does not silently end tracking of a live workflow', async () => {
  const clock = makeClock();
  const errors = [];
  const original = console.error;
  console.error = (...a) => errors.push(a);
  try {
    let first = true;
    const { calls } = track(clock, [wf('processing'), wf('completed', { output_url: 'u' })], {
      onUpdate: (snap) => { if (first) { first = false; throw new Error('render blew up'); } },
      onTerminal: (snap) => { calls.terminals.push(snap); },
    });
    await clock.advance(0);
    await clock.advance(2000);
    assert.equal(calls.terminals.length, 1);
    assert.equal(errors.length, 1);
  } finally {
    console.error = original;
  }
});

// ---------------------------------------------------------------------------
// Races
// ---------------------------------------------------------------------------
test('stop() discards the result of a request that is still in flight', async () => {
  const clock = makeClock();
  let release;
  const gate = new Promise((r) => { release = r; });
  const { tracker, calls } = track(clock, [async () => { await gate; return wf('completed', { output_url: 'u' }); }]);

  await clock.advance(0);       // request issued, not yet answered
  tracker.stop();
  release();
  await flush();

  assert.equal(calls.updates.length, 0);
  assert.equal(calls.terminals.length, 0);
  assert.equal(clock.pending(), 0);
});

test('stop() also discards a late failure from an in-flight request', async () => {
  const clock = makeClock();
  let fail;
  const gate = new Promise((_, rej) => { fail = rej; });
  const { tracker, calls } = track(clock, [async () => { await gate; }]);

  await clock.advance(0);
  tracker.stop();
  fail(new Error('Network Error'));
  await flush();

  assert.equal(calls.transient.length, 0);
  assert.equal(calls.giveUps.length, 0);
});

test('cancel racing completion: restarting tracking shows the server truth (completed wins)', async () => {
  // Mirrors the UI: the user clicks Cancel while the job finishes. The server
  // answers 409, the UI restarts tracking, and the old tracker's late
  // "processing" response must not overwrite what the new one reports.
  const clock = makeClock();
  let releaseOld;
  const oldGate = new Promise((r) => { releaseOld = r; });
  const ui = { status: 'idle', progress: 0 };

  const oldRun = track(clock, [async () => { await oldGate; return wf('processing', { progress: 50 }); }], {
    onUpdate: (s) => { ui.status = s.status; ui.progress = s.progress; },
  });
  await clock.advance(0); // old request in flight

  // user clicks cancel -> API says 409 (already completed) -> UI restarts tracking
  oldRun.tracker.stop();
  const newRun = track(clock, [wf('completed', { output_url: 'https://x/final.png' })], {
    onUpdate: (s) => { ui.status = s.status; ui.progress = s.progress; ui.output = s.outputUrl; },
  });
  await clock.advance(0);

  releaseOld(); // the stale response arrives late
  await flush();

  assert.deepEqual(ui, { status: 'completed', progress: 100, output: 'https://x/final.png' });
  assert.equal(oldRun.calls.updates.length, 0);
  assert.equal(newRun.calls.terminals.length, 1);
});

test('cancel winning the race: restarting tracking shows cancelled, not a processing leftover', async () => {
  const clock = makeClock();
  const ui = { status: 'processing', progress: 50 };
  track(clock, [wf('cancelled', { progress: 50 })], {
    onUpdate: (s) => { ui.status = s.status; ui.progress = s.progress; },
  });

  await clock.advance(0);

  assert.deepEqual(ui, { status: 'cancelled', progress: 50 });
});
