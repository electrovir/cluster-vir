import {
    log,
    type Logger,
    mergeDefinedProperties,
    type PartialWithUndefined,
    type SetRequiredAndNotNull,
} from '@augment-vir/common';
import {cpus} from 'node:os';

/**
 * All options for the cluster.
 *
 * @category Internal
 */
export type ClusterOptions = {
    /**
     * The number of workers that will be spawned. This defaults to `cpus().length - 1`. Any
     * negative or 0 value will be pulled up to `1`.
     *
     * @default cpus().length - 1
     */
    workerCount: number;
    /**
     * If set to `true`, when workers exit or die more will be spawned to take their place to
     * maintain the `workerCount` amount of workers. When `false`, exited workers will not be
     * replaced.
     *
     * Beware: if your worker script is crashing repeatedly then setting this to `true` will cause
     * them to continue respawning and crashing, though there will at least be an internal 1 second
     * delay between spawns.
     *
     * @default false
     */
    respawnWorkers: boolean;
    /**
     * If set to `true`, the `ClusterManager` will be kept alive even if all its workers have exited
     * and `respawnWorkers` is `false`. This may cause your script to hang indefinitely unless you
     * manually exit or terminate the process or destroy `ClusterManager`.
     *
     * When this is set to `false` and `respawnWorkers` is also `false`, `ClusterManager` will
     * terminate itself if all its child workers have exited or died.
     *
     * @default false
     */
    keepClusterManagerAlive: boolean;
    /**
     * A custom logger fulfilling the [logger interface exported by the
     * `@augment-vir/common`](https://electrovir.github.io/augment-vir/types/Logger.html). To
     * silence all logs, pass in
     * [`emptyLog`](https://electrovir.github.io/augment-vir/variables/emptyLog.html) from the same
     * package.
     *
     * @default log
     */
    log: Logger;
    /**
     * Set this to `true` to immediately start all workers. Doing so, however, will not give your
     * code time to attach listeners (if you're attaching any) before workers start spawning. If you
     * aren't attaching any listeners, then this can safely be `true`.
     *
     * When set to `false`, you must call `ClusterManager.startWorkers()` to start spawning workers.
     *
     * This option is not optional in order to prevent confusing behavior.
     */
    startWorkersImmediately: boolean;
};

/**
 * User provided cluster options, allowing the omission of most options.
 *
 * @category Internal
 */
export type UserClusterOptions = SetRequiredAndNotNull<
    PartialWithUndefined<ClusterOptions>,
    'startWorkersImmediately'
>;

/**
 * Combine user options with the internal default options to produce a final set of options.
 *
 * @category Internal
 */
export function combineOptions(userOptions: Readonly<UserClusterOptions>): ClusterOptions {
    const options = mergeDefinedProperties(defaultClusterOptions, userOptions);

    return {
        ...options,
        /** Make sure we're spawning at least one worker or nothing will happen. */
        workerCount: Math.max(options.workerCount, 1),
    };
}

/**
 * The default values for {@link ClusterOptions}.
 *
 * @category Internal
 */
export const defaultClusterOptions: ClusterOptions = {
    workerCount: cpus().length - 1,
    respawnWorkers: false,
    keepClusterManagerAlive: false,
    log,
    startWorkersImmediately: false,
};
