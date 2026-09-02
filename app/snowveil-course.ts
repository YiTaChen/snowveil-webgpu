import type { SnowTerrainMode } from "./snowveil-terrain.ts";
import {
  RIDGE_RUN_FINISH_Z,
  RIDGE_RUN_HALF_WIDTH,
  RIDGE_RUN_JUMPS,
  RIDGE_RUN_START_Z,
  type SnowCourseJumpFeature,
} from "./snowveil-course-features.ts";

export type SnowveilCourse = {
  id: string;
  name: string;
  discipline: string;
  terrainMode: SnowTerrainMode;
  startX: number;
  startZ: number;
  finishZ: number;
  halfWidth: number;
  boundaryInset: number;
  resultDelaySeconds: number;
  startPrompt: string;
  jumps: readonly SnowCourseJumpFeature[];
};

export const DOWNLINE_COURSE: SnowveilCourse = {
  id: "downline",
  name: "Downline 01",
  discipline: "Straight descent",
  terrainMode: "downline",
  startX: 0,
  startZ: 30,
  finishZ: -32,
  halfWidth: 7.2,
  boundaryInset: 0.55,
  resultDelaySeconds: 3,
  startPrompt: "Hold the fall line",
  jumps: [],
};

export const RIDGE_RUN_COURSE: SnowveilCourse = {
  id: "ridge-run",
  name: "Ridge Run 02",
  discipline: "Natural freestyle",
  terrainMode: "ridge-run",
  startX: 0,
  startZ: RIDGE_RUN_START_Z,
  finishZ: RIDGE_RUN_FINISH_Z,
  halfWidth: RIDGE_RUN_HALF_WIDTH,
  boundaryInset: 0.65,
  resultDelaySeconds: 3,
  startPrompt: "Read the rollers",
  jumps: RIDGE_RUN_JUMPS,
};

export const SNOWVEIL_COURSES: readonly SnowveilCourse[] = [
  DOWNLINE_COURSE,
  RIDGE_RUN_COURSE,
];

export function getSnowveilCourse(id: string | null) {
  return SNOWVEIL_COURSES.find((course) => course.id === id) ?? null;
}

const angleDelta = (target: number, current: number) =>
  Math.atan2(Math.sin(target - current), Math.cos(target - current));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export function courseProgress(course: SnowveilCourse, z: number) {
  return Math.max(
    0,
    Math.min(1, (course.startZ - z) / (course.startZ - course.finishZ)),
  );
}

export function courseDistanceRemaining(course: SnowveilCourse, z: number) {
  return Math.max(0, z - course.finishZ);
}

export function crossedCourseFinish(course: SnowveilCourse, previousZ: number, z: number) {
  return previousZ > course.finishZ && z <= course.finishZ;
}

export function crossedCourseJump(
  course: SnowveilCourse,
  previousX: number,
  previousZ: number,
  x: number,
  z: number,
  speed: number,
) {
  const forwardDistance = previousZ - z;
  if (forwardDistance <= 0) return null;

  for (const jump of course.jumps) {
    if (previousZ <= jump.lipZ || z > jump.lipZ || speed < jump.minimumSpeed) {
      continue;
    }
    const crossingProgress = Math.max(
      0,
      Math.min(1, (previousZ - jump.lipZ) / forwardDistance),
    );
    const crossingX = previousX + (x - previousX) * crossingProgress;
    if (Math.abs(crossingX - jump.x) <= jump.halfWidth) return jump;
  }

  return null;
}

export function formatRaceTime(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const minutes = Math.floor(safeMilliseconds / 60_000);
  const seconds = Math.floor((safeMilliseconds % 60_000) / 1000);
  const hundredths = Math.floor((safeMilliseconds % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}`;
}

export type CourseBoundaryResolution = {
  x: number;
  z: number;
  heading: number;
  speed: number;
  approach: number;
  collided: boolean;
};

/**
 * Keep the rider inside a data-defined course corridor. It shares the same
 * response packet as the original circular boundary, allowing the scene loop
 * to switch level rules without duplicating movement or UI code.
 */
export function resolveCourseBoundary(
  course: SnowveilCourse,
  x: number,
  z: number,
  heading: number,
  speed: number,
  delta: number,
): CourseBoundaryResolution {
  const hardLimit = course.halfWidth - course.boundaryInset;
  const warningLimit = hardLimit - 1.5;
  const side = x < 0 ? -1 : 1;
  const forwardX = Math.sin(heading);
  const forwardZ = -Math.cos(heading);
  const outwardMotion = Math.max(0, forwardX * side);
  const proximity = smoothstep(warningLimit, hardLimit, Math.abs(x));
  const approach = proximity * outwardMotion;
  const frameDelta = Math.max(0, Math.min(delta, 0.05));
  let resolvedX = x;
  let resolvedZ = z;
  let resolvedHeading = heading;
  let resolvedSpeed = Math.max(0, speed);
  let collided = false;

  if (approach > 0.001) {
    const guideRate = 0.85 + approach * 3.6;
    resolvedHeading +=
      angleDelta(0, resolvedHeading) * (1 - Math.exp(-frameDelta * guideRate));
    resolvedSpeed *= Math.exp(-frameDelta * approach * 1.25);
  }

  if (Math.abs(resolvedX) > hardLimit) {
    resolvedX = side * hardLimit;
    if (outwardMotion > 0.001) {
      const reflectedX = -forwardX * 0.82;
      resolvedHeading = Math.atan2(reflectedX, -forwardZ);
      resolvedSpeed *= 0.68;
    }
    collided = true;
  }

  const upperLimit = course.startZ + 3.2;
  if (resolvedZ > upperLimit) {
    resolvedZ = upperLimit;
    if (forwardZ > 0) {
      resolvedHeading = Math.atan2(forwardX * 0.45, 1);
      resolvedSpeed *= 0.58;
    }
    collided = true;
  }

  return {
    x: resolvedX,
    z: resolvedZ,
    heading: resolvedHeading,
    speed: resolvedSpeed,
    approach: collided ? Math.max(approach, 1) : approach,
    collided,
  };
}
