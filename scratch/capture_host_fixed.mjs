import { spawn } from "node:child_process";
import fs from "node:fs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const userDataDir = "/tmp/chrome-capture-host-fixed";

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9260",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1280,1000",
  ]);

  let targetsRes = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      targetsRes = await fetch("http://127.0.0.1:9260/json/list");
      if (targetsRes.ok) break;
    } catch {}
  }
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const callbacks = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, (msg) => {
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async function screenshot(path) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path, Buffer.from(res.data, "base64"));
  }

  try {
    await send("Page.enable");
    await send("Runtime.enable");

    await send("Page.navigate", { url: "http://127.0.0.1:5173/street-smart" });
    await sleep(2500);

    // Scroll directly to HostSection
    await evaluate(`(() => {
      const el = document.querySelector('section.bg-highlight');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(600);

    const desktopPath =
      "/Users/c/.gemini/antigravity/brain/d34dc33f-af53-464f-973a-59032e0595f1/walks_ref3_host_desktop.png";
    await screenshot(desktopPath);
    console.log("Saved full Host section desktop screenshot to:", desktopPath);

    ws.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch(console.error);
