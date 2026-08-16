import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("spindrift stays a single depth-tested procedural draw", async () => {
  const source = await readFile(new URL("../app/snowveil-scene.tsx", import.meta.url), "utf8");

  assert.match(source, /const spindriftParticleCount = 768/);
  assert.match(source, /entryPoint: "updateSpindrift"/);
  assert.match(source, /dispatchWorkgroups\(Math\.ceil\(spindriftParticleCount \/ 64\)\)/);
  assert.match(source, /topology: "triangle-strip"/);
  assert.match(source, /depthWriteEnabled: false,[\s\S]*?depthCompare: "less"/);
  assert.match(source, /pass\.setBindGroup\(0, spindriftBindGroup\)/);
  assert.match(source, /pass\.draw\(4, spindriftParticleCount\)/);
  assert.doesNotMatch(source, /spindriftVertexBuffer/);
});
