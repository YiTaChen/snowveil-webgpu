import assert from "node:assert/strict";
import test from "node:test";

import {
  SLOPE_BOUNDARY_RADIUS,
  SLOPE_BOUNDARY_WARNING_RADIUS,
  SLOPE_FENCE_RADIUS,
  resolveSlopeBoundary,
} from "../app/snowveil-boundary.ts";
import {
  createSlopeBoundaryGeometry,
  SLOPE_BOUNDARY_POST_COUNT,
} from "../app/snowveil-boundary-geometry.ts";

test("procedural slope fence forms a finite marked ring outside the ride limit", () => {
  const geometry = createSlopeBoundaryGeometry();
  const parts = new Map();
  let minimumRadius = Number.POSITIVE_INFINITY;
  let maximumRadius = 0;

  assert.equal(SLOPE_BOUNDARY_POST_COUNT, 48);
  assert.ok(geometry.vertices.length > 10_000);
  assert.ok(geometry.indices.length > 18_000);
  assert.equal(geometry.vertices.length % 7, 0);
  assert.equal(geometry.indices.length % 3, 0);

  for (let offset = 0; offset < geometry.vertices.length; offset += 7) {
    const x = geometry.vertices[offset];
    const z = geometry.vertices[offset + 2];
    const part = geometry.vertices[offset + 6];
    assert.ok(Number.isFinite(x));
    assert.ok(Number.isFinite(geometry.vertices[offset + 1]));
    assert.ok(Number.isFinite(z));
    const radius = Math.hypot(x, z);
    minimumRadius = Math.min(minimumRadius, radius);
    maximumRadius = Math.max(maximumRadius, radius);
    parts.set(part, (parts.get(part) ?? 0) + 1);
  }

  assert.ok(minimumRadius > SLOPE_BOUNDARY_RADIUS);
  assert.ok(minimumRadius > SLOPE_FENCE_RADIUS - 0.4);
  assert.ok(maximumRadius < SLOPE_FENCE_RADIUS + 0.1);
  for (const part of [0, 1, 2, 3, 4]) {
    assert.ok((parts.get(part) ?? 0) > 40, `missing boundary material part ${part}`);
  }
  for (const index of geometry.indices) {
    assert.ok(index >= 0 && index < geometry.vertices.length / 7);
  }
});

test("marked boundary guides outward travel and reflects a hard crossing inward", () => {
  assert.ok(SLOPE_BOUNDARY_WARNING_RADIUS < SLOPE_BOUNDARY_RADIUS);
  assert.ok(SLOPE_BOUNDARY_RADIUS < SLOPE_FENCE_RADIUS);

  const guided = resolveSlopeBoundary(0, -47.5, 0, 5.4, 1 / 60);
  assert.ok(guided.approach > 0.25);
  assert.notEqual(guided.heading, 0);
  assert.ok(guided.speed < 5.4);
  assert.equal(guided.collided, false);

  const crossed = resolveSlopeBoundary(0, -52, 0, 5, 1 / 60);
  assert.equal(crossed.collided, true);
  assert.ok(Math.hypot(crossed.x, crossed.z) <= SLOPE_BOUNDARY_RADIUS + 1e-6);
  const reflectedForwardZ = -Math.cos(crossed.heading);
  assert.ok(reflectedForwardZ > 0.9, "crossing should point the rider back into the slope");
  assert.ok(crossed.speed > 0 && crossed.speed < 5);

  const retreating = resolveSlopeBoundary(0, -47.5, Math.PI, 3.2, 1 / 60);
  assert.equal(retreating.approach, 0);
  assert.equal(retreating.heading, Math.PI);
  assert.equal(retreating.speed, 3.2);
});
