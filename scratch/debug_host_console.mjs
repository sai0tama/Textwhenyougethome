import { spawn } from "node:child_process";
import fs from "node:fs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const userDataDir = "/tmp/chrome-form-debug";

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9258",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1280,1000",
  ]);

  let targetsRes = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      targetsRes = await fetch("http://127.0.0.1:9258/json/list");
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
    if (msg.method === "Runtime.consoleAPICalled") {
      console.log(
        "[PAGE CONSOLE]",
        msg.params.type,
        msg.params.args.map((a) => a.value || a.description),
      );
    }
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

    // Click submit directly
    const testResult = await evaluate(`(async () => {
      try {
        const input = document.querySelector('section.bg-highlight input[type="email"]');
        const form = document.querySelector('section.bg-highlight form');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Focus and type using standard React synthetic event or dispatch
        input.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(input, "host.partner@urbanaut.app");
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        console.log("Current input value:", input.value);
        submitBtn.click();
        return "clicked button";
      } catch (err) {
        return "Error: " + err.message;
      }
    })()`);
    console.log("Test invocation:", testResult);

    for (let i = 0; i < 15; i++) {
      await sleep(500);
      const hostHtml = await evaluate(`document.querySelector('section.bg-highlight')?.innerHTML`);
      if (hostHtml.includes("got your note") || hostHtml.includes('role="alert"')) {
        console.log(
          "Status changed! Form container HTML:",
          hostHtml.slice(
            hostHtml.indexOf('class="w-full lg:max-w-md'),
            hostHtml.indexOf('class="w-full lg:max-w-md') + 300,
          ),
        );
        break;
      }
    }

    ws.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch(console.error);
