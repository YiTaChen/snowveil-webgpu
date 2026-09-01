export type Vec3 = [number, number, number];

export type ProceduralWorldGeometry = {
  vertices: Float32Array;
  indices: Uint32Array;
};

export const normalizeVec3 = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/**
 * Shared allocation-time mesh builder for world markers. Race courses and the
 * original circular safety fence use the same tube and panel topology instead
 * of carrying separate copies of low-level geometry code.
 */
export function createWorldGeometryBuilder() {
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
    const direction = normalizeVec3([
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2],
    ]);
    const reference: Vec3 = Math.abs(direction[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
    const tangent = normalizeVec3(cross(direction, reference));
    const bitangent = normalizeVec3(cross(direction, tangent));
    const base = vertices.length / 7;
    for (let ring = 0; ring < 2; ring += 1) {
      const center = ring === 0 ? start : end;
      const radius = ring === 0 ? startRadius : endRadius;
      for (let side = 0; side <= sides; side += 1) {
        const angle = (side / sides) * Math.PI * 2;
        const radial = normalizeVec3([
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

  const addPanel = (points: [Vec3, Vec3, Vec3, Vec3], normal: Vec3, part: number) => {
    const frontNormal = normalizeVec3(normal);
    const front = points.map((point) => addVertex(point, frontNormal, part));
    indices.push(front[0], front[1], front[2], front[0], front[2], front[3]);
    const backNormal: Vec3 = [-frontNormal[0], -frontNormal[1], -frontNormal[2]];
    const back = points.map((point) => addVertex(point, backNormal, part));
    indices.push(back[2], back[1], back[0], back[3], back[2], back[0]);
  };

  const finish = (): ProceduralWorldGeometry => ({
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  });

  return { addPanel, addTaperedTube, finish };
}
