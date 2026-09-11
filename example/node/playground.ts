import { spawn } from 'node:child_process';
import { serveRepo } from '@example/node/serve.js';

const PORT = 5173;
const URL = `http://127.0.0.1:${String(PORT)}/example/browser/`;
const OPENERS: Record<string, string> = {
  darwin: 'open',
  win32: 'explorer',
  linux: 'xdg-open',
};

const server = await serveRepo(PORT);
const opener = OPENERS[process.platform];

console.log(`\n  nodeless playground\n  ${URL}\n`);
console.log('  It installs react from registry.npmjs.org, then builds in your browser.');
console.log('  Ctrl+C to stop.\n');

if (opener) spawn(opener, [URL], { stdio: 'ignore', detached: true }).unref();

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
