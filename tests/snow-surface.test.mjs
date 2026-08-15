import assert from "node:assert/strict";
import test from "node:test";

import {
  downhillSpeedHeadroom,
  slopeAlongHeading,
  snowGravityAcceleration,
} from "../app/snowveil-motion.ts";
import { snowHeightAt, snowSurfaceAt } from "../app/snowveil-terrain.ts";

test("snow surface returns the rendered height and a stable central-difference slope", () => {
  const surface = snowSurfaceAt(0, 0);

  assert.equal(surface.height, snowHeightAt(0, 0));
  assert.ok(Number.isFinite(surface.slopeX));
  assert.ok(Number.isFinite(surface.slopeZ));
  assert.ok(Math.hypot(surface.slopeX, surface.slopeZ) > 0.15);
  assert.ok(Math.hypot(surface.slopeX, surface.slopeZ) < 0.35);
});

test("the same slope accelerates downhill and resists uphill travel", () => {
  const { slopeX, slopeZ } = snowSurfaceAt(0, 0);
  const downhillHeading = Math.atan2(-slopeX, slopeZ);
  const uphillHeading = Math.atan2(slopeX, -slopeZ);
  const downhillGrade = slopeAlongHeading(slopeX, slopeZ, downhillHeading);
  const uphillGrade = slopeAlongHeading(slopeX, slopeZ, uphillHeading);

  assert.ok(downhillGrade < -0.15);
  assert.ok(uphillGrade > 0.15);
  assert.ok(snowGravityAcceleration(downhillGrade) > 1.5);
  assert.ok(snowGravityAcceleration(uphillGrade) < -1.5);
  assert.ok(downhillSpeedHeadroom(downhillGrade) > 0.75);
  assert.equal(downhillSpeedHeadroom(uphillGrade), 0);
});
