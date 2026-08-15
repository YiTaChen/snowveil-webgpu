import assert from "node:assert/strict";
import test from "node:test";

import { stepClothChain } from "../app/snowveil-motion.ts";

test("damped cloth links propagate airflow from a restrained root to an inertial tail", () => {
  const positions = new Float32Array(4);
  const velocities = new Float32Array(4);

  for (let frame = 0; frame < 90; frame += 1) {
    stepClothChain(positions, velocities, 0.22, 1 / 60);
  }

  assert.ok(positions[0] > 0.02);
  assert.ok(positions[3] > positions[2]);
  assert.ok(positions[2] > positions[1]);
  assert.ok(positions[1] > positions[0]);
  assert.ok(positions[3] < 0.22);

  const tailBeforeReversal = positions[3];
  stepClothChain(positions, velocities, -0.22, 1 / 60);
  assert.ok(positions[3] > 0, "tail should retain momentum instead of snapping to the new force");
  assert.ok(positions[3] < tailBeforeReversal);

  for (let frame = 0; frame < 180; frame += 1) {
    stepClothChain(positions, velocities, -0.22, 1 / 60);
  }
  assert.ok(positions[3] < -0.12);
  for (const value of [...positions, ...velocities]) assert.ok(Number.isFinite(value));
});

test("cloth integration bounds long frames and extreme airflow", () => {
  const positions = new Float32Array(4);
  const velocities = new Float32Array(4);
  for (let frame = 0; frame < 240; frame += 1) {
    stepClothChain(positions, velocities, 100, 0.5);
  }
  assert.ok(positions[3] < 0.24);
  assert.ok(positions[3] > 0.16);
});
