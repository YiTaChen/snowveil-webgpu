import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("procedural ride audio separates base glide from edge-pressure scrape", async () => {
  const [audioSource, sceneSource] = await Promise.all([
    readFile(new URL("../app/snowveil-audio.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/snowveil-scene.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(audioSource, /edgeGain = createLoop\("bandpass", 1680, MIN_GAIN\)/);
  assert.match(audioSource, /const edgePressure = Math\.max\(skid, edge \* 0\.55\)/);
  assert.match(audioSource, /const scrapeEnergy = Math\.max\(normalized \* edgePressure, powder \* 0\.82\)/);
  assert.match(audioSource, /scrapeEnergy \* scrapeEnergy \* 0\.085 \* contact/);
  assert.match(audioSource, /edgeGain = null/);
  assert.match(sceneSource, /const powderRate = powderTarget > powderEnergy \? 36 : 4\.2/);
  assert.match(sceneSource, /uniforms\[11\] = powderEnergy \* powderSide/);
});
