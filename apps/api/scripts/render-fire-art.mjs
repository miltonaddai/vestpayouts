// Renders scripts/fire-art.html for tiers 1-10 to assets/fire/tier-NN.png
// using headless Chrome over the DevTools protocol (no extra dependencies).
//
//   node scripts/render-fire-art.mjs            all tiers
//   node scripts/render-fire-art.mjs 3 7        some tiers
//   CHROME_PATH=/path/to/chrome node scripts/render-fire-art.mjs
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const page = pathToFileURL(path.join(here, "fire-art.html")).href;
const outDir = path.join(here, "..", "assets", "fire");
mkdirSync(outDir, { recursive: true });

const tiers = process.argv.slice(2).map(Number).filter((n) => n >= 1 && n <= 10);
const list = tiers.length ? tiers : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const chrome =
  process.env.CHROME_PATH ||
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "google-chrome");

const port = 9400 + Math.floor(Math.random() * 400);
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(path.join(tmpdir(), "fire-"))}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) pending.get(m.id)(m.result), pending.delete(m.id);
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1080, deviceScaleFactor: 1, mobile: false });
for (const tier of list) {
  await send("Page.navigate", { url: `${page}?tier=${tier}` });
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    const r = await send("Runtime.evaluate", { expression: "window.__done === true", returnByValue: true });
    if (r?.result?.value) break;
  }
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1080, height: 1080, scale: 1 } });
  const file = path.join(outDir, `tier-${String(tier).padStart(2, "0")}.png`);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log(path.relative(process.cwd(), file));
}
ws.close();
proc.kill();
