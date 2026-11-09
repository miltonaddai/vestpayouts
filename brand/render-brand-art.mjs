// Renders brand/brand-art.html to brand/vestpayouts-x-avatar.png and -banner.png.
//   node brand/render-brand-art.mjs
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const page = pathToFileURL(path.join(here, "brand-art.html")).href;
const outDir = here;
mkdirSync(outDir, { recursive: true });

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
const ALL = [["avatar", 800, 800], ["banner", 3000, 1000], ["vest-avatar", 800, 800], ["vest-sheet", 2000, 700]];
const only = process.argv.slice(2);
for (const [kind, w, h] of ALL.filter(([k]) => !only.length || only.includes(k))) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${page}?kind=${kind}` });
  for (let i = 0; i < 100; i++) {
    await sleep(200);
    const r = await send("Runtime.evaluate", { expression: "window.__done === true", returnByValue: true });
    if (r?.result?.value) break;
  }
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const file = path.join(outDir, `vestpayouts-x-${kind}.png`);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log(path.relative(process.cwd(), file));
}
ws.close();
proc.kill();
