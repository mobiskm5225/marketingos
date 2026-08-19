/**
 * In-process event emitter for run progress.
 *
 * The runner emits events here; the SSE endpoint subscribes. Each run gets its
 * own channel keyed by run ID. Listeners are cleaned up when the SSE connection
 * closes or the run finishes.
 */

import { EventEmitter } from 'node:events';

export interface RunEvent {
  type:
    | 'run_started'
    | 'stage_started'
    | 'stage_complete'
    | 'stage_error'
    | 'run_complete'
    | 'run_error'
    | 'gate_failed';
  runId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const bus = new EventEmitter();
bus.setMaxListeners(100);

export function emitRunEvent(event: RunEvent): void {
  bus.emit(`run:${event.runId}`, event);
  bus.emit('run:*', event);
}

export function onRunEvent(runId: string, handler: (event: RunEvent) => void): () => void {
  bus.on(`run:${runId}`, handler);
  return () => bus.off(`run:${runId}`, handler);
}

/** Remove all listeners for a finished run. */
export function cleanupRun(runId: string): void {
  bus.removeAllListeners(`run:${runId}`);
}
