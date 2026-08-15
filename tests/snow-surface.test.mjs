import assert from "node:assert/strict";
import test from "node:test";

import {
  decayLandingCompression,
  downhillSpeedHeadroom,
  landingImpactForVelocity,
  snowHistoryRegionOffset,
  slopeAlongHeading,
  snowboardBrakeDrag,
  snowboardContactAxes,
  snowboardLongAxis,
  snowboardTargetYaw,
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

test("snowboard points along travel until braking turns it across the velocity", () => {
  const heading = 0.73;
  const travel = { x: Math.sin(heading), z: -Math.cos(heading) };
  const ridingAxis = snowboardLongAxis(snowboardTargetYaw(heading, 0, 0));
  const brakingAxis = snowboardLongAxis(snowboardTargetYaw(heading, 1, 0));

  assert.ok(ridingAxis.x * travel.x + ridingAxis.z * travel.z > 0.999);
  assert.ok(Math.abs(brakingAxis.x * travel.x + brakingAxis.z * travel.z) < 0.001);
});

test("edge pressure turns the flat long ellipse into a narrow contact strip", () => {
  const flat = snowboardContactAxes(0);
  const edged = snowboardContactAxes(1);
  const flatArea = Math.PI * flat.halfLength * flat.halfWidth;
  const edgedArea = Math.PI * edged.halfLength * edged.halfWidth;

  assert.ok(flat.halfLength / flat.halfWidth > 4.5);
  assert.equal(edged.halfLength, flat.halfLength);
  assert.ok(edged.halfWidth < flat.halfWidth * 0.3);
  assert.ok(edgedArea < flatArea * 0.3);
});

test("braking drag is caused by the visible crosswise skid", () => {
  assert.equal(snowboardBrakeDrag(0), 0);
  assert.ok(snowboardBrakeDrag(0.5) > 1);
  assert.equal(snowboardBrakeDrag(1), 5.2);
  assert.ok(snowboardBrakeDrag(0.8) > snowboardBrakeDrag(0.4));
});

test("snow history update regions remain centered and inside texture bounds", () => {
  assert.deepEqual(snowHistoryRegionOffset(0, 0), { x: 351, y: 351 });
  assert.deepEqual(snowHistoryRegionOffset(-64, -64), { x: 0, y: 0 });
  assert.deepEqual(snowHistoryRegionOffset(64, 64), { x: 704, y: 704 });

  const movingRegion = snowHistoryRegionOffset(12.5, -25.5);
  assert.ok(movingRegion.x >= 0 && movingRegion.x <= 704);
  assert.ok(movingRegion.y >= 0 && movingRegion.y <= 704);
});
