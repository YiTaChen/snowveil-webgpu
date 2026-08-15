type Vec3 = [number, number, number];

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export function createRiderGeometry() {
  const vertices: number[] = [];
  const indices: number[] = [];

  const addVertex = (position: Vec3, normal: Vec3, part: number) => {
    const index = vertices.length / 7;
    vertices.push(...position, ...normal, part);
    return index;
  };

  const addSphere = (center: Vec3, scale: Vec3, part: number, longitude = 24, latitude = 16) => {
    const base = vertices.length / 7;
    for (let ringIndex = 0; ringIndex <= latitude; ringIndex += 1) {
      const phi = (ringIndex / latitude) * Math.PI;
      const unitY = Math.cos(phi);
      const ring = Math.sin(phi);
      for (let segment = 0; segment <= longitude; segment += 1) {
        const theta = (segment / longitude) * Math.PI * 2;
        const unitX = Math.cos(theta) * ring;
        const unitZ = Math.sin(theta) * ring;
        addVertex(
          [center[0] + unitX * scale[0], center[1] + unitY * scale[1], center[2] + unitZ * scale[2]],
          normalize([unitX / scale[0], unitY / scale[1], unitZ / scale[2]]),
          part,
        );
      }
    }
    const row = longitude + 1;
    for (let ringIndex = 0; ringIndex < latitude; ringIndex += 1) {
      for (let segment = 0; segment < longitude; segment += 1) {
        const topLeft = base + ringIndex * row + segment;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + row;
        const bottomRight = bottomLeft + 1;
        indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
      }
    }
  };

  const addCapsule = (start: Vec3, end: Vec3, radius: number, part: number, segments = 18) => {
    const direction = normalize([end[0] - start[0], end[1] - start[1], end[2] - start[2]]);
    const reference: Vec3 = Math.abs(direction[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
    const tangent = normalize(cross(direction, reference));
    const bitangent = normalize(cross(direction, tangent));
    const base = vertices.length / 7;
    for (const center of [start, end]) {
      for (let segment = 0; segment <= segments; segment += 1) {
        const angle = (segment / segments) * Math.PI * 2;
        const radial: Vec3 = normalize([
          tangent[0] * Math.cos(angle) + bitangent[0] * Math.sin(angle),
          tangent[1] * Math.cos(angle) + bitangent[1] * Math.sin(angle),
          tangent[2] * Math.cos(angle) + bitangent[2] * Math.sin(angle),
        ]);
        addVertex(
          [center[0] + radial[0] * radius, center[1] + radial[1] * radius, center[2] + radial[2] * radius],
          radial,
          part,
        );
      }
    }
    const row = segments + 1;
    for (let segment = 0; segment < segments; segment += 1) {
      const startLeft = base + segment;
      const startRight = startLeft + 1;
      const endLeft = startLeft + row;
      const endRight = endLeft + 1;
      indices.push(startLeft, endLeft, startRight, startRight, endLeft, endRight);
    }
    addSphere(start, [radius, radius, radius], part, 16, 10);
    addSphere(end, [radius * 0.96, radius * 0.96, radius * 0.96], part, 16, 10);
  };

  const addTorus = (center: Vec3, majorRadius: number, tubeRadius: number, part: number) => {
    const majorSegments = 32;
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
          [center[0] + cosine * radius, center[1] + tubeSine * tubeRadius, center[2] + sine * radius],
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

  const addSnowBlade = () => {
    const segments = 40;
    const noseLength = 0.94;
    const tailLength = 0.82;
    const halfWidth = 0.2;
    const centerZ = -0.08;
    const topCenter = addVertex([0, 0.06, centerZ], [0, 1, 0], 14);
    const topRing: number[] = [];
    const bottomCenter = addVertex([0, 0.025, centerZ], [0, -1, 0], 15);
    const bottomRing: number[] = [];

    for (let segment = 0; segment < segments; segment += 1) {
      const theta = (segment / segments) * Math.PI * 2;
      const cosine = Math.cos(theta);
      const sine = Math.sin(theta);
      const x = cosine * (cosine >= 0 ? noseLength : tailLength);
      const noseWidth = 0.97 + Math.max(cosine, 0) * 0.06;
      const z = centerZ + sine * halfWidth * noseWidth;
      const tip = Math.pow(Math.abs(cosine), 8);
      const tipLift = cosine >= 0 ? 0.085 : 0.048;
      const topY = 0.06 + tip * tipLift;
      const tipSlope = -Math.sign(cosine) * tip * (cosine >= 0 ? 0.54 : 0.34);
      topRing.push(addVertex([x, topY, z], normalize([tipSlope, 1, 0]), 14));
      bottomRing.push(addVertex([x, topY - 0.035, z], [0, -1, 0], 15));
    }

    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      indices.push(topCenter, topRing[next], topRing[segment]);
      indices.push(bottomCenter, bottomRing[segment], bottomRing[next]);

      const theta = (segment / segments) * Math.PI * 2;
      const nextTheta = (next / segments) * Math.PI * 2;
      const sideBase = vertices.length / 7;
      const sideNormal = normalize([Math.cos(theta), 0.12, Math.sin(theta)]);
      const nextSideNormal = normalize([Math.cos(nextTheta), 0.12, Math.sin(nextTheta)]);
      const top = topRing[segment] * 7;
      const nextTop = topRing[next] * 7;
      const bottom = bottomRing[segment] * 7;
      const nextBottom = bottomRing[next] * 7;
      addVertex([vertices[top], vertices[top + 1], vertices[top + 2]], sideNormal, 15);
      addVertex([vertices[bottom], vertices[bottom + 1], vertices[bottom + 2]], sideNormal, 15);
      addVertex([vertices[nextTop], vertices[nextTop + 1], vertices[nextTop + 2]], nextSideNormal, 15);
      addVertex([vertices[nextBottom], vertices[nextBottom + 1], vertices[nextBottom + 2]], nextSideNormal, 15);
      indices.push(sideBase, sideBase + 2, sideBase + 1, sideBase + 1, sideBase + 2, sideBase + 3);
    }
  };

  const addShoulderShell = (side: -1 | 1) => {
    const rows = 4;
    const arcs = 10;
    const base = vertices.length / 7;
    for (let row = 0; row <= rows; row += 1) {
      const across = row / rows;
      for (let arc = 0; arc <= arcs; arc += 1) {
        const theta = (arc / arcs - 0.5) * Math.PI;
        const crown = Math.cos(theta);
        const z = Math.sin(theta) * (0.125 + across * 0.052);
        const x = side * (0.215 + across * 0.25 + crown * 0.014);
        const y = 1.355 - across * 0.13 + crown * (0.04 - across * 0.012);
        addVertex([x, y, z], normalize([side * (0.32 + across * 0.5), 0.76, Math.sin(theta) * 0.48]), 8);
      }
    }
    const rowSize = arcs + 1;
    for (let row = 0; row < rows; row += 1) {
      for (let arc = 0; arc < arcs; arc += 1) {
        const topLeft = base + row * rowSize + arc;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + rowSize;
        const bottomRight = bottomLeft + 1;
        indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
      }
    }

    const rimBase = vertices.length / 7;
    for (let arc = 0; arc <= arcs; arc += 1) {
      const theta = (arc / arcs - 0.5) * Math.PI;
      const z = Math.sin(theta) * 0.178;
      const crown = Math.cos(theta);
      addVertex([side * (0.465 + crown * 0.014), 1.225 + crown * 0.028, z], normalize([side, 0.18, Math.sin(theta) * 0.3]), 10);
      addVertex([side * (0.443 + crown * 0.012), 1.249 + crown * 0.03, z * 0.96], normalize([side, 0.18, Math.sin(theta) * 0.3]), 10);
    }
    for (let arc = 0; arc < arcs; arc += 1) {
      const outerLeft = rimBase + arc * 2;
      const innerLeft = outerLeft + 1;
      const outerRight = outerLeft + 2;
      const innerRight = outerLeft + 3;
      indices.push(outerLeft, outerRight, innerLeft, innerLeft, outerRight, innerRight);
    }
  };

  const cloakRings = [
    { y: 0.62, x: 0.35, z: 0.275, back: 0.125 },
    { y: 0.75, x: 0.38, z: 0.295, back: 0.12 },
    { y: 0.92, x: 0.365, z: 0.28, back: 0.095 },
    { y: 1.09, x: 0.35, z: 0.265, back: 0.065 },
    { y: 1.23, x: 0.43, z: 0.29, back: 0.045 },
    { y: 1.34, x: 0.31, z: 0.24, back: 0.02 },
  ];
  const cloakSegments = 32;
  const cloakBase = vertices.length / 7;
  for (let ringIndex = 0; ringIndex < cloakRings.length; ringIndex += 1) {
    const ring = cloakRings[ringIndex];
    const previous = cloakRings[Math.max(0, ringIndex - 1)];
    const next = cloakRings[Math.min(cloakRings.length - 1, ringIndex + 1)];
    const slope = ((previous.x + previous.z) - (next.x + next.z)) * 0.55;
    for (let segment = 0; segment <= cloakSegments; segment += 1) {
      const theta = (segment / cloakSegments) * Math.PI * 2;
      const cosine = Math.cos(theta);
      const sine = Math.sin(theta);
      const backDrape = Math.max(sine, 0) * ring.back;
      const brokenHem = ringIndex === 0 ? Math.cos(theta * 4 + 0.45) * 0.022 : 0;
      const stanceVent = ringIndex === 0 ? Math.pow(Math.abs(cosine), 7) * 0.095 : 0;
      addVertex(
        [cosine * ring.x, ring.y + brokenHem + stanceVent, sine * ring.z + backDrape],
        normalize([cosine / ring.x, slope, sine / ring.z]),
        1,
      );
    }
  }
  const cloakRow = cloakSegments + 1;
  for (let ringIndex = 0; ringIndex < cloakRings.length - 1; ringIndex += 1) {
    for (let segment = 0; segment < cloakSegments; segment += 1) {
      const lowerLeft = cloakBase + ringIndex * cloakRow + segment;
      const lowerRight = lowerLeft + 1;
      const upperLeft = lowerLeft + cloakRow;
      const upperRight = upperLeft + 1;
      indices.push(lowerLeft, upperLeft, lowerRight, lowerRight, upperLeft, upperRight);
    }
  }

  const capeBase = vertices.length / 7;
  const capeSegments = 12;
  const capeColumns = 6;
  for (let segment = 0; segment <= capeSegments; segment += 1) {
    const t = segment / capeSegments;
    const y = 1.29 - t * (0.58 + Math.abs(t - 0.55) * 0.025);
    const halfWidth = 0.22 + Math.sin(t * Math.PI * 0.9) * 0.095 - t * 0.035;
    const windOffset = t * 0.055 + Math.sin(t * Math.PI) * 0.035;
    for (let column = 0; column <= capeColumns; column += 1) {
      const across = (column / capeColumns) * 2 - 1;
      const crown = 1 - across * across;
      const brokenHem = Math.pow(t, 8) * Math.cos(across * Math.PI * 2.5 + 0.4) * 0.018;
      const z = 0.4 + t * 0.14 - Math.sin(t * Math.PI) * 0.018 + crown * 0.032;
      addVertex(
        [across * halfWidth + windOffset, y - across * t * 0.022 + crown * 0.012 + brokenHem, z],
        normalize([-across * 0.2, 0.1, 1]),
        6,
      );
    }
  }
  const capeRow = capeColumns + 1;
  for (let segment = 0; segment < capeSegments; segment += 1) {
    for (let column = 0; column < capeColumns; column += 1) {
      const topLeft = capeBase + segment * capeRow + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + capeRow;
      const bottomRight = bottomLeft + 1;
      indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
    }
  }

  for (const side of [-1, 1] as const) {
    const trimBase = vertices.length / 7;
    for (let segment = 0; segment <= capeSegments; segment += 1) {
      const t = segment / capeSegments;
      const y = 1.29 - t * (0.58 + Math.abs(t - 0.55) * 0.025);
      const halfWidth = 0.22 + Math.sin(t * Math.PI * 0.9) * 0.095 - t * 0.035;
      const windOffset = t * 0.055 + Math.sin(t * Math.PI) * 0.035;
      const brokenHem = Math.pow(t, 8) * Math.cos(side * Math.PI * 2.5 + 0.4) * 0.018;
      const edgeZ = 0.4 + t * 0.14 - Math.sin(t * Math.PI) * 0.018;
      addVertex([side * halfWidth + windOffset, y - side * t * 0.022 + brokenHem, edgeZ + 0.006], [0, 0.1, 1], 10);
      addVertex([side * (halfWidth - 0.024) + windOffset, y - side * t * 0.022 + 0.008 + brokenHem, edgeZ + 0.012], [0, 0.1, 1], 10);
    }
    for (let segment = 0; segment < capeSegments; segment += 1) {
      const outerTop = trimBase + segment * 2;
      const innerTop = outerTop + 1;
      const outerBottom = outerTop + 2;
      const innerBottom = outerTop + 3;
      indices.push(outerTop, outerBottom, innerTop, innerTop, outerBottom, innerBottom);
    }
  }

  const ribbonBase = vertices.length / 7;
  const ribbonSegments = 18;
  for (let segment = 0; segment <= ribbonSegments; segment += 1) {
    const t = segment / ribbonSegments;
    const center: Vec3 = [
      0.08 + t * 0.72 + Math.sin(t * Math.PI * 1.4) * 0.085,
      1.42 - t * 0.19 + Math.sin(t * Math.PI * 2) * 0.03,
      0.08 + t * 1.18,
    ];
    const width = 0.073 * (1 - t * 0.56);
    addVertex([center[0], center[1] - width, center[2]], [0, 0, 1], 5);
    addVertex([center[0], center[1] + width, center[2]], [0, 0, 1], 5);
  }
  for (let segment = 0; segment < ribbonSegments; segment += 1) {
    const lowerLeft = ribbonBase + segment * 2;
    const upperLeft = lowerLeft + 1;
    const lowerRight = lowerLeft + 2;
    const upperRight = lowerLeft + 3;
    indices.push(lowerLeft, lowerRight, upperLeft, upperLeft, lowerRight, upperRight);
  }

  // A thin, upturned snow-surfing blade stays readable through rider turns.
  addSnowBlade();

  // Bent legs and boots keep daylight between the coat and the snow surface.
  addCapsule([-0.17, 0.77, 0.02], [-0.24, 0.38, -0.07], 0.1, 12);
  addCapsule([0.17, 0.77, 0.02], [0.25, 0.37, -0.01], 0.1, 12);
  addCapsule([-0.24, 0.39, -0.07], [-0.25, 0.17, -0.08], 0.095, 13);
  addCapsule([0.25, 0.38, -0.01], [0.25, 0.17, -0.04], 0.095, 13);
  addSphere([-0.24, 0.405, -0.112], [0.125, 0.105, 0.085], 21, 18, 10);
  addSphere([0.25, 0.395, -0.052], [0.125, 0.105, 0.085], 21, 18, 10);
  addSphere([-0.25, 0.14, -0.14], [0.13, 0.065, 0.19], 17, 20, 10);
  addSphere([0.25, 0.14, -0.08], [0.13, 0.065, 0.19], 17, 20, 10);
  addSphere([-0.25, 0.095, -0.09], [0.17, 0.022, 0.14], 8, 18, 8);
  addSphere([0.25, 0.095, -0.05], [0.17, 0.022, 0.14], 8, 18, 8);

  addSphere([0, 1.08, -0.005], [0.32, 0.39, 0.235], 2, 28, 16);
  addSphere([0, 1.575, -0.015], [0.205, 0.245, 0.215], 3, 28, 18);
  addSphere([0, 1.56, -0.218], [0.126, 0.105, 0.04], 4, 22, 12);
  addSphere([0, 1.605, -0.248], [0.147, 0.076, 0.024], 8, 24, 12);
  addSphere([0, 1.605, -0.274], [0.123, 0.052, 0.016], 0, 24, 12);
  addCapsule([0, 1.655, -0.287], [0, 1.56, -0.287], 0.014, 10, 12);
  addSphere([0, 1.38, -0.205], [0.09, 0.055, 0.055], 5, 18, 10);

  // Layered curved shells replace primitive shoulder ellipsoids.
  addShoulderShell(-1);
  addShoulderShell(1);
  addTorus([0, 1.36, 0.015], 0.235, 0.026, 2);

  // Distinct upper/lower arm parts allow shoulder and elbow pivots to move as
  // a compact authored hierarchy in the vertex shader.
  addCapsule([-0.34, 1.25, -0.01], [-0.53, 1.04, -0.06], 0.078, 18);
  addCapsule([-0.53, 1.04, -0.06], [-0.38, 0.84, -0.27], 0.072, 19);
  addCapsule([0.34, 1.26, -0.03], [0.53, 1.1, -0.19], 0.082, 18);
  addCapsule([0.53, 1.1, -0.19], [0.8, 1.37, -0.54], 0.074, 19);
  addCapsule([-0.43, 0.91, -0.2], [-0.38, 0.84, -0.27], 0.086, 20, 14);
  addCapsule([0.72, 1.29, -0.44], [0.8, 1.37, -0.54], 0.088, 20, 14);
  // Gloves need their own transform part: lower legs share part 13 and must
  // stay aligned with the board while the hands follow the turning torso.
  addSphere([-0.37, 0.81, -0.3], [0.082, 0.09, 0.11], 16, 18, 11);
  addSphere([0.83, 1.4, -0.58], [0.085, 0.09, 0.11], 16, 18, 11);
  addSphere([0.85, 1.43, -0.59], [0.075, 0.075, 0.075], 9, 18, 12);
  addTorus([0, 0.91, 0], 0.335, 0.021, 10);
  addCapsule([-0.19, 1.27, -0.245], [0.075, 0.94, -0.315], 0.022, 10, 12);
  addCapsule([0.19, 1.27, -0.245], [-0.075, 0.94, -0.315], 0.022, 10, 12);
  addSphere([0, 1.08, -0.334], [0.052, 0.052, 0.024], 8, 16, 10);
  addSphere([0.9, 0.88, -3.2], [0.155, 0.155, 0.155], 11, 24, 14);

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
