// Captures the four submission screenshots with headless Chrome's DevTools
// protocol. Starts serve.ts on port 8099, drives one tab, then shuts both down.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = dirname(here);
const shotDir = join(root, 'screenshots');
const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 8099;
const debugPort = 9333;
const userDataDir = join(tmpdir(), `vice-horizon-chrome-${Date.now()}`);
const base = `http://127.0.0.1:${port}/`;

const SHOTS = [
  { file: '1-landscape-cover.jpg', query: '?shot=landscape', width: 1280, height: 720 },
  { file: '2-square-cover.jpg', query: '?shot=square', width: 1080, height: 1080 },
  { file: '3-portrait-cover.jpg', query: '?shot=portrait', width: 1024, height: 1280 },
  { file: '4-editor.jpg', query: '?shot=editor', width: 1280, height: 720 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(check, timeoutMs, label) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      child.kill('SIGTERM');
    } catch {
      // Already gone.
    }
  }
}

async function connectCdp(url) {
  const socket = new WebSocket(url);
  let nextId = 0;
  const pending = new Map();

  socket.addEventListener('message', async (event) => {
    let raw = event.data;
    if (typeof raw !== 'string') {
      if (raw instanceof ArrayBuffer) raw = Buffer.from(raw).toString('utf8');
      else raw = await raw.text();
    }
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
  });

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('DevTools socket failed')), { once: true });
  });

  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        nextId += 1;
        const id = nextId;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      try {
        socket.close();
      } catch {
        // Already closed.
      }
    },
  };
}

async function main() {
  mkdirSync(shotDir, { recursive: true });
  for (const name of readdirSync(shotDir)) {
    if (/\.(png|jpe?g)$/i.test(name)) rmSync(join(shotDir, name), { force: true });
  }

  const server = spawn(process.execPath, ['serve.ts', '--port', String(port)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', (data) => process.stderr.write(data));

  let chrome = null;
  let cdp = null;

  try {
    await waitFor(async () => {
      const response = await fetch(base);
      return response.ok;
    }, 15000, 'static server');

    if (!existsSync(chromePath)) throw new Error(`Chrome not found at ${chromePath}`);

    chrome = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${userDataDir}`,
        '--window-size=1280,720',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--force-device-scale-factor=1',
        '--remote-allow-origins=*',
        'about:blank',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    chrome.stdout.on('data', () => {});
    chrome.stderr.on('data', () => {});

    const version = await waitFor(async () => {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      return response.ok ? response.json() : null;
    }, 20000, 'Chrome DevTools');

    const target = await (
      await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' })
    ).json();

    cdp = await connectCdp(target.webSocketDebuggerUrl ?? version.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const shot of SHOTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: shot.width,
        height: shot.height,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: shot.width,
        screenHeight: shot.height,
      });

      const url = base + shot.query;
      await cdp.send('Page.navigate', { url });

      await waitFor(async () => {
        const result = await cdp.send('Runtime.evaluate', {
          expression: 'Boolean(window.__shotReady) && location.search.includes("shot=")',
          returnByValue: true,
        });
        return result.result?.value === true;
      }, 30000, `${shot.file} ready`);

      await sleep(250);

      let quality = 82;
      let bytes = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const capture = await cdp.send('Page.captureScreenshot', {
          format: 'jpeg',
          quality,
          fromSurface: true,
          captureBeyondViewport: false,
        });
        bytes = Buffer.from(capture.data, 'base64');
        if (bytes.length <= 256 * 1024) break;
        quality = Math.max(50, quality - 6);
      }

      writeFileSync(join(shotDir, shot.file), bytes);
      console.log(`${shot.file}  ${shot.width}x${shot.height}  ${(bytes.length / 1024).toFixed(1)} KiB  q${quality}`);
    }
  } finally {
    cdp?.close();
    killTree(chrome);
    killTree(server);
    await sleep(700);
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // A locked Chrome profile folder is harmless.
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
