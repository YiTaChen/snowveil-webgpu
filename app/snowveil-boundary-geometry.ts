import { SLOPE_FENCE_RADIUS } from "./snowveil-boundary.ts";
import { snowHeightAt } from "./snowveil-terrain.ts";
import {
  createWorldGeometryBuilder,
  normalizeVec3,
  type Vec3,
} from "./snowveil-world-geometry.ts";

export const SLOPE_BOUNDARY_POST_COUNT = 48;

export function createSlopeBoundaryGeometry() {
  const builder = createWorldGeometryBuilder();

  const addPennant = (angle: number, ropeY: number) => {
    const radial: Vec3 = [Math.cos(angle), 0, Math.sin(angle)];
    const inward: Vec3 = [-radial[0], 0, -radial[2]];
    const tangent: Vec3 = [-radial[2], 0, radial[0]];
    const center: Vec3 = [
      radial[0] * SLOPE_FENCE_RADIUS + inward[0] * 0.025,
      ropeY - 0.03,
      radial[2] * SLOPE_FENCE_RADIUS + inward[2] * 0.025,
    ];
    const points: Vec3[] = [
      [center[0] - tangent[0] * 0.3, center[1], center[2] - tangent[2] * 0.3],
      [center[0] + tangent[0] * 0.3, center[1], center[2] + tangent[2] * 0.3],
      [
        center[0] + tangent[0] * 0.18 + inward[0] * 0.035,
        center[1] - 0.34,
        center[2] + tangent[2] * 0.18 + inward[2] * 0.035,
      ],
      [
        center[0] - tangent[0] * 0.18 + inward[0] * 0.035,
        center[1] - 0.34,
        center[2] - tangent[2] * 0.18 + inward[2] * 0.035,
      ],
    ];
    builder.addPanel(points as [Vec3, Vec3, Vec3, Vec3], normalizeVec3(inward), 3);
  };

  for (let post = 0; post < SLOPE_BOUNDARY_POST_COUNT; post += 1) {
    const angle = (post / SLOPE_BOUNDARY_POST_COUNT) * Math.PI * 2;
    const x = Math.cos(angle) * SLOPE_FENCE_RADIUS;
    const z = Math.sin(angle) * SLOPE_FENCE_RADIUS;
    const ground = snowHeightAt(x, z) - 0.08;
    builder.addTaperedTube([x, ground - 0.16, z], [x, ground + 1.62, z], 0.05, 0.045, 0);
    builder.addTaperedTube([x, ground + 0.72, z], [x, ground + 0.88, z], 0.058, 0.058, 1);
    builder.addTaperedTube([x, ground + 1.22, z], [x, ground + 1.4, z], 0.058, 0.056, 1);
    builder.addTaperedTube([x, ground + 1.62, z], [x, ground + 1.73, z], 0.063, 0.012, 4);

    const ropeSegments = 6;
    for (let segment = 0; segment < ropeSegments; segment += 1) {
      const startProgress = segment / ropeSegments;
      const endProgress = (segment + 1) / ropeSegments;
      const startAngle = ((post + startProgress) / SLOPE_BOUNDARY_POST_COUNT) * Math.PI * 2;
      const endAngle = ((post + endProgress) / SLOPE_BOUNDARY_POST_COUNT) * Math.PI * 2;
      const pointAt = (sampleAngle: number, progress: number): Vec3 => {
        const sampleX = Math.cos(sampleAngle) * SLOPE_FENCE_RADIUS;
        const sampleZ = Math.sin(sampleAngle) * SLOPE_FENCE_RADIUS;
        const sag = Math.sin(progress * Math.PI) * 0.17;
        return [sampleX, snowHeightAt(sampleX, sampleZ) + 0.92 - sag, sampleZ];
      };
      builder.addTaperedTube(
        pointAt(startAngle, startProgress),
        pointAt(endAngle, endProgress),
        0.024,
        0.024,
        2,
        6,
      );
    }

    const flagProgress = 0.5;
    const flagAngle = ((post + flagProgress) / SLOPE_BOUNDARY_POST_COUNT) * Math.PI * 2;
    const flagX = Math.cos(flagAngle) * SLOPE_FENCE_RADIUS;
    const flagZ = Math.sin(flagAngle) * SLOPE_FENCE_RADIUS;
    const flagY = snowHeightAt(flagX, flagZ) + 0.92 - Math.sin(flagProgress * Math.PI) * 0.17;
    addPennant(flagAngle, flagY);
  }

  return builder.finish();
}
