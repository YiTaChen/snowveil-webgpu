type Vec3 = [number, number, number];

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};

export function createBeaconGeometry() {
  const vertices: number[] = [];
  const indices: number[] = [];

  const addVertex = (position: Vec3, normal: Vec3, part: number) => {
    const index = vertices.length / 7;
    vertices.push(...position, ...normal, part);
    return index;
  };

  const addCylinder = (
    bottomY: number,
    topY: number,
    bottomRadius: number,
    topRadius: number,
    segments: number,
    part: number,
  ) => {
    const sideBase = vertices.length / 7;
    for (let ring = 0; ring < 2; ring += 1) {
      const y = ring === 0 ? bottomY : topY;
      const radius = ring === 0 ? bottomRadius : topRadius;
      for (let segment = 0; segment <= segments; segment += 1) {
        const angle = (segment / segments) * Math.PI * 2;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        addVertex([cosine * radius, y, sine * radius], normalize([cosine, (bottomRadius - topRadius) * 0.7, sine]), part);
      }
    }
    const row = segments + 1;
    for (let segment = 0; segment < segments; segment += 1) {
      const bottomLeft = sideBase + segment;
      const bottomRight = bottomLeft + 1;
      const topLeft = bottomLeft + row;
      const topRight = topLeft + 1;
      indices.push(bottomLeft, topLeft, bottomRight, bottomRight, topLeft, topRight);
    }

    const topCenter = addVertex([0, topY, 0], [0, 1, 0], part);
    const topRing: number[] = [];
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      topRing.push(addVertex([Math.cos(angle) * topRadius, topY, Math.sin(angle) * topRadius], [0, 1, 0], part));
    }
    for (let segment = 0; segment < segments; segment += 1) {
      indices.push(topCenter, topRing[(segment + 1) % segments], topRing[segment]);
    }
  };

  const addTorus = (centerY: number, majorRadius: number, tubeRadius: number, part: number) => {
    const majorSegments = 36;
    const tubeSegments = 8;
    const base = vertices.length / 7;
    for (let major = 0; major <= majorSegments; major += 1) {
      const theta = (major / majorSegments) * Math.PI * 2;
      const cosine = Math.cos(theta);
      const sine = Math.sin(theta);
      for (let tube = 0; tube <= tubeSegments; tube += 1) {
        const phi = (tube / tubeSegments) * Math.PI * 2;
        const tubeCosine = Math.cos(phi);
        const tubeSine = Math.sin(phi);
        const radius = majorRadius + tubeRadius * tubeCosine;
        addVertex(
          [cosine * radius, centerY + tubeSine * tubeRadius, sine * radius],
          normalize([cosine * tubeCosine, tubeSine, sine * tubeCosine]),
          part,
        );
      }
    }
    const row = tubeSegments + 1;
    for (let major = 0; major < majorSegments; major += 1) {
      for (let tube = 0; tube < tubeSegments; tube += 1) {
        const topLeft = base + major * row + tube;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + row;
        const bottomRight = bottomLeft + 1;
        indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
      }
    }
  };

  const addCrystal = () => {
    const segments = 6;
    const lowerRing: number[] = [];
    const upperRing: number[] = [];
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2 + Math.PI / 6;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      lowerRing.push(addVertex([cosine * 0.19, 0.48, sine * 0.19], normalize([cosine, 0.06, sine]), 1));
      upperRing.push(addVertex([cosine * 0.255, 1.58, sine * 0.255], normalize([cosine, 0.08, sine]), 1));
    }
    const tip = addVertex([0, 2.18, 0], [0, 1, 0], 1);
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      indices.push(lowerRing[segment], upperRing[segment], lowerRing[next]);
      indices.push(lowerRing[next], upperRing[segment], upperRing[next]);
      indices.push(upperRing[segment], tip, upperRing[next]);
    }
  };

  const addFin = (angle: number) => {
    const outward: Vec3 = [Math.cos(angle), 0, Math.sin(angle)];
    const side: Vec3 = [-outward[2], 0, outward[0]];
    const points: Vec3[] = [
      [outward[0] * 0.35 - side[0] * 0.075, 0.24, outward[2] * 0.35 - side[2] * 0.075],
      [outward[0] * 0.84, 0.12, outward[2] * 0.84],
      [outward[0] * 0.42 + side[0] * 0.075, 0.24, outward[2] * 0.42 + side[2] * 0.075],
      [outward[0] * 0.42, 0.82, outward[2] * 0.42],
    ];
    const normal = normalize([side[0], 0.16, side[2]]);
    const base = points.map((point) => addVertex(point, normal, 2));
    indices.push(base[0], base[1], base[3], base[1], base[2], base[3]);
    const reverse = points.map((point) => addVertex(point, [-normal[0], -normal[1], -normal[2]], 2));
    indices.push(reverse[3], reverse[1], reverse[0], reverse[3], reverse[2], reverse[1]);
  };

  addCylinder(0.02, 0.34, 0.68, 0.52, 10, 0);
  addCylinder(0.34, 0.47, 0.52, 0.42, 10, 3);
  addCrystal();
  addTorus(1.14, 0.53, 0.036, 2);
  addFin(0);
  addFin((Math.PI * 2) / 3);
  addFin((Math.PI * 4) / 3);

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
