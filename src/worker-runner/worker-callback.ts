import {MaybePromise} from '@augment-vir/common';
import {Worker} from 'node:cluster';

/**
 * All params passed to {@link WorkerCallback}.
 *
 * @category Internal
 */
export type WorkerCallbackParams = {
    worker: Worker;
};

/**
 * A callback fired by workers when they cleanup themselves. This is returned by
 * {@link WorkerCallback}. This cannot be async.
 *
 * @category Internal
 */
export type WorkerCleanupCallback = () => void | undefined;

/**
 * The callback given to `runInCluster` which will be executed on each worker.
 *
 * @category Internal
 * @returns An optional cleanup callback which will be called when the worker exits.
 */
export type WorkerCallback = (
    params: WorkerCallbackParams,
) => MaybePromise<WorkerCleanupCallback | undefined | void>;
