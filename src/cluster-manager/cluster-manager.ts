import {waitUntil} from '@augment-vir/assert';
import {
    createArray,
    DeferredPromise,
    log,
    type MaybePromise,
    PromiseQueue,
    wait,
} from '@augment-vir/common';
import {addExitCallback} from 'catch-exit';
import {type Serializable} from 'node:child_process';
import cluster, {type Worker} from 'node:cluster';
import {ListenTarget} from 'typed-event-target';
import {
    type ClusterOptions,
    combineOptions,
    type UserClusterOptions,
} from '../util/cluster-options.js';
import {parseWorkerMessage, sendWorkerMessage, WorkerMessageType} from '../util/worker-message.js';
import {type ClusterManagerEvents, WorkerAddedEvent, WorkerRemovedEvent} from './cluster.event.js';

/**
 * This is generated and returned by `runInCluster` on the primary process only. This gives you
 * access to all child workers and provides ways to access and monitor it.
 *
 * @category Runners
 */
export class ClusterManager extends ListenTarget<ClusterManagerEvents> {
    /**
     * All currently running workers. When a new worker is spawned from `ClusterManager`, it will be
     * added to this set. When a worker in this set dies or exits, it will be removed from this
     * set.
     */
    public workers = new Set<Worker>();
    /** Current cluster options. */
    public options: ClusterOptions;
    protected respawnQueue = new PromiseQueue();

    constructor(userOptions: Readonly<UserClusterOptions>) {
        super();
        this.options = combineOptions(userOptions);
        log.faint(`Primary worker started with pid '${process.pid}'.`);

        /** Handle any worker in the cluster exiting. */
        cluster.on('exit', async (worker, code) => {
            log.faint(
                `Worker on pid '${worker.process.pid}' exited with code '${code}'.${this.options.respawnWorkers ? ' respawning...' : ''}`,
            );

            this.removeWorker(worker);

            if (this.options.respawnWorkers) {
                /** Only respawn the worker if the current count is below the desired count. */
                if (this.workers.size < this.options.workerCount) {
                    await this.respawnQueue.add(async () => {
                        await wait({
                            seconds: 1,
                        });
                        await this.spawnWorker();
                    });
                }
            } else if (!this.workers.size && !this.options.keepClusterManagerAlive) {
                log.faint('All child workers have exited. Exiting primary process.');
                /** There are no more workers so the primary worker might as well exit. */
                process.exit(0);
            }
        });

        /** Kill all workers when the cluster manager exits. */
        addExitCallback(() => this.destroy());

        if (this.options.startWorkersImmediately) {
            // eslint-disable-next-line sonarjs/no-async-constructor
            void this.startWorkers();
        }
    }

    /** Start all workers. */
    public async startWorkers() {
        log.faint(`Starting '${this.options.workerCount}' workers...`);

        await createArray(this.options.workerCount, async () => {
            return await this.spawnWorker();
        });
    }

    /** Sends a message to all current workers. */
    public broadcast(message: Serializable) {
        this.workers.forEach((worker) => {
            worker.send(message);
        });
    }

    /**
     * Spawns a new child worker. This is called internally by `ClusterManager` but you may also
     * call it manually if you wish. Note that manually calling this can easily allow you to exceed
     * your own specified worker count (so it might not be a great idea to manually call this).
     *
     * This method waits for the worker to be response before resolving.
     *
     * @returns The newly spawned worked.
     */
    public async spawnWorker(): Promise<Worker> {
        const worker = cluster.fork();
        this.workers.add(worker);
        /** Wait for the worker to be responsive before trying to interact with it. */
        const workerStartedPromise = new DeferredPromise();

        worker.on('message', (rawMessage) => {
            const message = parseWorkerMessage(rawMessage);

            if (message?.type === WorkerMessageType.WorkerStarted) {
                workerStartedPromise.resolve();
            }
        });
        await workerStartedPromise.promise;

        this.dispatch(
            new WorkerAddedEvent({
                detail: worker,
            }),
        );

        /** Don't start the worker until listeners have had a chance to know its been added. */
        sendWorkerMessage(worker, {
            type: WorkerMessageType.StartWorker,
            data: {
                spawnedWorkerCount: this.workers.size,
            },
        });

        return worker;
    }

    /**
     * Kill all workers. Only use this if you plan on keeping `ClusterManager` around for some
     * reason. Usually you'll instead want to call {@link ClusterManager.destroy}, which will also
     * clean up `ClusterManager` itself.
     */
    public killWorkers(
        /**
         * Set this to `true` to skip waiting for workers to actually all be killed. Only do that if
         * you can't `await` this method (like in an process.exit listener).
         */
        skipWaitingForCleanup: true,
    ): void;
    /**
     * Kill all workers. Only use this if you plan on keeping `ClusterManager` around for some
     * reason. Usually you'll instead want to call {@link ClusterManager.destroy}, which will also
     * clean up `ClusterManager` itself.
     */
    public killWorkers(
        /**
         * Set this to `true` to skip waiting for workers to actually all be killed. Only do that if
         * you can't `await` this method (like in an process.exit listener).
         */
        skipWaitingForCleanup?: false | undefined,
    ): Promise<void>;
    /**
     * Kill all workers. Only use this if you plan on keeping `ClusterManager` around for some
     * reason. Usually you'll instead want to call {@link ClusterManager.destroy}, which will also
     * clean up `ClusterManager` itself.
     */
    public killWorkers(
        /**
         * Set this to `true` to skip waiting for workers to actually all be killed. Only do that if
         * you can't `await` this method (like in a `process.exit` listener).
         */
        skipWaitingForCleanup = false,
    ): MaybePromise<void> {
        this.workers.forEach((worker) => {
            worker.kill();
        });

        if (!skipWaitingForCleanup) {
            return waitUntil.strictEquals(0, () => this.workers.size).then(() => {});
        }
    }

    /** Completely cleanup `ClusterManager` and all its workers. */
    public override destroy() {
        this.options.respawnWorkers = false;
        this.respawnQueue.destroy();
        super.destroy();
        this.killWorkers(true);
    }

    /** Remove and kill the given worker. */
    public removeWorker(worker: Worker) {
        this.workers.delete(worker);
        worker.kill();
        this.dispatch(
            new WorkerRemovedEvent({
                detail: {
                    /* node:coverage ignore next: just a type guard for pid being optional */
                    removedWorkerPid: worker.process.pid ?? -1,
                    runningWorkerCount: this.workers.size,
                },
            }),
        );
    }
}
