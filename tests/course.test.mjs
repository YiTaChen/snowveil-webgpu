import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_MATERIAL,
  createSnowveilCourseGeometry,
} from "../app/snowveil-course-geometry.ts";
import {
  DOWNLINE_COURSE,
  RIDGE_RUN_COURSE,
  SNOWVEIL_COURSES,
  courseDistanceRemaining,
  courseProgress,
  crossedCourseFinish,
  crossedCourseJump,
  formatRaceTime,
  getSnowveilCourse,
  resolveCourseBoundary,
} from "../app/snowveil-course.ts";
import { snowHeightAt, snowSurfaceAt } from "../app/snowveil-terrain.ts";

test("Downline is a data-defined course with stable progress and race timing", () => {
  assert.equal(getSnowveilCourse("downline"), DOWNLINE_COURSE);
  assert.equal(getSnowveilCourse("ridge-run"), RIDGE_RUN_COURSE);
  assert.equal(getSnowveilCourse("missing"), null);
  assert.equal(SNOWVEIL_COURSES.length, 2);
  assert.equal(DOWNLINE_COURSE.terrainMode, "downline");
  assert.equal(courseProgress(DOWNLINE_COURSE, DOWNLINE_COURSE.startZ), 0);
  assert.equal(courseProgress(DOWNLINE_COURSE, DOWNLINE_COURSE.finishZ), 1);
  assert.equal(courseProgress(DOWNLINE_COURSE, 999), 0);
  assert.equal(courseProgress(DOWNLINE_COURSE, -999), 1);
  assert.equal(courseDistanceRemaining(DOWNLINE_COURSE, 0), 32);
  assert.equal(courseDistanceRemaining(DOWNLINE_COURSE, -40), 0);
  assert.equal(crossedCourseFinish(DOWNLINE_COURSE, -31.9, -32.1), true);
  assert.equal(crossedCourseFinish(DOWNLINE_COURSE, -32.1, -32.4), false);
  assert.equal(formatRaceTime(0), "00:00.00");
  assert.equal(formatRaceTime(65_432), "01:05.43");
  assert.equal(formatRaceTime(-50), "00:00.00");
});

test("Ridge Run is a longer data-defined freestyle course with two physical lips", () => {
  assert.equal(RIDGE_RUN_COURSE.terrainMode, "ridge-run");
  assert.equal(RIDGE_RUN_COURSE.jumps.length, 2);
  assert.ok(RIDGE_RUN_COURSE.startZ - RIDGE_RUN_COURSE.finishZ > 80);
  assert.ok(RIDGE_RUN_COURSE.halfWidth > DOWNLINE_COURSE.halfWidth);
  assert.equal(courseProgress(RIDGE_RUN_COURSE, RIDGE_RUN_COURSE.startZ), 0);
  assert.equal(courseProgress(RIDGE_RUN_COURSE, RIDGE_RUN_COURSE.finishZ), 1);
});

test("Downline terrain forms a continuous monotonic fall line", () => {
  const samples = [30, 20, 10, 0, -10, -20, -32].map((z) =>
    snowHeightAt(0, z, "downline"),
  );

  for (let index = 1; index < samples.length; index += 1) {
    assert.ok(samples[index] < samples[index - 1], "course should descend toward the goal");
  }

  const surface = snowSurfaceAt(0, 0, 0.36, "downline");
  assert.ok(surface.slopeZ > 0.1, "height should rise toward the start");
  assert.ok(Math.abs(surface.slopeX) < 0.03, "center line should not have a lateral camber");
});

test("Ridge Run terrain descends overall but retains kickers, mounds, and broken snow", () => {
  const start = snowHeightAt(0, RIDGE_RUN_COURSE.startZ, "ridge-run");
  const finish = snowHeightAt(0, RIDGE_RUN_COURSE.finishZ, "ridge-run");
  const firstJump = RIDGE_RUN_COURSE.jumps[0];
  const approach = snowHeightAt(
    firstJump.x,
    firstJump.lipZ + firstJump.approachLength,
    "ridge-run",
  );
  const lip = snowHeightAt(firstJump.x, firstJump.lipZ, "ridge-run");
  const postLip = snowHeightAt(
    firstJump.x,
    firstJump.lipZ - firstJump.dropLength - 0.3,
    "ridge-run",
  );
  const mound = snowHeightAt(-3.55, 28, "ridge-run");
  const besideMound = snowHeightAt(-0.5, 28, "ridge-run");
  const slopes = [34, 26, 19, 15, 6, -5, -16, -27, -36].map(
    (z) => snowSurfaceAt(0, z, 0.24, "ridge-run").slopeZ,
  );

  assert.ok(start - finish > 8, "course should retain a mountain-scale descent");
  assert.ok(lip > approach + 0.35, "the first approach should rise into a visible lip");
  assert.ok(lip > postLip + 0.75, "terrain should drop away after the lip");
  assert.ok(mound > besideMound + 0.35, "authored side pile should interrupt the piste");
  assert.ok(Math.min(...slopes) < -0.08, "kickers should contain uphill takeoff grade");
  assert.ok(Math.max(...slopes) > 0.1, "rollers and landings should return downhill");
});

test("Ridge Run launches only forward riders who cross a marked lip at enough speed", () => {
  const jump = RIDGE_RUN_COURSE.jumps[0];
  const launched = crossedCourseJump(
    RIDGE_RUN_COURSE,
    0,
    jump.lipZ + 0.2,
    0.1,
    jump.lipZ - 0.2,
    jump.minimumSpeed + 1,
  );
  const tooSlow = crossedCourseJump(
    RIDGE_RUN_COURSE,
    0,
    jump.lipZ + 0.2,
    0,
    jump.lipZ - 0.2,
    jump.minimumSpeed - 0.1,
  );
  const outside = crossedCourseJump(
    RIDGE_RUN_COURSE,
    jump.halfWidth + 1,
    jump.lipZ + 0.2,
    jump.halfWidth + 1,
    jump.lipZ - 0.2,
    jump.minimumSpeed + 1,
  );

  assert.equal(launched?.id, jump.id);
  assert.equal(tooSlow, null);
  assert.equal(outside, null);
});

test("course boundary gives an early inward guide and a recoverable hard response", () => {
  const warningX = DOWNLINE_COURSE.halfWidth - DOWNLINE_COURSE.boundaryInset - 0.5;
  const guided = resolveCourseBoundary(
    DOWNLINE_COURSE,
    warningX,
    0,
    Math.PI * 0.25,
    5,
    1 / 60,
  );
  assert.ok(guided.approach > 0);
  assert.ok(guided.heading < Math.PI * 0.25);
  assert.ok(guided.speed < 5);
  assert.equal(guided.collided, false);

  const crossed = resolveCourseBoundary(
    DOWNLINE_COURSE,
    DOWNLINE_COURSE.halfWidth,
    0,
    Math.PI * 0.25,
    5,
    1 / 60,
  );
  assert.equal(crossed.collided, true);
  assert.ok(
    Math.abs(crossed.x) <=
      DOWNLINE_COURSE.halfWidth - DOWNLINE_COURSE.boundaryInset + 1e-6,
  );
  assert.ok(Math.sin(crossed.heading) < 0, "reflected rider should face back into the course");
  assert.ok(crossed.speed > 0 && crossed.speed < 5);

  const retreating = resolveCourseBoundary(
    DOWNLINE_COURSE,
    warningX,
    0,
    -Math.PI * 0.25,
    3.2,
    1 / 60,
  );
  assert.equal(retreating.approach, 0);
  assert.equal(retreating.heading, -Math.PI * 0.25);
  assert.equal(retreating.speed, 3.2);
});

test("procedural course geometry contains marked sides, checker lines, and goal flags", () => {
  const geometry = createSnowveilCourseGeometry(DOWNLINE_COURSE);
  const parts = new Set();
  let minimumX = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let minimumZ = Number.POSITIVE_INFINITY;
  let maximumZ = Number.NEGATIVE_INFINITY;

  assert.ok(geometry.vertices.length > 6_000);
  assert.ok(geometry.indices.length > 8_000);
  assert.equal(geometry.vertices.length % 7, 0);
  assert.equal(geometry.indices.length % 3, 0);

  for (let offset = 0; offset < geometry.vertices.length; offset += 7) {
    const x = geometry.vertices[offset];
    const y = geometry.vertices[offset + 1];
    const z = geometry.vertices[offset + 2];
    const part = geometry.vertices[offset + 6];
    assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z));
    minimumX = Math.min(minimumX, x);
    maximumX = Math.max(maximumX, x);
    minimumZ = Math.min(minimumZ, z);
    maximumZ = Math.max(maximumZ, z);
    parts.add(part);
  }

  assert.ok(minimumX < -DOWNLINE_COURSE.halfWidth);
  assert.ok(maximumX > DOWNLINE_COURSE.halfWidth);
  assert.ok(minimumZ <= DOWNLINE_COURSE.finishZ - 0.45);
  assert.ok(maximumZ >= DOWNLINE_COURSE.startZ + 0.45);
  for (const part of Object.values(COURSE_MATERIAL)) {
    assert.ok(parts.has(part), `missing course material part ${part}`);
  }
  for (const index of geometry.indices) {
    assert.ok(index >= 0 && index < geometry.vertices.length / 7);
  }
});

test("Ridge Run geometry reuses the course kit and adds paired jump markers", () => {
  const downline = createSnowveilCourseGeometry(DOWNLINE_COURSE);
  const ridgeRun = createSnowveilCourseGeometry(RIDGE_RUN_COURSE);

  assert.ok(ridgeRun.vertices.length > downline.vertices.length);
  assert.ok(ridgeRun.indices.length > downline.indices.length);
  for (const jump of RIDGE_RUN_COURSE.jumps) {
    const markerZ = jump.lipZ + 0.42;
    let nearbyMarkerVertices = 0;
    for (let offset = 0; offset < ridgeRun.vertices.length; offset += 7) {
      const x = ridgeRun.vertices[offset];
      const z = ridgeRun.vertices[offset + 2];
      const expectedOffset = jump.halfWidth + 0.7;
      if (
        Math.abs(z - markerZ) < 0.15 &&
        Math.abs(Math.abs(x - jump.x) - expectedOffset) < 0.7
      ) {
        nearbyMarkerVertices += 1;
      }
    }
    assert.ok(nearbyMarkerVertices > 20, `missing marker pair for ${jump.id}`);
  }
});
