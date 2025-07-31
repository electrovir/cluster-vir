import {type Worker} from 'node:cluster';
import {assertValidShape, defineShape, exact, isValidShape, or} from 'object-shape-tester';

/**
 * Message types sent between workers and the cluster manager.
 *
 * @category Internal
 */
export enum WorkerMessageType {
    /** Sent to a worker instructing it to startup. */
    StartWorker = 'start-worker',
    /** Sent from a worker when it has started. */
    WorkerStarted = 'worker-started',
}

/**
 * Shape definition for worker messages sent between workers and the cluster manager.
 *
 * @category Internal
 */
export const workerMessageShape = defineShape(
    or(
        {
            type: exact(WorkerMessageType.StartWorker),
            data: {
                /** The number of current workers, including the current one. */
                spawnedWorkerCount: -1,
            },
        },
        {
            type: exact(WorkerMessageType.WorkerStarted),
        },
    ),
);

/**
 * Type for worker messages sent between workers and the cluster manager.
 *
 * @category Internal
 */
export type WorkerMessage = typeof workerMessageShape.runtimeType;

/**
 * Parse messages that match the expected shape for internal worker messages. Any other message is
 * ignored, and `undefined` is returned. This allows users to send custom messages.
 *
 * @category Internal
 * @returns `undefined` if the message does not match known messages shapes.
 */
export function parseWorkerMessage(message: unknown): WorkerMessage | undefined {
    if (isValidShape(message, workerMessageShape)) {
        return message;
    } else {
        return undefined;
    }
}

/**
 * A shorthand function for sending internal messages to workers. If the given message does not
 * match the expected internal message shape, an error will be thrown.
 *
 * @category Internal
 * @throws `ShapeMismatchError` if the given message does not match the internal message shape.
 */
export function sendWorkerMessage(sender: Worker, message: WorkerMessage) {
    assertValidShape(message, workerMessageShape);

    sender.send(message);
}
