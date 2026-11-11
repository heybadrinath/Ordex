import '../packages/evershop/dist/bin/start/initEnvStart.js';
import { startCronProcess } from '../packages/evershop/dist/bin/lib/startCronProcess.js';
import { startSubscriberProcess } from '../packages/evershop/dist/bin/lib/startSubscriberProcess.js';

const context = { command: 'start', env: 'production', process: 'main' };
const children = [startCronProcess(context), startSubscriberProcess(context)];
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 5000).unref();
}

for (const child of children) {
  child.ref();
  child.once('error', () => stop(1));
  child.once('exit', () => {
    if (!stopping) {
      console.error('A background process stopped; restarting the worker service.');
      stop(1);
    }
  });
}

process.once('SIGTERM', () => stop(0));
process.once('SIGINT', () => stop(0));
process.once('exit', () => {
  for (const child of children) child.kill('SIGTERM');
});
