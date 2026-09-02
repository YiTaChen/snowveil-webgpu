export type SnowCourseJumpFeature = {
  id: string;
  x: number;
  lipZ: number;
  halfWidth: number;
  approachLength: number;
  height: number;
  dropLength: number;
  minimumSpeed: number;
  launchVelocity: number;
};

export type SnowCourseMoundFeature = {
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
  height: number;
};

export const RIDGE_RUN_START_Z = 42;
export const RIDGE_RUN_FINISH_Z = -42;
export const RIDGE_RUN_HALF_WIDTH = 9.4;

/**
 * Authored terrain-park features shared by CPU contact, WGSL terrain, marker
 * geometry, and takeoff rules. Keeping one source of dimensions prevents a
 * visible lip from drifting away from its physical launch trigger.
 */
export const RIDGE_RUN_JUMPS: readonly SnowCourseJumpFeature[] = [
  {
    id: "wind-lip",
    x: 0,
    lipZ: 14,
    halfWidth: 3.35,
    approachLength: 6.8,
    height: 1.34,
    dropLength: 2.25,
    minimumSpeed: 4.2,
    launchVelocity: 3.45,
  },
  {
    id: "lower-kicker",
    x: 0,
    lipZ: -17,
    halfWidth: 3.05,
    approachLength: 6.2,
    height: 1.48,
    dropLength: 2.45,
    minimumSpeed: 4.6,
    launchVelocity: 3.8,
  },
];

export const RIDGE_RUN_MOUNDS: readonly SnowCourseMoundFeature[] = [
  { x: -3.55, z: 28, radiusX: 1.75, radiusZ: 2.65, height: 0.78 },
  { x: 3.8, z: 4, radiusX: 1.95, radiusZ: 2.9, height: 1.02 },
  { x: -3.15, z: -29, radiusX: 1.8, radiusZ: 2.55, height: 0.84 },
  { x: 5.9, z: -9, radiusX: 1.4, radiusZ: 2.15, height: 0.58 },
];
