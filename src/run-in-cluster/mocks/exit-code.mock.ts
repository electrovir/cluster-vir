import {check} from '@augment-vir/assert';
import {wait} from '@augment-vir/common';
import {ClusterManager} from '../../cluster-manager/cluster-manager.js';
import {runInCluster} from '../run-in-cluster.js';

const manager = runInCluster(
    () => {
        process.kill(process.pid, 'SIGTERM');
    },
    {
        startWorkersImmediately: false,
    },
);

if (check.instanceOf(manager, ClusterManager)) {
    await manager.startWorkers();
    await wait({seconds: 1});
    process.exit(0);
}
