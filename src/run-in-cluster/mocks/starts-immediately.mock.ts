import {runInCluster} from '../run-in-cluster.js';

runInCluster(
    () => {
        throw new Error();
    },
    {
        startWorkersImmediately: true,
        workerCount: 2,
    },
);
