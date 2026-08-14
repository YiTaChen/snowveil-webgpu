const fract = (value: number) => value - Math.floor(value);

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

function hash12(x: number, y: number) {
  const px = fract(x * 0.1031);
  const py = fract(x * 0.103);
  const pz = fract(y * 0.0973);
  const dot = px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33);
  const qx = px + dot;
  const qy = py + dot;
  const qz = pz + dot;
  return fract((qx + qy) * qz);
}

function noise2(x: number, y: number) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const localX = fract(x);
  const localY = fract(y);
  const blendX = localX * localX * (3 - 2 * localX);
  const blendY = localY * localY * (3 - 2 * localY);
  const a = hash12(cellX, cellY);
  const b = hash12(cellX + 1, cellY);
  const c = hash12(cellX, cellY + 1);
  const d = hash12(cellX + 1, cellY + 1);
  const top = a + (b - a) * blendX;
  const bottom = c + (d - c) * blendX;
  return top + (bottom - top) * blendY;
}

function fbm(x: number, y: number) {
  let px = x;
  let py = y;
  let amplitude = 0.5;
  let result = 0;
  for (let octave = 0; octave < 4; octave += 1) {
    result += noise2(px, py) * amplitude;
    const nextX = 1.67 * px - 1.16 * py;
    const nextY = 1.16 * px + 1.67 * py;
    px = nextX;
    py = nextY;
    amplitude *= 0.48;
  }
  return result;
}

export function snowHeightAt(x: number, z: number) {
  const windX = 0.82 / Math.hypot(0.82, 0.57);
  const windZ = 0.57 / Math.hypot(0.82, 0.57);
  const acrossX = -windZ;
  const acrossZ = windX;
  const alongWind = x * windX + z * windZ;
  const crossWind = x * acrossX + z * acrossZ;
  const broadWarp = (fbm(x * 0.019 + 4, z * 0.019 - 7) - 0.5) * 8;
  const broad = Math.sin(crossWind * 0.075 + broadWarp) * 1.08;
  const longSwell = Math.sin(crossWind * 0.028 - alongWind * 0.012 + 1.7) * 0.84;
  const driftNoise = fbm(crossWind * 0.105, alongWind * 0.031);
  const drifts = (driftNoise - 0.48) * 1.22;
  const ridgeBase = Math.sin(crossWind * 0.67 + noise2(x * 0.11, z * 0.11) * 2);
  const ridges = ridgeBase * 0.045;
  const heroDistance = Math.hypot((x + 1.5) * 0.65, (z + 11) * 0.34);
  const heroDune = Math.exp(-heroDistance * 0.1) * 1.82;
  const foregroundDip = -Math.exp(-Math.hypot((x - 2.8) * 0.32, (z + 1.5) * 0.9)) * 0.48;
  const radius = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  const mountainProfile =
    8 +
    Math.sin(angle * 3.7 + 0.6) * 2.2 +
    Math.sin(angle * 8.3 - 1.2) * 1.25 +
    noise2(x * 0.027 + 31, z * 0.027 + 31) * 4.2;
  const farRise = smoothstep(38, 82, radius) * mountainProfile;
  const outcropA = Math.exp(-Math.hypot((x + 12) * 0.34, (z + 24) * 0.19) * 1.7);
  const outcropB = Math.exp(-Math.hypot((x - 19) * 0.29, (z + 33) * 0.16) * 1.8);
  const outcrop = Math.max(outcropA, outcropB);
  const outcropLift = smoothstep(0.12, 0.58, outcrop) * 1.55 + smoothstep(0.46, 0.78, outcrop) * 0.32;
  return -0.72 + broad + longSwell + drifts + ridges + heroDune + foregroundDip + farRise + outcropLift;
}
