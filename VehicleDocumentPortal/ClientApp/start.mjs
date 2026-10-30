import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

console.info('[Unifield] Starting portal on http://localhost:5080 using isolated build output.');
const server = spawn('dotnet', [
  'run', '--artifacts-path', fileURLToPath(new URL('../../.portal-run/', import.meta.url)),
  '--no-launch-profile', '--urls', 'http://localhost:5080'
], { cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit' });

server.on('error', error => {
  console.error(`Could not start the portal: ${error.message}`);
  process.exitCode = 1;
});
server.on('exit', (code,signal) => {
  console.info('[Unifield] Portal process exited.',{code,signal});
  process.exitCode = stopping ? 0 : code ?? (signal ? 1 : 0);
});
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (stopping || !server.pid) return;
    stopping = true;
    console.info('[Unifield] Stopping portal process tree.');
    // On Windows, terminate this launcher's process tree, including the apphost.
    if (process.platform === 'win32') {
      spawnSync('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], {stdio:'ignore', windowsHide:true});
    } else server.kill(signal);
  });
}
