import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_MATERIAL,
  createSnowveilCourseGeometry,
} from "../app/snowveil-course-geometry.ts";
import {
  DOWNLINE_COURSE,
  courseDistanceRemaining,
  courseProgress,
  crossedCourseFinish,
  formatRaceTime,
  getSnowveilCourse,
  resolveCourseBoundary,
} from "../app/snowveil-course.ts";
import { snowHeightAt, snowSurfaceAt } from "../app/snowveil-terrain.ts";

test("Downline is a data-defined course with stable progress and race timing", () => {
  assert.equal(getSnowveilCourse("downline"), DOWNLINE_COURSE);
  assert.equal(getSnowveilCourse("missing"), null);
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
