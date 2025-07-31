import cluster from 'node:cluster';
import {ClusterManager} from '../cluster-manager/cluster-manager.js';
import {type UserClusterOptions} from '../util/cluster-options.js';
import {type WorkerCallback} from '../worker-runner/worker-callback.js';
import {WorkerRunner} from '../worker-runner/worker-runner.js';

/**
 * On the primary thread: This creates and returns a {@link ClusterManager} instance, which can be
 * used to spawn multiple workers.
 *
 * On the spawned worker threads: This creates and returns a {@link WorkerRunner} instance which then
 * runs the given callback in its worker.
 *
 * @category Main
 * @returns An array of child workers (which will mutate if more are added or some die) when on the
 *   primary process. A single worker when on a child worker process.
 */
export function runInCluster(callback: WorkerCallback, options: Readonly<UserClusterOptions>) {
    if (cluster.worker) {
        return new WorkerRunner(callback, cluster.worker, options);
    } else {
        return new ClusterManager(options);
    }
}
