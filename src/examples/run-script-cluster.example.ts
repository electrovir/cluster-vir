import {createServer} from 'node:http';
import {runInCluster} from '../index.js';

/**
 * In the primary thread the output of `runInCluster` gives you an instance of `ClusterManager`
 * which can be used to access all child nodes. In the worker threads it gives you an instance of
 * `WorkerRunner` which can be used to access the worker.
 */
const runner = runInCluster(
    ({worker}) => {
        /**
         * Do the worker actions here. In this example, each worker is listening to a port as an
         * HTTP server.
         */

        /**
         * Cluster workers can share a TCP connection, so an HTTP server can be handled by (and will
         * be load-balanced between) multiple workers (or threads).
         */
        const server = createServer((request, response) => {
            response.writeHead(200);
            response.end(`hello there ${worker.process.pid}`);
        }).listen(8000);

        return () => {
            /**
             * Do cleanup work in here. In this case, we're closing the HTTP server. Note that a
             * cleanup callback cannot be async.
             */
            server.close();
        };
    },
    {
        /**
         * Indicates that all child workers should be started immediately. If set to `false`, you
         * must call `runner.startWorkers()` to start them, giving you time to attach any listeners
         * you may need.
         */
        startWorkersImmediately: true,
    },
);
