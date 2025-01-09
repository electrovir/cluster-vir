import {Worker} from 'node:cluster';
import {defineTypedCustomEvent} from 'typed-event-target';

/**
 * This is emitted by `ClusterManager` when a new worker is spawned.
 *
 * @category Events
 */
export class WorkerAddedEvent extends defineTypedCustomEvent<Worker>()('worker-added') {}

/**
 * This is emitted by `ClusterManager` when a worker has died or exited and been removed from the
 * worker group.
 *
 * @category Events
 */
export class WorkerRemovedEvent extends defineTypedCustomEvent<{
    runningWorkerCount: number;
    removedWorkerPid: number;
}>()('worker-removed') {}

/**
 * All events emitted by `ClusterManager`.
 *
 * @category Internal
 */
export type ClusterManagerEvents = WorkerAddedEvent | WorkerRemovedEvent;
