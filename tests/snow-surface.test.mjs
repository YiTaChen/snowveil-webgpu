import assert from "node:assert/strict";
import test from "node:test";

import {
  decayLandingCompression,
  downhillSpeedHeadroom,
  landingImpactForVelocity,
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

test("landing response follows downward impact and decays without overshoot", () => {
  assert.equal(landingImpactForVelocity(2), 0);
  assert.equal(landingImpactForVelocity(-2.4), 0.5);
  assert.equal(landingImpactForVelocity(-9.6), 1);

  const firstFrame = decayLandingCompression(1, 1 / 60);
  const laterFrame = decayLandingCompression(firstFrame, 1 / 60);
  assert.ok(firstFrame < 1 && firstFrame > 0);
  assert.ok(laterFrame < firstFrame && laterFrame > 0);
  assert.equal(decayLandingCompression(0.7, -1), 0.7);
});
