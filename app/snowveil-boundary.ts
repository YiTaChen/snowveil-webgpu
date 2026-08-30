export const SLOPE_FENCE_RADIUS = 51.6;
export const SLOPE_BOUNDARY_RADIUS = 50.2;
export const SLOPE_BOUNDARY_WARNING_RADIUS = 43.5;

const angleDelta = (target: number, current: number) =>
  Math.atan2(Math.sin(target - current), Math.cos(target - current));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export type SlopeBoundaryResolution = {
  x: number;
  z: number;
  heading: number;
  speed: number;
  approach: number;
  collided: boolean;
};

/**
 * Steer an outward-moving rider along the marked fence before resolving the
 * final collision. The fallback reflection always points back into the slope,
 * so the boundary cannot trap a rider against an invisible radial clamp.
 */
export function resolveSlopeBoundary(
  x: number,
  z: number,
  heading: number,
  speed: number,
  delta: number,
): SlopeBoundaryResolution {
  const radius = Math.hypot(x, z);
  if (radius < 0.001) {
    return { x, z, heading, speed, approach: 0, collided: false };
  }

  const radialX = x / radius;
  const radialZ = z / radius;
  const forwardX = Math.sin(heading);
  const forwardZ = -Math.cos(heading);
  const outwardMotion = Math.max(0, forwardX * radialX + forwardZ * radialZ);
  const proximity = smoothstep(
    SLOPE_BOUNDARY_WARNING_RADIUS,
    SLOPE_BOUNDARY_RADIUS,
    radius,
  );
  const approach = proximity * outwardMotion;
  const frameDelta = Math.max(0, Math.min(delta, 0.05));
  let resolvedHeading = heading;
  let resolvedSpeed = Math.max(0, speed);

  if (approach > 0.001) {
    const radialHeading = Math.atan2(radialX, -radialZ);
    const tangentA = radialHeading + Math.PI / 2;
    const tangentB = radialHeading - Math.PI / 2;
    const tangentHeading =
      Math.abs(angleDelta(tangentA, heading)) < Math.abs(angleDelta(tangentB, heading))
        ? tangentA
        : tangentB;
    const guideRate = 0.7 + approach * 3.2;
    resolvedHeading +=
      angleDelta(tangentHeading, resolvedHeading) *
      (1 - Math.exp(-frameDelta * guideRate));
    resolvedSpeed *= Math.exp(-frameDelta * approach * 1.7);
  }

  if (radius <= SLOPE_BOUNDARY_RADIUS) {
    return {
      x,
      z,
      heading: resolvedHeading,
      speed: resolvedSpeed,
      approach,
      collided: false,
    };
  }

  const reflectedX = forwardX - radialX * outwardMotion * 2;
  const reflectedZ = forwardZ - radialZ * outwardMotion * 2;
  if (outwardMotion > 0.001) {
    resolvedHeading = Math.atan2(reflectedX, -reflectedZ);
    resolvedSpeed *= 0.58;
  }
  const boundaryScale = SLOPE_BOUNDARY_RADIUS / radius;
  return {
    x: x * boundaryScale,
    z: z * boundaryScale,
    heading: resolvedHeading,
    speed: resolvedSpeed,
    approach: Math.max(approach, 1),
    collided: true,
  };
}
