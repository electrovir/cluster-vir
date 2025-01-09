import {defineTypedCustomEvent, defineTypedEvent} from 'typed-event-target';

/**
 * This is emitted by `WorkerRunner` when the worker has started.
 *
 * @category Events
 */
export class WorkerStartedEvent extends defineTypedCustomEvent<{spawnedWorkerCount: number}>()(
    'worker-started',
) {}
/**
 * This is emitted by `WorkerRunner` when the worker has been cleaned. After this is emitted, the
 * worker will terminate itself.
 *
 * @category Events
 */
export class WorkerCleanedEvent extends defineTypedEvent('worker-cleaned') {}

/**
 * All events emitted by `WorkerRunner`.
 *
 * @category Internal
 */
export type WorkerRunnerEvents = WorkerStartedEvent | WorkerCleanedEvent;
