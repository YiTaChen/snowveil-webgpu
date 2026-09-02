import assert from "node:assert/strict";
import test from "node:test";

import {
  decayLandingCompression,
  downhillSpeedHeadroom,
  landingImpactForVelocity,
  nextRenderScale,
  riderAnimationState,
  riderPoseBlend,
  riderTransitionRate,
  snowHistoryRegionOffset,
  slopeAlongHeading,
  snowboardBrakeDrag,
  snowboardContactAxes,
  snowboardLongAxis,
  snowboardLinkedTurnTarget,
  snowboardSkidAmount,
  snowboardSteerResponseRate,
  snowboardTargetYaw,
  snowboardTravelTurnRate,
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
  assert.equal(snowboardSkidAmount(snowboardTargetYaw(heading, 0, 0), heading), 0);
  assert.equal(snowboardSkidAmount(snowboardTargetYaw(heading, 1, 0), heading), 1);
});

test("the nose leads a carve while a crosswise brake stops redirecting travel", () => {
  const heading = -0.45;
  const straightYaw = snowboardTargetYaw(heading, 0, 0);
  const carveYaw = snowboardTargetYaw(heading, 0, 1);

  assert.ok(carveYaw > straightYaw);
  assert.ok(snowboardSkidAmount(carveYaw, heading) < 0.22);
  assert.ok(snowboardTravelTurnRate(5.4, 0) > snowboardTravelTurnRate(1, 0));
  assert.equal(snowboardTravelTurnRate(5.4, 1), 0);
});

test("a committed carve fits a linked turn inside the Downline corridor", () => {
  const speed = 8.6;
  const heading = 0;
  const fullCarveYaw = snowboardTargetYaw(heading, 0, 1);
  const carveAngle = Math.abs(fullCarveYaw - (heading - Math.PI / 2));
  const angularSpeed = carveAngle * snowboardTravelTurnRate(speed, 0);
  const estimatedRadius = speed / angularSpeed;

  assert.ok(carveAngle > 0.3 && carveAngle < 0.34);
  assert.ok(estimatedRadius > 4 && estimatedRadius < 5.5);
});

test("opposite input releases and changes edge faster than a held carve", () => {
  const heldRate = snowboardSteerResponseRate(0.7, 1);
  const edgeChangeRate = snowboardSteerResponseRate(0.7, -1);

  assert.equal(heldRate, 9.5);
  assert.equal(edgeChangeRate, 15);
  assert.ok(edgeChangeRate > heldRate);
});

test("linked-turn target alternates across the fall line and recentres near an edge", () => {
  const firstSide = snowboardLinkedTurnTarget(Math.PI / (2 * 1.75), 0);
  const otherSide = snowboardLinkedTurnTarget((Math.PI * 3) / (2 * 1.75), 0);
  const centredFromRightEdge = snowboardLinkedTurnTarget(0, 5);

  assert.ok(firstSide > 0.57);
  assert.ok(otherSide < -0.57);
  assert.ok(centredFromRightEdge < 0);
});

test("the linked-turn controller completes repeated S turns without touching course ropes", () => {
  const delta = 1 / 120;
  const speed = 8.6;
  let lateralPosition = 0;
  let heading = 0;
  let boardYaw = snowboardTargetYaw(heading, 0, 0);
  let steer = 0;
  let minimumLateralPosition = 0;
  let maximumLateralPosition = 0;
  let crossedLeft = false;
  let crossedRight = false;

  const angleDelta = (target, current) =>
    Math.atan2(Math.sin(target - current), Math.cos(target - current));

  for (let elapsed = 0; elapsed < 8.1; elapsed += delta) {
    const targetHeading = snowboardLinkedTurnTarget(elapsed, lateralPosition);
    const steerInput = Math.max(-1, Math.min(1, angleDelta(targetHeading, heading) * 3.2));
    const steerRate = snowboardSteerResponseRate(steer, steerInput);
    steer += (steerInput - steer) * (1 - Math.exp(-delta * steerRate));

    const targetBoardYaw = snowboardTargetYaw(heading, 0, steer);
    boardYaw += angleDelta(targetBoardYaw, boardYaw) * (1 - Math.exp(-delta * 11));
    heading +=
      angleDelta(boardYaw + Math.PI / 2, heading) *
      (1 - Math.exp(-delta * snowboardTravelTurnRate(speed, 0)));
    lateralPosition += Math.sin(heading) * speed * delta;

    minimumLateralPosition = Math.min(minimumLateralPosition, lateralPosition);
    maximumLateralPosition = Math.max(maximumLateralPosition, lateralPosition);
    crossedLeft ||= lateralPosition < -1.5;
    crossedRight ||= lateralPosition > 1.5;
  }

  assert.ok(crossedLeft && crossedRight);
  assert.ok(minimumLateralPosition > -6.65);
  assert.ok(maximumLateralPosition < 6.65);
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
  assert.ok(snowboardBrakeDrag(0.5) > 0.8);
  assert.equal(snowboardBrakeDrag(1), 3.6);
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

test("dynamic render scale responds inside a quality floor with hysteresis", () => {
  assert.equal(nextRenderScale(1, 45, 33.4), 0.96);
  assert.equal(nextRenderScale(0.86, 50, 33.4), 0.84);
  assert.equal(nextRenderScale(0.84, 40, 50), 0.84);
  assert.equal(nextRenderScale(0.86, 60, 17.5), 0.88);
  assert.equal(nextRenderScale(0.88, 58, 17.5), 0.88);
  assert.equal(nextRenderScale(0.88, 60, 20), 0.88);
});

test("rider pose states prioritize contact causality and blend without overshoot", () => {
  assert.equal(riderAnimationState(0, 0, 0, 0), "idle");
  assert.equal(riderAnimationState(4, 0.2, 0, 0), "ride");
  assert.equal(riderAnimationState(1.2, 0.8, 0, 0), "brake");
  assert.equal(riderAnimationState(5, 1, 0.4, 0.8), "air");
  assert.equal(riderAnimationState(2, 0.8, 0, 0.7), "land");

  const airBlend = riderPoseBlend(0, 1, 1 / 60, riderTransitionRate("air"));
  const nextAirBlend = riderPoseBlend(airBlend, 1, 1 / 60, riderTransitionRate("air"));
  assert.ok(airBlend > 0 && airBlend < 1);
  assert.ok(nextAirBlend > airBlend && nextAirBlend < 1);
  assert.equal(riderPoseBlend(0.7, 0, -1, 12), 0.7);
  assert.equal(riderPoseBlend(2, -1, 0, 12), 1);
});
