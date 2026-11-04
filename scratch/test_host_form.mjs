import { spawn } from "node:child_process";
import fs from "node:fs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const userDataDir = "/tmp/chrome-form-test";

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9257",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1280,1000",
  ]);

  let targetsRes = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      targetsRes = await fetch("http://127.0.0.1:9257/json/list");
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

    console.log("Navigating to http://127.0.0.1:5173/street-smart...");
    await send("Page.navigate", { url: "http://127.0.0.1:5173/street-smart" });
    await sleep(2500);

    // Scroll to Host section
    await evaluate(
      `document.querySelector('section.bg-highlight').scrollIntoView({ behavior: 'instant', block: 'center' })`,
    );
    await sleep(500);

    // Type into input properly
    console.log("Filling email and submitting...");
    const submitOutput = await evaluate(`(() => {
      const input = document.querySelector('section.bg-highlight input[type="email"]');
      const form = document.querySelector('section.bg-highlight form');
      if (!input || !form) return "input or form not found";
      
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(input, "host.partner@urbanaut.app");
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // click submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
      else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return "submitted with value: " + input.value;
    })()`);
    console.log(submitOutput);

    // Wait for server function and response
    let successBox = null;
    for (let i = 0; i < 20; i++) {
      await sleep(400);
      successBox = await evaluate(
        `document.querySelector('section.bg-highlight .rounded-2xl')?.innerText?.replace(/\\s+/g, ' ')`,
      );
      if (successBox) break;
    }
    console.log("Success confirmation box:", successBox);

    const ref3SuccessScreenshot =
      "/Users/c/.gemini/antigravity/brain/d34dc33f-af53-464f-973a-59032e0595f1/walks_ref3_host_success.png";
    await screenshot(ref3SuccessScreenshot);
    console.log("Captured updated Ref 3 success screenshot:", ref3SuccessScreenshot);

    ws.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch(console.error);
