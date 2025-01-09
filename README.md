# cluster-vir

Simplifies running a script across multiple workers. This only works in Node.js (not in the browser) because it relies on Node.js's built-in [`cluster`](https://nodejs.org/api/cluster.html) module.

## Install

```sh
npm i cluster-vir
```

## Usage

See full docs here: https://electrovir.github.io/cluster-vir

The main export from this package is `runInCluster`. Pass it a callback to be executed on each worker. Here's an example of how to use it:

<!-- example-link: ./src/examples/run-script-cluster.example.ts -->

```TypeScript
import {createServer} from 'node:http';
import {runInCluster} from 'cluster-vir';

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
```

## Notes

-   Workers will not terminate themselves when the callback you provide to `runInCluster` finishes, you must manually kill them with `worker.kill()` or `process.exit()`.
-   When all workers have terminated and `respawnWorkers` has not been set to `true`, the cluster manager will automatically terminate itself as well.
-   The cluster manager and its workers send messages back and forth so if you add your own event listener to the spawned workers, you'll need an `if` or `switch` to focus on your messages.
