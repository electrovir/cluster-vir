import {check} from '@augment-vir/assert';
import {ClusterManager} from '../../cluster-manager/cluster-manager.js';
import {runInCluster} from '../run-in-cluster.js';

const manager = runInCluster(
    () => {
        return () => {
            console.info('cleanup called');
        };
    },
    {startWorkersImmediately: false},
);

if (check.instanceOf(manager, ClusterManager)) {
    await manager.startWorkers();
    await manager.killWorkers();
}
