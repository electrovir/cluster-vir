import {callAsynchronously} from '@augment-vir/common';
import {addExitCallback} from 'catch-exit';
import {type Worker} from 'node:cluster';
import {ListenTarget} from 'typed-event-target';
import {
    type ClusterOptions,
    combineOptions,
    type UserClusterOptions,
} from '../util/cluster-options.js';
import {parseWorkerMessage, sendWorkerMessage, WorkerMessageType} from '../util/worker-message.js';
import {type WorkerCallback, type WorkerCleanupCallback} from './worker-callback.js';
import {WorkerCleanedEvent, type WorkerRunnerEvents, WorkerStartedEvent} from './worker.event.js';

/**
 * This is generated and returned by `runInCluster` on the worker threads. This gives you access to
 * the worker in question and provides ways to access and monitor it.
 *
 * @category Runners
 */
export class WorkerRunner extends ListenTarget<WorkerRunnerEvents> {
    /** The worker's current options. */
    public options: ClusterOptions;
    private cleanupCallback: WorkerCleanupCallback | undefined;
    private alreadyCallingDestroy = false;

    constructor(
        private readonly workerCallback: WorkerCallback,
        /** The worker itself. */
        public readonly worker: Worker,
        userOptions: Readonly<UserClusterOptions>,
    ) {
        super();
        this.options = combineOptions(userOptions);
        sendWorkerMessage(this.worker, {
            type: WorkerMessageType.WorkerStarted,
        });

        this.worker.on('message', (rawMessage) => {
            const message = parseWorkerMessage(rawMessage);

            if (message?.type === WorkerMessageType.StartWorker) {
                this.options.log.faint(`Started worker with pid '${process.pid}'`);

                this.dispatch(
                    new WorkerStartedEvent({
                        detail: {
                            spawnedWorkerCount: message.data.spawnedWorkerCount,
                        },
                    }),
                );
                void callAsynchronously(async () => {
                    this.cleanupCallback =
                        (await this.workerCallback({
                            worker,
                        })) || undefined;
                });
            }
        });

        addExitCallback(() => this.destroy());
    }

    /** Completely cleanup `WorkerRunner`, including all of its listeners, and kill the worker. */
    public override destroy() {
        if (!this.alreadyCallingDestroy) {
            this.worker.kill();
        }
        this.alreadyCallingDestroy = true;
        this.cleanupCallback?.();
        this.dispatch(new WorkerCleanedEvent());
        super.destroy();
    }
}
