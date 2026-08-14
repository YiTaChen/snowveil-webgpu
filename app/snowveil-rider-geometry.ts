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

  const cloakRings = [
    { y: 0.08, x: 0.58, z: 0.41, back: 0.18 },
    { y: 0.28, x: 0.58, z: 0.41, back: 0.16 },
    { y: 0.55, x: 0.52, z: 0.38, back: 0.13 },
    { y: 0.8, x: 0.45, z: 0.35, back: 0.1 },
    { y: 1.02, x: 0.4, z: 0.33, back: 0.065 },
    { y: 1.22, x: 0.47, z: 0.36, back: 0.04 },
    { y: 1.38, x: 0.34, z: 0.28, back: 0.02 },
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
      addVertex(
        [cosine * ring.x, ring.y, sine * ring.z + backDrape],
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
  const capeSegments = 9;
  for (let segment = 0; segment <= capeSegments; segment += 1) {
    const t = segment / capeSegments;
    const y = 1.3 - t * 1.08;
    const halfWidth = 0.27 + t * 0.15;
    const z = 0.34 + t * 0.16 - Math.sin(t * Math.PI) * 0.035;
    addVertex([-halfWidth, y, z], [0, 0.08, 1], 6);
    addVertex([halfWidth, y, z], [0, 0.08, 1], 6);
  }
  for (let segment = 0; segment < capeSegments; segment += 1) {
    const topLeft = capeBase + segment * 2;
    const topRight = topLeft + 1;
    const bottomLeft = topLeft + 2;
    const bottomRight = topLeft + 3;
    indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
  }

  const ribbonBase = vertices.length / 7;
  const ribbonSegments = 18;
  for (let segment = 0; segment <= ribbonSegments; segment += 1) {
    const t = segment / ribbonSegments;
    const center: Vec3 = [
      0.08 + t * 0.86 + Math.sin(t * Math.PI * 1.4) * 0.1,
      1.43 - t * 0.24 + Math.sin(t * Math.PI * 2) * 0.035,
      0.08 + t * 1.52,
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

  addSphere([0, 0.1, -0.04], [0.59, 0.052, 1.12], 0, 28, 10);
  addSphere([0, 1.59, -0.015], [0.255, 0.305, 0.27], 3);
  addSphere([0, 1.57, -0.268], [0.15, 0.13, 0.048], 4, 20, 12);
  addSphere([0.37, 1.18, -0.25], [0.086, 0.11, 0.086], 9, 18, 12);
  addSphere([0, 1.39, -0.245], [0.1, 0.065, 0.065], 8, 18, 10);
  addCapsule([-0.34, 1.24, -0.01], [-0.59, 0.98, -0.24], 0.105, 7);
  addCapsule([0.34, 1.25, -0.04], [0.72, 1.17, -0.46], 0.105, 7);
  addSphere([-0.6, 0.97, -0.25], [0.115, 0.105, 0.11], 7, 18, 11);
  addSphere([0.74, 1.17, -0.48], [0.115, 0.105, 0.11], 7, 18, 11);
  addSphere([-0.36, 1.28, 0], [0.17, 0.12, 0.18], 8, 18, 11);
  addSphere([0.36, 1.28, 0], [0.17, 0.12, 0.18], 8, 18, 11);
  addTorus([0, 0.88, 0], 0.39, 0.028, 8);
  addSphere([0.9, 0.88, -3.2], [0.155, 0.155, 0.155], 11, 24, 14);

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
