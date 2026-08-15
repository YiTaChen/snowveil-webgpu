import assert from "node:assert/strict";
import test from "node:test";

import { createRiderGeometry } from "../app/snowveil-rider-geometry.ts";

test("rider geometry keeps finite indexed surfaces and articulated part groups", () => {
  const { vertices, indices } = createRiderGeometry();
  assert.equal(vertices.length % 7, 0);
  assert.ok(vertices.length > 20_000);
  assert.ok(indices.length > 20_000);

  const vertexCount = vertices.length / 7;
  const partCounts = new Map();
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const offset = vertex * 7;
    for (let component = 0; component < 6; component += 1) {
      assert.ok(Number.isFinite(vertices[offset + component]));
    }
    const part = vertices[offset + 6];
    assert.equal(part, Math.round(part));
    partCounts.set(part, (partCounts.get(part) ?? 0) + 1);
  }

  for (const index of indices) {
    assert.ok(index < vertexCount);
  }

  for (const part of [12, 13, 17, 18, 19, 20, 21]) {
    assert.ok((partCounts.get(part) ?? 0) > 100, `missing articulated rider part ${part}`);
  }
  assert.ok((partCounts.get(14) ?? 0) > 40, "missing authored board top");
  assert.ok((partCounts.get(15) ?? 0) > 80, "missing authored board base and edge");
});
