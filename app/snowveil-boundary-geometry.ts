import { SLOPE_FENCE_RADIUS } from "./snowveil-boundary.ts";
import { snowHeightAt } from "./snowveil-terrain.ts";

type Vec3 = [number, number, number];

export const SLOPE_BOUNDARY_POST_COUNT = 48;

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export function createSlopeBoundaryGeometry() {
  const vertices: number[] = [];
  const indices: number[] = [];

  const addVertex = (position: Vec3, normal: Vec3, part: number) => {
    const index = vertices.length / 7;
    vertices.push(...position, ...normal, part);
    return index;
  };

  const addTaperedTube = (
    start: Vec3,
    end: Vec3,
    startRadius: number,
    endRadius: number,
    part: number,
    sides = 7,
  ) => {
    const direction = normalize([end[0] - start[0], end[1] - start[1], end[2] - start[2]]);
    const reference: Vec3 = Math.abs(direction[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
    const tangent = normalize(cross(direction, reference));
    const bitangent = normalize(cross(direction, tangent));
    const base = vertices.length / 7;
    for (let ring = 0; ring < 2; ring += 1) {
      const center = ring === 0 ? start : end;
      const radius = ring === 0 ? startRadius : endRadius;
      for (let side = 0; side <= sides; side += 1) {
        const angle = (side / sides) * Math.PI * 2;
        const radial = normalize([
          tangent[0] * Math.cos(angle) + bitangent[0] * Math.sin(angle),
          tangent[1] * Math.cos(angle) + bitangent[1] * Math.sin(angle),
          tangent[2] * Math.cos(angle) + bitangent[2] * Math.sin(angle),
        ]);
        addVertex(
          [
            center[0] + radial[0] * radius,
            center[1] + radial[1] * radius,
            center[2] + radial[2] * radius,
          ],
          radial,
          part,
        );
      }
    }
    const row = sides + 1;
    for (let side = 0; side < sides; side += 1) {
      const startLeft = base + side;
      const startRight = startLeft + 1;
      const endLeft = startLeft + row;
      const endRight = endLeft + 1;
      indices.push(startLeft, endLeft, startRight, startRight, endLeft, endRight);
    }
  };

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
    const inwardNormal = normalize(inward);
    const front = points.map((point) => addVertex(point, inwardNormal, 3));
    indices.push(front[0], front[1], front[2], front[0], front[2], front[3]);
    const backNormal: Vec3 = [-inwardNormal[0], 0, -inwardNormal[2]];
    const back = points.map((point) => addVertex(point, backNormal, 3));
    indices.push(back[2], back[1], back[0], back[3], back[2], back[0]);
  };

  for (let post = 0; post < SLOPE_BOUNDARY_POST_COUNT; post += 1) {
    const angle = (post / SLOPE_BOUNDARY_POST_COUNT) * Math.PI * 2;
    const x = Math.cos(angle) * SLOPE_FENCE_RADIUS;
    const z = Math.sin(angle) * SLOPE_FENCE_RADIUS;
    const ground = snowHeightAt(x, z) - 0.08;
    addTaperedTube([x, ground - 0.16, z], [x, ground + 1.62, z], 0.05, 0.045, 0);
    addTaperedTube([x, ground + 0.72, z], [x, ground + 0.88, z], 0.058, 0.058, 1);
    addTaperedTube([x, ground + 1.22, z], [x, ground + 1.4, z], 0.058, 0.056, 1);
    addTaperedTube([x, ground + 1.62, z], [x, ground + 1.73, z], 0.063, 0.012, 4);

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
      addTaperedTube(
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

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
