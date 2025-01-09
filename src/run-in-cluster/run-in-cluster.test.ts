import {assert} from '@augment-vir/assert';
import {removeColor} from '@augment-vir/common';
import {interpolationSafeWindowsPath, runShellCommand} from '@augment-vir/node';
import {describe, it} from '@augment-vir/test';
import {join} from 'node:path';
import {runInCluster} from './run-in-cluster.js';

describe(runInCluster.name, () => {
    async function testRunInCluster(filePath: string) {
        const command = [
            'tsx',
            interpolationSafeWindowsPath(filePath),
        ].join(' ');

        return await runShellCommand(command, {
            cwd: join(import.meta.dirname, 'mocks'),
            rejectOnError: true,
        });
    }

    const testCases: {file: string; expect: string[]}[] = [
        {
            file: 'basic-run.mock.ts',
            expect: [
                'started worker',
                'primary worker started',
                'received ack',
                'worker on pid',
                'exited with',
                'all child workers have exited. exiting primary process.',
                'cleanup called',
            ],
        },
        {
            file: 'kill-workers-with-cleanup.mock.ts',
            expect: [
                'cleanup called',
            ],
        },
        {
            file: 'kill-workers.mock.ts',
            expect: [
                'exiting primary process',
            ],
        },
        {
            file: 'respawns-workers.mock.ts',
            expect: [
                'respawning...',
            ],
        },
        {
            file: 'starts-immediately.mock.ts',
            expect: [
                "starting '2' workers",
            ],
        },
        {
            file: 'exit-code.mock.ts',
            expect: [
                "code '143'",
            ],
        },
    ];

    testCases.forEach((testCase) => {
        it(testCase.file, async () => {
            const output = await testRunInCluster(testCase.file);

            assert.hasValues(removeColor(output.stdout).toLowerCase(), testCase.expect);
        });
    });
});
