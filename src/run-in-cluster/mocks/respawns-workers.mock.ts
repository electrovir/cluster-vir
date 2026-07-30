import {check} from '@augment-vir/assert';
import {wait} from '@augment-vir/common';
import {ClusterManager} from '../../cluster-manager/cluster-manager.js';
import {runInCluster} from '../run-in-cluster.js';

const manager = runInCluster(
    () => {
        throw new Error();
    },
    {
        startWorkersImmediately: false,
        respawnWorkers: true,
    },
);

if (check.instanceOf(manager, ClusterManager)) {
    await manager.startWorkers();
    await wait({
        seconds: 3,
    });
    process.exit(0);
}
