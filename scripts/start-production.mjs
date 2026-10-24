import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';

// Compile every route before accepting visitors; keep the active dev build intact.
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535 || (args.length !== 0 && !(args.length === 2 && args[0] === '--port'))) {
  console.error('Usage: npm run preview -- [--port 3001]');
  process.exit(1);
}
const hostname = '127.0.0.1';
const url = `http://${hostname}:${port}`;
const env = { ...process.env, NEXUS_TEST_BUILD: '', NEXUS_PREVIEW_BUILD: '1', AUTH_URL: url, NEXTAUTH_URL: url };
const next = path.resolve('node_modules/next/dist/bin/next');
let child;
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  stopping = true;
  child?.kill(signal);
});
function run(command) {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, [next, ...command], { env, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
}
try {
  // Reject a busy port before spending time on a production build.
  const probe = createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(port, hostname, resolve); });
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  console.log('Building all routes before starting the production preview...');
  const code = await run(['build']);
  if (code !== 0 || stopping) process.exitCode = code || 1;
  else process.exitCode = await run(['start', '--hostname', hostname, '--port', String(port)]);
} catch (error) {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Use npm run preview -- --port <free-port>.` : 'Production preview could not start. See the build output above.');
  process.exitCode = 1;
}
