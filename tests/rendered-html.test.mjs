import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Snowveil visual shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Snowveil — Frost Rite WebGPU<\/title>/i);
  assert.match(html, /property="og:image" content="http:\/\/localhost\/og\.png"/i);
  assert.match(html, /name="twitter:card" content="summary_large_image"/i);
  assert.match(html, /Interactive procedural snow landscape/);
  assert.match(html, /jump with Space, cast with E/);
  assert.match(html, /Snowboard touch controls/);
  assert.match(html, /data-snowveil-key="KeyW"/);
  assert.match(html, /data-snowveil-key="Space"/);
  assert.match(html, /data-snowveil-key="KeyE"/);
  assert.match(html, /Preparing atmosphere/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("Space drives a physical airborne state instead of a secondary action", async () => {
  const sceneSource = await readFile(
    new URL("../app/snowveil-scene.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sceneSource, /code === "Space"[^\n]+jumpHeight <= 0\.001/);
  assert.match(sceneSource, /jumpVelocity = 3\.85/);
  assert.match(sceneSource, /jumpVelocity -= 10\.8 \* delta/);
  assert.match(sceneSource, /AIR \$\{jumpHeight\.toFixed\(1\)\} m/);
});
