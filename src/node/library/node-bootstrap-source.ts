/**
 * CommonJS on purpose: `new Worker(code, { eval: true })` runs a script, not a module. The
 * queue is there because a message can arrive before the dynamic import settles.
 */
export function nodeBootstrapSource(workerUrl: string): string {
  return `
const { parentPort } = require('node:worker_threads');
const queue = [];
let deliver = (data) => queue.push(data);

parentPort.on('message', (data) => deliver(data));

import(${JSON.stringify(workerUrl)})
  .then(({ startRuntimeWorker }) => {
    startRuntimeWorker({
      addEventListener: (type, listener) => {
        deliver = (data) => listener({ data });
        for (const data of queue.splice(0)) deliver(data);
      },
      postMessage: (message) => parentPort.postMessage(message),
    });
  })
  .catch((error) => {
    parentPort.postMessage({ id: -1, ok: false, message: String(error && error.message || error) });
  });
`;
}
