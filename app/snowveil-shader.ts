const sharedUniforms = /* wgsl */ `
struct Globals {
  viewport: vec4<f32>,
  camera: vec4<f32>,
  weather: vec4<f32>,
  reserved: vec4<f32>,
  beaconA: vec4<f32>,
  beaconB: vec4<f32>,
  beaconC: vec4<f32>,
  objective: vec4<f32>,
  terrain: vec4<f32>,
  motion: vec4<f32>,
  pose: vec4<f32>,
};

@group(0) @binding(0) var<uniform> globals: Globals;
`;

export const snowveilSkyShader = /* wgsl */ `
${sharedUniforms}

struct SkyVertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> SkyVertexOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var output: SkyVertexOut;
  let position = positions[vertexIndex];
  output.position = vec4<f32>(position, 0.9999, 1.0);
  output.uv = position * 0.5 + 0.5;
  return output;
}

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn hash12(point: vec2<f32>) -> f32 {
  let p = fract(vec3<f32>(point.xyx) * vec3<f32>(0.1031, 0.1030, 0.0973));
  let q = p + dot(p, p.yzx + vec3<f32>(33.33));
  return fract((q.x + q.y) * q.z);
}

fn hash22(point: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(hash12(point + 17.17), hash12(point + 91.73));
}

fn skyColor(direction: vec3<f32>, sunDirection: vec3<f32>) -> vec3<f32> {
  let up = saturate(direction.y * 0.5 + 0.5);
  let horizon = pow(1.0 - abs(direction.y), 4.0);
  let sunAmount = saturate(dot(direction, sunDirection));
  let lowSky = vec3<f32>(0.54, 0.67, 0.75);
  let highSky = vec3<f32>(0.035, 0.115, 0.19);
  var color = mix(lowSky, highSky, pow(up, 0.66));
  color = color + vec3<f32>(0.3, 0.23, 0.16) * horizon * pow(sunAmount, 5.0);
  color = color + vec3<f32>(1.0, 0.78, 0.51) * pow(sunAmount, 460.0) * 7.0;
  color = color + vec3<f32>(1.0, 0.62, 0.34) * pow(sunAmount, 38.0) * 0.72;
  return color;
}

fn snowParticles(uv: vec2<f32>, time: f32) -> f32 {
  var result = 0.0;
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let point = (uv - 0.5) * vec2<f32>(aspect, 1.0);
  for (var layer = 0; layer < 2; layer = layer + 1) {
    let depth = f32(layer) + 1.0;
    let scale = 12.0 + depth * 8.0;
    let samplePoint = point * scale + vec2<f32>(
      time * (0.035 + 0.018 * depth),
      time * (0.16 + 0.075 / depth) * scale
    );
    let cell = floor(samplePoint);
    let local = fract(samplePoint) - 0.5;
    let random = hash22(cell + f32(layer) * 37.0);
    let flake = local - (random - 0.5) * 0.72;
    let size = mix(0.022, 0.058, random.x) / depth;
    let glow = 1.0 - smoothstep(size * 0.12, size, length(flake));
    let enabled = step(0.68, hash12(cell + vec2<f32>(71.3, -28.6) + f32(layer)));
    result = result + glow * enabled * (0.1 + 0.13 / depth);
  }
  return result;
}

fn foregroundSnow(uv: vec2<f32>, time: f32) -> f32 {
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let point = (uv - 0.5) * vec2<f32>(aspect, 1.0);
  var result = 0.0;
  for (var layer = 0; layer < 1; layer = layer + 1) {
    let depth = f32(layer) + 1.0;
    let scale = 8.5 + depth * 6.0;
    let samplePoint = point * scale + vec2<f32>(time * 0.17, time * 1.45 + time * 0.22 * depth);
    let cell = floor(samplePoint);
    let local = fract(samplePoint) - 0.5;
    let random = hash22(cell + f32(layer) * 113.0);
    let offset = (random - 0.5) * 0.76;
    let flake = local - offset;
    let stretched = length(vec2<f32>(flake.x * 1.45, flake.y * 0.68));
    let size = mix(0.018, 0.052, random.x) / depth;
    let enabled = step(0.72, hash12(cell + vec2<f32>(33.7, 94.1)));
    result = result + (1.0 - smoothstep(size * 0.2, size, stretched)) * enabled / depth;
  }
  return result;
}

fn riderSpray(uv: vec2<f32>, time: f32, speed: f32) -> f32 {
  if (speed < 0.04) {
    return 0.0;
  }
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let point = (uv - vec2<f32>(0.5, 0.405)) * vec2<f32>(aspect, 1.0);
  if (length(point) > 0.42) {
    return 0.0;
  }
  var result = 0.0;
  for (var particle = 0; particle < 16; particle = particle + 1) {
    let id = f32(particle);
    let seed = hash12(vec2<f32>(id * 17.31, id * 9.73 + 4.2));
    let age = fract(time * (0.72 + seed * 0.46) + seed * 7.1);
    let side = hash12(vec2<f32>(id + 31.0, id * 3.7)) - 0.5;
    let origin = vec2<f32>(side * 0.16, 0.0);
    let drift = vec2<f32>(side * age * (0.18 + speed * 0.14), -age * (0.07 + speed * 0.15));
    let particlePosition = origin + drift;
    let size = mix(0.008, 0.0028, age) * (0.35 + speed * 0.72);
    let flake = 1.0 - smoothstep(size * 0.25, size, length(point - particlePosition));
    result = result + flake * (1.0 - age) * speed;
  }
  return result;
}

fn landingBurst(uv: vec2<f32>, impact: f32) -> f32 {
  if (impact < 0.012) {
    return 0.0;
  }
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let point = (uv - vec2<f32>(0.5, 0.405)) * vec2<f32>(aspect, 1.0);
  if (length(point) > 0.48) {
    return 0.0;
  }
  let age = saturate(-log(max(impact, 0.001)) / 4.8);
  let plumeScale = vec2<f32>(0.065 + age * 0.19, 0.026 + age * 0.075);
  let plumeLift = -age * 0.055 + age * age * 0.035;
  let leftPlume = (point - vec2<f32>(-age * 0.09, plumeLift)) / plumeScale;
  let rightPlume = (point - vec2<f32>(age * 0.09, plumeLift)) / plumeScale;
  let powderCloud =
    (exp(-dot(leftPlume, leftPlume) * 1.7) + exp(-dot(rightPlume, rightPlume) * 1.7)) *
    impact *
    (1.0 - age) *
    0.16;
  var result = powderCloud;
  for (var particle = 0; particle < 24; particle = particle + 1) {
    let id = f32(particle);
    let random = hash22(vec2<f32>(id * 19.17 + 5.3, id * 7.91 + 21.6));
    let side = random.x * 2.0 - 1.0;
    let origin = vec2<f32>(side * 0.055, 0.012);
    let velocity = vec2<f32>(side * (0.16 + random.y * 0.24), -(0.075 + random.x * 0.16));
    let gravity = vec2<f32>(0.0, age * age * (0.11 + random.y * 0.08));
    let particlePosition = origin + velocity * age + gravity;
    let size = mix(0.009, 0.0025, age) * (0.72 + random.y * 0.5);
    let flakeOffset = point - particlePosition;
    let flake = 1.0 - smoothstep(size * 0.22, size, length(vec2<f32>(flakeOffset.x * 0.78, flakeOffset.y * 1.42)));
    result = result + flake * (1.0 - age) * impact;
  }
  return result;
}

fn spellBurst(uv: vec2<f32>, pulse: f32) -> f32 {
  if (pulse < 0.01) {
    return 0.0;
  }
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let point = (uv - vec2<f32>(0.543, 0.58)) * vec2<f32>(aspect, 1.0);
  let radius = length(point);
  let ringRadius = 0.025 + (1.0 - pulse) * 0.105;
  let ring = 1.0 - smoothstep(0.008, 0.024, abs(radius - ringRadius));
  let core = 1.0 - smoothstep(0.0, 0.038, radius);
  return (ring * 0.8 + core * pulse) * pulse;
}

fn aces(color: vec3<f32>) -> vec3<f32> {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

@fragment
fn fsMain(input: SkyVertexOut) -> @location(0) vec4<f32> {
  let resolution = globals.viewport.xy;
  let time = globals.viewport.z;
  let yaw = globals.camera.x;
  let pitch = globals.camera.y;
  let cameraDistance = globals.camera.z;
  let fieldOfView = globals.camera.w;
  let aspect = resolution.x / max(resolution.y, 1.0);
  let screen = (input.uv * 2.0 - 1.0) * vec2<f32>(aspect, 1.0);

  let cameraTarget = vec3<f32>(globals.reserved.x, globals.weather.y + 1.05, globals.reserved.y);
  let orbit = vec3<f32>(sin(yaw) * cameraDistance, 2.0 + pitch * 7.0, cos(yaw) * cameraDistance);
  let cameraPosition = cameraTarget + orbit;
  let forward = normalize(cameraTarget - cameraPosition);
  let right = normalize(cross(forward, vec3<f32>(0.0, 1.0, 0.0)));
  let up = normalize(cross(right, forward));
  let rayDirection = normalize(forward + screen.x * right * fieldOfView + screen.y * up * fieldOfView);
  let sunDirection = normalize(vec3<f32>(0.44, 0.205, -0.874));

  var color = skyColor(rayDirection, sunDirection);
  color = color + vec3<f32>(0.69, 0.83, 0.92) * snowParticles(input.uv, time);

  return vec4<f32>(max(color, vec3<f32>(0.0)), 1.0);
}

@fragment
fn fsSnowOverlay(input: SkyVertexOut) -> @location(0) vec4<f32> {
  let flake = foregroundSnow(input.uv, globals.viewport.z);
  let grounded = 1.0 - smoothstep(0.015, 0.09, globals.objective.w);
  let spray = riderSpray(input.uv, globals.viewport.z, globals.reserved.w * grounded);
  let landing = landingBurst(input.uv, globals.motion.x);
  let spell = spellBurst(input.uv, globals.weather.z);
  let alpha = saturate(flake * 0.56 + spray * 0.48 + landing * 0.62 + spell * 0.68);
  let color = mix(vec3<f32>(0.78, 0.89, 0.96), vec3<f32>(0.18, 0.76, 1.0) * 2.4, saturate(spell * 1.8));
  return vec4<f32>(color, alpha);
}
`;

export const snowveilTerrainShader = /* wgsl */ `
${sharedUniforms}

@group(0) @binding(1) var deformationMap: texture_2d<f32>;
@group(0) @binding(2) var deformationSampler: sampler;

struct TerrainVertexIn {
  @location(0) grid: vec2<f32>,
};

struct TerrainVertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPosition: vec3<f32>,
  @location(1) worldNormal: vec3<f32>,
  @location(2) viewDirection: vec3<f32>,
  @location(3) viewDistance: f32,
  @location(4) terrainShadow: f32,
};

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn hash12(point: vec2<f32>) -> f32 {
  let p = fract(vec3<f32>(point.xyx) * vec3<f32>(0.1031, 0.1030, 0.0973));
  let q = p + dot(p, p.yzx + vec3<f32>(33.33));
  return fract((q.x + q.y) * q.z);
}

fn noise2(point: vec2<f32>) -> f32 {
  let cell = floor(point);
  let local = fract(point);
  let blend = local * local * (3.0 - 2.0 * local);
  let a = hash12(cell);
  let b = hash12(cell + vec2<f32>(1.0, 0.0));
  let c = hash12(cell + vec2<f32>(0.0, 1.0));
  let d = hash12(cell + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
}

fn fbm(point: vec2<f32>) -> f32 {
  var p = point;
  var amplitude = 0.5;
  var result = 0.0;
  for (var octave = 0; octave < 4; octave = octave + 1) {
    result = result + noise2(p) * amplitude;
    p = mat2x2<f32>(1.67, 1.16, -1.16, 1.67) * p;
    amplitude = amplitude * 0.48;
  }
  return result;
}

fn outcropField(point: vec2<f32>) -> f32 {
  let outcropA = exp(-length((point - vec2<f32>(-12.0, -24.0)) * vec2<f32>(0.34, 0.19)) * 1.7);
  let outcropB = exp(-length((point - vec2<f32>(19.0, -33.0)) * vec2<f32>(0.29, 0.16)) * 1.8);
  return max(outcropA, outcropB);
}

fn snowMemory(point: vec2<f32>) -> vec2<f32> {
  let uv = point / 128.0 + 0.5;
  if (uv.x <= 0.0 || uv.y <= 0.0 || uv.x >= 1.0 || uv.y >= 1.0) {
    return vec2<f32>(0.0);
  }
  return textureSampleLevel(deformationMap, deformationSampler, uv, 0.0).rg;
}

fn snowDeformation(point: vec2<f32>) -> f32 {
  return snowMemory(point).r;
}

fn terrainBaseHeight(point: vec2<f32>) -> f32 {
  let wind = normalize(vec2<f32>(0.82, 0.57));
  let across = vec2<f32>(-wind.y, wind.x);
  let alongWind = dot(point, wind);
  let crossWind = dot(point, across);
  let broadWarp = (fbm(point * 0.019 + vec2<f32>(4.0, -7.0)) - 0.5) * 8.0;
  let broad = sin(crossWind * 0.075 + broadWarp) * 1.08;
  let longSwell = sin(crossWind * 0.028 - alongWind * 0.012 + 1.7) * 0.84;
  let driftNoise = fbm(vec2<f32>(crossWind * 0.105, alongWind * 0.031));
  let drifts = (driftNoise - 0.48) * 1.22;
  let ridgeBase = sin(crossWind * 0.67 + noise2(point * 0.11) * 2.0);
  let ridges = ridgeBase * 0.045;
  let heroDistance = length((point - vec2<f32>(-1.5, -11.0)) * vec2<f32>(0.65, 0.34));
  let heroDune = exp(-heroDistance * 0.1) * 1.82;
  let foregroundDip = -exp(-length((point - vec2<f32>(2.8, -1.5)) * vec2<f32>(0.32, 0.9))) * 0.48;
  let radius = length(point);
  let angle = atan2(point.y, point.x);
  let mountainProfile = 8.0 + sin(angle * 3.7 + 0.6) * 2.2 + sin(angle * 8.3 - 1.2) * 1.25 + noise2(point * 0.027 + 31.0) * 4.2;
  let farRise = smoothstep(38.0, 62.0, radius) * (1.0 - smoothstep(62.0, 78.0, radius)) * mountainProfile * 0.42;
  let outcrop = outcropField(point);
  let outcropLift = smoothstep(0.12, 0.58, outcrop) * 1.55 + smoothstep(0.46, 0.78, outcrop) * 0.32;
  return -0.72 + broad + longSwell + drifts + ridges + heroDune + foregroundDip + farRise + outcropLift;
}

fn terrainHeight(point: vec2<f32>) -> f32 {
  return terrainBaseHeight(point) + snowDeformation(point);
}

fn terrainNormal(point: vec2<f32>) -> vec3<f32> {
  let epsilon = 0.12;
  let left = terrainHeight(point - vec2<f32>(epsilon, 0.0));
  let right = terrainHeight(point + vec2<f32>(epsilon, 0.0));
  let back = terrainHeight(point - vec2<f32>(0.0, epsilon));
  let front = terrainHeight(point + vec2<f32>(0.0, epsilon));
  return normalize(vec3<f32>(left - right, epsilon * 2.0, back - front));
}

fn softShadow(position: vec3<f32>, sunDirection: vec3<f32>) -> f32 {
  var shade = 1.0;
  var travel = 0.18;
  for (var step = 0; step < 6; step = step + 1) {
    let samplePosition = position + sunDirection * travel;
    let clearance = samplePosition.y - terrainBaseHeight(samplePosition.xz);
    shade = min(shade, 6.0 * clearance / travel);
    if (clearance < 0.002 || travel > 28.0) {
      break;
    }
    travel = travel + clamp(clearance * 0.88, 0.16, 4.2);
  }
  return saturate(shade * 0.55 + 0.4);
}

@vertex
fn vsTerrain(input: TerrainVertexIn) -> TerrainVertexOut {
  var output: TerrainVertexOut;
  let warpedGrid = input.grid * (vec2<f32>(0.12) + abs(input.grid) * 0.88);
  let worldXZ = warpedGrid * 86.0 + globals.reserved.xy;
  let worldPosition = vec3<f32>(worldXZ.x, terrainHeight(worldXZ), worldXZ.y);

  let yaw = globals.camera.x;
  let pitch = globals.camera.y;
  let cameraDistance = globals.camera.z;
  let fieldOfView = globals.camera.w;
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let cameraTarget = vec3<f32>(globals.reserved.x, globals.weather.y + 1.05, globals.reserved.y);
  let orbit = vec3<f32>(sin(yaw) * cameraDistance, 2.0 + pitch * 7.0, cos(yaw) * cameraDistance);
  let cameraPosition = cameraTarget + orbit;
  let forward = normalize(cameraTarget - cameraPosition);
  let right = normalize(cross(forward, vec3<f32>(0.0, 1.0, 0.0)));
  let up = normalize(cross(right, forward));
  let relative = worldPosition - cameraPosition;
  let viewX = dot(relative, right);
  let viewY = dot(relative, up);
  let viewZ = dot(relative, forward);
  let focal = 1.0 / fieldOfView;
  let near = 0.08;
  let far = 220.0;
  let clipZ = (far / (far - near)) * viewZ - (near * far / (far - near));

  let worldNormal = terrainNormal(worldXZ);
  let viewDistance = length(relative);
  let sunDirection = normalize(vec3<f32>(0.44, 0.205, -0.874));
  var terrainShadow = 1.0;
  if (viewDistance < 24.0 && dot(worldNormal, sunDirection) > 0.01) {
    terrainShadow = softShadow(worldPosition + worldNormal * 0.04, sunDirection);
    terrainShadow = mix(terrainShadow, 1.0, smoothstep(19.0, 24.0, viewDistance));
  }

  output.position = vec4<f32>(viewX * focal / aspect, viewY * focal, clipZ, viewZ);
  output.worldPosition = worldPosition;
  output.worldNormal = worldNormal;
  output.viewDirection = cameraPosition - worldPosition;
  output.viewDistance = viewDistance;
  output.terrainShadow = terrainShadow;
  return output;
}

fn atmosphere(direction: vec3<f32>, sunDirection: vec3<f32>) -> vec3<f32> {
  let up = saturate(direction.y * 0.5 + 0.5);
  let horizon = pow(1.0 - abs(direction.y), 4.0);
  let sunAmount = saturate(dot(direction, sunDirection));
  let lowSky = vec3<f32>(0.54, 0.67, 0.75);
  let highSky = vec3<f32>(0.035, 0.115, 0.19);
  var color = mix(lowSky, highSky, pow(up, 0.66));
  color = color + vec3<f32>(0.3, 0.23, 0.16) * horizon * pow(sunAmount, 5.0);
  color = color + vec3<f32>(1.0, 0.78, 0.51) * pow(sunAmount, 460.0) * 7.0;
  color = color + vec3<f32>(1.0, 0.62, 0.34) * pow(sunAmount, 38.0) * 0.72;
  return color;
}

fn aces(color: vec3<f32>) -> vec3<f32> {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

fn ritualSigil(point: vec2<f32>, beacon: vec4<f32>) -> f32 {
  if (beacon.w < 0.5) {
    return 0.0;
  }
  let local = point - beacon.xz;
  let radius = length(local);
  let edge = max(fwidth(radius) * 1.6, 0.018);
  let outerRing = 1.0 - smoothstep(edge, edge * 3.0, abs(radius - 1.22));
  let innerRing = 1.0 - smoothstep(edge, edge * 2.7, abs(radius - 0.72));
  let runeBand = smoothstep(0.78, 0.88, radius) * (1.0 - smoothstep(1.05, 1.17, radius));
  let rayA = abs(dot(local, normalize(vec2<f32>(1.0, 0.32))));
  let rayB = abs(dot(local, normalize(vec2<f32>(-0.23, 1.0))));
  let rayC = abs(dot(local, normalize(vec2<f32>(0.72, -1.0))));
  let rays = (1.0 - smoothstep(edge, edge * 3.0, min(rayA, min(rayB, rayC)))) * runeBand;
  let broken = smoothstep(-0.24, 0.18, sin((local.x - local.y) * 11.0));
  let pulse = 0.86 + sin(globals.viewport.z * 2.1 + beacon.x * 0.37) * 0.14;
  return max(outerRing, max(innerRing * 0.7, rays * broken)) * pulse;
}

@fragment
fn fsTerrain(input: TerrainVertexOut) -> @location(0) vec4<f32> {
  let sunDirection = normalize(vec3<f32>(0.44, 0.205, -0.874));
  let viewDirection = normalize(input.viewDirection);
  let wind = normalize(vec2<f32>(0.82, 0.57));
  let across = vec2<f32>(-wind.y, wind.x);

  var normal = normalize(input.worldNormal);
  let detailFade = 1.0 - smoothstep(18.0, 62.0, input.viewDistance);
  let microA = noise2(input.worldPosition.xz * 31.0) - 0.5;
  let microB = noise2(input.worldPosition.xz * 57.0 + 19.0) - 0.5;
  let microC = noise2(vec2<f32>(dot(input.worldPosition.xz, across) * 8.7, dot(input.worldPosition.xz, wind) * 0.7)) - 0.5;
  let ripplePhase = dot(input.worldPosition.xz, across) * 3.8 + noise2(input.worldPosition.xz * 0.68) * 2.2;
  let rippleSampling = 1.0 - smoothstep(0.48, 1.7, fwidth(ripplePhase));
  let ripple = sin(ripplePhase) * rippleSampling;
  let rippleBreak = smoothstep(0.28, 0.74, noise2(vec2<f32>(
    dot(input.worldPosition.xz, wind) * 0.21,
    dot(input.worldPosition.xz, across) * 0.085
  )));
  let finePhase = dot(input.worldPosition.xz, across) * 13.5 + noise2(input.worldPosition.xz * 0.38) * 4.2;
  let fineSampling = 1.0 - smoothstep(0.4, 1.45, fwidth(finePhase));
  let fineWave = sin(finePhase);
  let fineRipple = fineWave * rippleBreak * fineSampling;
  normal = normalize(
    normal + vec3<f32>(microA * 0.054, 0.0, microB * 0.054) * detailFade +
    vec3<f32>(across.x, 0.0, across.y) * (ripple * 0.032 + microC * 0.045 + fineRipple * 0.026) * detailFade
  );

  let direct = saturate(dot(normal, sunDirection));
  let shadow = input.terrainShadow;

  let wrapped = saturate((dot(normal, sunDirection) + 0.3) / 1.3);
  let halfway = normalize(sunDirection + viewDirection);
  let skyLight = 0.38 + 0.5 * saturate(normal.y);
  let bounce = vec3<f32>(0.25, 0.4, 0.56) * skyLight;
  let warmSun = vec3<f32>(1.0, 0.77, 0.53);
  let base = mix(vec3<f32>(0.38, 0.54, 0.7), vec3<f32>(0.82, 0.9, 0.96), saturate(normal.y * 0.88));
  let backScatter = pow(saturate(dot(-sunDirection, -viewDirection) * 0.5 + 0.5), 4.0);
  let subsurface = vec3<f32>(0.34, 0.57, 0.82) * wrapped * (0.24 + 0.76 * backScatter) * 0.48;
  let roughSpecular = pow(saturate(dot(normal, halfway)), 52.0) * shadow * (0.18 + direct);
  let fresnel = pow(1.0 - saturate(dot(normal, viewDirection)), 5.0);

  let glintCell = floor(input.worldPosition.xz * 190.0);
  let glintSeed = hash12(glintCell);
  let glintMask = smoothstep(0.996, 1.0, glintSeed);
  let glintDistance = 1.0 - smoothstep(8.0, 44.0, input.viewDistance);
  let glint = glintMask * pow(saturate(dot(normal, halfway)), 96.0) * shadow * glintDistance;
  let ridgePhase = dot(input.worldPosition.xz, across) * 3.2;
  let ridgeSampling = 1.0 - smoothstep(0.42, 1.55, fwidth(ridgePhase));
  let ridgeTone = pow(abs(sin(ridgePhase)), 24.0) * ridgeSampling * detailFade;
  let fineCrest = pow(max(fineWave, 0.0), 10.0) * rippleBreak * detailFade;
  let surfaceVariation = 0.95 + 0.05 * noise2(input.worldPosition.xz * 3.1) - ridgeTone * 0.018 - fineCrest * 0.032;
  let outcrop = outcropField(input.worldPosition.xz);
  let rockReveal = smoothstep(0.24, 0.72, outcrop) * smoothstep(0.1, 0.46, 1.0 - normal.y);
  let memory = snowMemory(input.worldPosition.xz);
  let deformation = memory.r * exp(-globals.weather.x * 0.0035);
  let spellResidue = memory.g * exp(-globals.weather.x * 0.22);
  let compactedSnow = saturate(-deformation * 8.5);
  let pushedSnow = saturate(deformation * 19.0);
  let playerRelative = input.worldPosition.xz - globals.reserved.xy;
  let boardYaw = globals.objective.x;
  let boardForward = vec2<f32>(cos(boardYaw), sin(boardYaw));
  let boardSide = vec2<f32>(-sin(boardYaw), cos(boardYaw));
  let boardLongitudinal = dot(playerRelative, boardForward);
  let boardLateral = dot(playerRelative, boardSide);
  let alignedBoardYaw = globals.reserved.z - 1.570796;
  let skidAngle = atan2(sin(boardYaw - alignedBoardYaw), cos(boardYaw - alignedBoardYaw));
  let edgeAmount = saturate(max(abs(globals.objective.y), abs(skidAngle) / 1.570796));
  let contactWidth = mix(0.185, 0.055, edgeAmount);
  let contactLong = abs(boardLongitudinal) / 0.9;
  let tipTaper = sqrt(max(1.0 - contactLong * contactLong, 0.0));
  let contactSide = abs(boardLateral) / max(contactWidth * tipTaper, 0.012);
  let contactShape = max(contactLong, contactSide);
  let grounded = 1.0 - smoothstep(0.012, 0.085, globals.objective.w);
  let contactShadow = (1.0 - smoothstep(0.42, 1.0, contactShape)) * grounded;
  let contactLip =
    smoothstep(0.86, 1.0, contactShape) *
    (1.0 - smoothstep(1.0, 1.3, contactShape)) *
    grounded;

  var snow = base * (bounce + warmSun * wrapped * shadow * 1.35 + subsurface);
  snow = snow * surfaceVariation;
  snow = mix(snow, snow * vec3<f32>(0.68, 0.8, 0.93), compactedSnow * 0.46);
  snow = snow + vec3<f32>(0.58, 0.78, 0.94) * pushedSnow * (0.055 + wrapped * 0.1);
  snow = snow + vec3<f32>(0.05, 0.52, 1.0) * spellResidue * (0.22 + fresnel * 0.32);
  snow = snow * (1.0 - contactShadow * 0.31);
  snow = snow * (1.0 - contactLip * 0.09) + vec3<f32>(0.48, 0.7, 0.86) * contactLip * 0.19;
  snow = snow + vec3<f32>(1.0, 0.84, 0.62) * roughSpecular * 0.46;
  snow = snow + vec3<f32>(0.76, 0.9, 1.0) * fresnel * 0.15;
  snow = snow + vec3<f32>(1.0, 0.9, 0.7) * glint * 3.4;
  snow = snow + vec3<f32>(0.68, 0.84, 0.95) * fineCrest * 0.035 * wrapped;
  let ritualMark = max(
    ritualSigil(input.worldPosition.xz, globals.beaconA),
    max(
      ritualSigil(input.worldPosition.xz, globals.beaconB),
      ritualSigil(input.worldPosition.xz, globals.beaconC)
    )
  );
  snow = snow + vec3<f32>(0.035, 0.5, 1.0) * ritualMark * (0.2 + fresnel * 0.18);
  let rock = vec3<f32>(0.065, 0.105, 0.14) * (0.72 + warmSun * direct * shadow * 0.65) + vec3<f32>(0.12, 0.19, 0.25) * fresnel * 0.22;
  snow = mix(snow, rock, rockReveal * 0.78);

  let rayDirection = -viewDirection;
  let terrainFromPlayer = abs(input.worldPosition.xz - globals.reserved.xy);
  let terrainEdge = max(terrainFromPlayer.x, terrainFromPlayer.y);
  let edgeFog = smoothstep(69.0, 82.0, terrainEdge);
  let fog = max(smoothstep(16.0, 50.0, input.viewDistance), edgeFog);
  let groundMist = exp(-max(input.worldPosition.y + 0.4, 0.0) * 0.58) * smoothstep(9.0, 72.0, input.viewDistance);
  let atmospheric = atmosphere(normalize(vec3<f32>(rayDirection.x, max(rayDirection.y, 0.025), rayDirection.z)), sunDirection);
  let color = mix(snow, atmospheric, saturate(fog + groundMist * 0.13));
  return vec4<f32>(max(color, vec3<f32>(0.0)), 1.0);
}
`;

export const snowveilDeformationShader = /* wgsl */ `
${sharedUniforms}

@group(0) @binding(1) var previousSnow: texture_2d<f32>;
@group(0) @binding(2) var nextSnow: texture_storage_2d<rgba16float, write>;

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

@compute @workgroup_size(8, 8)
fn updateSnow(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let dimensions = textureDimensions(nextSnow);
  let regionOffset = vec2<u32>(u32(globals.motion.z), u32(globals.motion.w));
  let invocationPixel = invocation.xy + regionOffset;
  if (invocationPixel.x >= dimensions.x || invocationPixel.y >= dimensions.y) {
    return;
  }

  let pixel = vec2<i32>(invocationPixel);
  let uv = (vec2<f32>(invocationPixel) + 0.5) / vec2<f32>(dimensions);
  let world = (uv - 0.5) * 128.0;
  let previous = textureLoad(previousSnow, pixel, 0);
  let delta = min(globals.viewport.w, 1.0);
  var deformation = previous.r * exp(-delta * 0.0035);
  var magicResidue = previous.g * exp(-delta * 0.22);

  let speed = globals.reserved.w;
  let grounded = 1.0 - smoothstep(0.012, 0.085, globals.objective.w);
  if (speed > 0.035 && grounded > 0.01) {
    let boardYaw = globals.objective.x;
    let forward = vec2<f32>(cos(boardYaw), sin(boardYaw));
    let right = vec2<f32>(-sin(boardYaw), cos(boardYaw));
    let currentCenter = globals.reserved.xy;
    let previousCenter = globals.terrain.zw;
    let travelSegment = currentCenter - previousCenter;
    let travelLengthSquared = dot(travelSegment, travelSegment);
    let travelBlend = select(
      1.0,
      clamp(dot(world - previousCenter, travelSegment) / max(travelLengthSquared, 0.000001), 0.0, 1.0),
      travelLengthSquared > 0.000001
    );
    let sweptCenter = mix(previousCenter, currentCenter, travelBlend);
    let relative = world - sweptCenter;
    let longitudinal = dot(relative, forward);
    let lateral = dot(relative, right);
    let alignedBoardYaw = globals.reserved.z - 1.570796;
    let skidAngle = atan2(sin(boardYaw - alignedBoardYaw), cos(boardYaw - alignedBoardYaw));
    let skid = saturate(abs(skidAngle) / 1.570796);
    let steer = globals.objective.y;
    let edgeAmount = saturate(max(abs(steer), skid));
    let edgeSign = select(1.0, sign(steer), abs(steer) > 0.055);
    let contactWidth = mix(0.185, 0.055, edgeAmount);
    let contactOffset = edgeSign * edgeAmount * 0.12;
    let contactLong = abs(longitudinal) / 0.9;
    let tipTaper = sqrt(max(1.0 - contactLong * contactLong, 0.0));
    let contactSide = abs(lateral - contactOffset) / max(contactWidth * tipTaper, 0.012);
    let contactShape = max(contactLong, contactSide);
    let compressed = 1.0 - smoothstep(0.54, 1.0, contactShape);
    let endFade = 1.0 - smoothstep(0.7, 0.99, contactLong);
    let twinRidge =
      smoothstep(0.145, 0.18, abs(lateral)) *
      (1.0 - smoothstep(0.18, 0.235, abs(lateral))) * endFade;
    let singleRidge =
      smoothstep(0.145, 0.18, abs(lateral - edgeSign * 0.025)) *
      (1.0 - smoothstep(0.18, 0.245, abs(lateral - edgeSign * 0.025))) * endFade;
    let edgeRidge = mix(twinRidge, singleRidge, edgeAmount);
    let pressure = mix(0.72, 1.18, max(edgeAmount, skid));
    let stamped = (-0.072 * compressed * pressure + 0.025 * edgeRidge) * speed * grounded;
    if (stamped < 0.0) {
      deformation = min(deformation, stamped);
    } else if (deformation > -0.018) {
      deformation = max(deformation, stamped);
    }
  }

  let spellPulse = globals.weather.z;
  if (spellPulse > 0.01) {
    let spellForward = vec2<f32>(sin(globals.reserved.z), -cos(globals.reserved.z));
    let spellRight = vec2<f32>(cos(globals.reserved.z), sin(globals.reserved.z));
    let spellCenter = globals.reserved.xy + spellForward * 3.2 + spellRight * 0.9;
    let spellDistance = length(world - spellCenter);
    let spellCrater = -(1.0 - smoothstep(0.2, 1.2, spellDistance)) * 0.14 * spellPulse;
    let spellRidge =
      smoothstep(0.82, 1.18, spellDistance) *
      (1.0 - smoothstep(1.18, 1.72, spellDistance)) *
      0.095 * spellPulse;
    let residueRing =
      smoothstep(0.68, 1.05, spellDistance) *
      (1.0 - smoothstep(1.05, 1.62, spellDistance));
    let residueCore = (1.0 - smoothstep(0.0, 0.82, spellDistance)) * 0.3;
    let residuePhaseCompensation = exp(globals.weather.x * 0.22);
    magicResidue = max(
      magicResidue,
      (residueRing + residueCore) * spellPulse * residuePhaseCompensation
    );
    if (spellCrater < -0.001) {
      deformation = min(deformation, spellCrater);
    } else if (spellRidge > 0.001 && deformation > -0.018) {
      deformation = max(deformation, spellRidge);
    }
  }

  textureStore(nextSnow, pixel, vec4<f32>(deformation, magicResidue, 0.0, 1.0));
}
`;

export const snowveilPlayerShader = /* wgsl */ `
${sharedUniforms}

struct PlayerVertexIn {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) part: f32,
};

struct PlayerVertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPosition: vec3<f32>,
  @location(1) worldNormal: vec3<f32>,
  @location(2) viewDirection: vec3<f32>,
  @location(3) viewDistance: f32,
  @location(4) @interpolate(flat) part: u32,
  @location(5) localPosition: vec3<f32>,
};

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn rotateY(point: vec3<f32>, angle: f32) -> vec3<f32> {
  let cosine = cos(angle);
  let sine = sin(angle);
  return vec3<f32>(
    point.x * cosine - point.z * sine,
    point.y,
    point.x * sine + point.z * cosine
  );
}

fn rotateX(point: vec3<f32>, angle: f32) -> vec3<f32> {
  let cosine = cos(angle);
  let sine = sin(angle);
  return vec3<f32>(point.x, point.y * cosine - point.z * sine, point.y * sine + point.z * cosine);
}

fn rotateZ(point: vec3<f32>, angle: f32) -> vec3<f32> {
  let cosine = cos(angle);
  let sine = sin(angle);
  return vec3<f32>(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine, point.z);
}

@vertex
fn vsPlayer(input: PlayerVertexIn) -> PlayerVertexOut {
  var output: PlayerVertexOut;
  let time = globals.viewport.z;
  let speed = globals.reserved.w;
  let travelHeading = globals.reserved.z;
  let boardYaw = globals.objective.x;
  let jumpHeight = globals.objective.w;
  let part = u32(round(input.part));
  let motion = saturate(speed * 1.3);
  let alignedBoardYaw = travelHeading - 1.570796;
  let skidAngle = atan2(sin(boardYaw - alignedBoardYaw), cos(boardYaw - alignedBoardYaw));
  let skid = saturate(abs(skidAngle) / 1.570796);
  let carve = clamp(globals.objective.y, -1.0, 1.0) * motion;
  let airborne = smoothstep(0.015, 0.18, jumpHeight);
  let takeoff = saturate(globals.motion.y / 3.85) * airborne;
  let descent = saturate(-globals.motion.y / 4.4) * airborne;
  let landing = globals.motion.x;
  let ridePose = saturate(globals.pose.x);
  let brakePose = saturate(globals.pose.y);
  let airPose = saturate(globals.pose.z);
  let landPose = saturate(globals.pose.w);
  let idlePose = saturate(1.0 - ridePose - brakePose - airPose - landPose);
  let compression =
    motion * (0.07 + ridePose * 0.07 + abs(carve) * 0.28 + skid * 0.16) +
    brakePose * 0.1 + airPose * (0.04 + descent * 0.08) +
    landing * 0.62 + landPose * 0.18;
  let bob = sin(time * (4.2 + motion * 1.8)) * ridePose * (1.0 - airborne) * 0.006;
  let breath = sin(time * 1.7) * idlePose * 0.006;
  var local = input.position;
  var localNormal = normalize(input.normal);

  if (part != 11u && part != 13u && part != 14u && part != 15u && part != 17u) {
    let upperBody = smoothstep(0.72, 1.55, local.y);
    local.y = local.y + breath * upperBody;
    local.x = local.x + cos(time * 1.15) * idlePose * upperBody * 0.003;
  }

  if (
    part != 11u && part != 13u && part != 14u && part != 15u && part != 17u && part != 21u &&
    !(part == 8u && local.y < 0.28)
  ) {
    local.y = local.y - compression * 0.032;
  }

  let legSide = select(-1.0, 1.0, local.x >= 0.0);
  let edgeLoad = saturate(0.5 + carve * legSide * 0.38 + skid * 0.12);
  let kneeFlex =
    ridePose * 0.13 + brakePose * 0.29 + compression * 0.24 + landing * 0.08 +
    skid * 0.045 + airPose * (0.24 + descent * 0.1) + landPose * 0.3;
  if (part == 12u) {
    let hipPivot = vec3<f32>(legSide * 0.17, 0.77, 0.02);
    let upperLegAngle = kneeFlex * (0.78 + edgeLoad * 0.4);
    local = hipPivot + rotateX(local - hipPivot, upperLegAngle);
    localNormal = rotateX(localNormal, upperLegAngle);
  }
  if (part == 13u || part == 21u) {
    let anklePivot = vec3<f32>(legSide * 0.25, 0.165, select(-0.08, -0.04, legSide > 0.0));
    let lowerLegAngle = -kneeFlex * (1.38 - edgeLoad * 0.16);
    local = anklePivot + rotateX(local - anklePivot, lowerLegAngle);
    localNormal = rotateX(localNormal, lowerLegAngle);
  }
  if (part == 5u) {
    let tail = saturate((local.z - 0.08) / 1.52);
    local.x = local.x + sin(time * (2.9 + motion * 2.5) + tail * 6.4) * (0.018 + tail * 0.115) * (0.35 + motion);
    local.y = local.y + sin(time * (2.45 + motion * 1.7) + tail * 4.8) * tail * (0.018 + motion * 0.034);
    local.z = local.z + motion * tail * (0.04 + 0.045 * sin(time * 2.1 + tail * 3.7));
  }
  if (part == 11u) {
    let spellCenter = vec3<f32>(0.9, 0.88, -3.2);
    local = spellCenter + (local - spellCenter) * (0.3 + globals.weather.z * 0.7);
    local.y = local.y + sin(time * 7.0) * 0.045;
  }
  if (part == 1u) {
    let hem = 1.0 - saturate(local.y / 1.38);
    local.x = local.x + (sin(time * 2.15 + local.z * 3.1) * motion * 0.034 + carve * 0.022) * hem;
    local.z = local.z + sin(time * 2.7 + local.x * 4.6) * hem * motion * 0.018;
  }
  if (part == 6u) {
    let capeTail = saturate((1.31 - local.y) / 0.72);
    local.x = local.x + sin(time * (2.5 + motion * 1.4) + capeTail * 5.2) * capeTail * (0.012 + motion * 0.052);
    local.y = local.y + cos(time * 2.2 + capeTail * 4.3) * capeTail * motion * 0.022;
    local.z = local.z + capeTail * motion * (0.025 + 0.035 * sin(time * 1.9 + capeTail * 3.6));
  }

  let armSide = select(-1.0, 1.0, local.x >= 0.0);
  let shoulderPivot = select(
    vec3<f32>(-0.34, 1.25, -0.01),
    vec3<f32>(0.34, 1.26, -0.03),
    armSide > 0.0
  );
  let elbowPivot = select(
    vec3<f32>(-0.53, 1.04, -0.06),
    vec3<f32>(0.53, 1.1, -0.19),
    armSide > 0.0
  );
  let castPose = smoothstep(0.035, 0.42, globals.weather.z);
  let athleticPose = saturate(ridePose + brakePose + airPose + landPose);
  let relaxedRightForearm = mix(-1.42, -0.78, athleticPose) * (1.0 - castPose);
  let authoredForearmPose = select(
    -1.82 * athleticPose,
    relaxedRightForearm,
    armSide > 0.0
  );
  let shoulderBalance =
    -carve * armSide * (0.075 + motion * 0.045) + skid * armSide * 0.035 +
    brakePose * armSide * 0.065 - airPose * armSide * 0.09 +
    takeoff * 0.045 + landPose * armSide * 0.04;
  let elbowBalance =
    carve * armSide * 0.055 + motion * (0.018 + 0.012 * sin(time * 3.1 + armSide)) +
    skid * 0.025 + brakePose * 0.055 - airPose * 0.055 + landPose * 0.06 +
    authoredForearmPose;
  if (part == 19u || part == 20u || part == 16u || part == 23u || part == 9u) {
    local = elbowPivot + rotateZ(local - elbowPivot, elbowBalance);
    localNormal = rotateZ(localNormal, elbowBalance);
  }
  if (part == 18u || part == 19u || part == 20u || part == 16u || part == 23u || part == 9u) {
    local = shoulderPivot + rotateZ(local - shoulderPivot, shoulderBalance);
    localNormal = rotateZ(localNormal, shoulderBalance);
  }

  if (
    part != 11u && part != 12u && part != 13u && part != 14u && part != 15u &&
    part != 17u && part != 21u
  ) {
    let lookBlend = smoothstep(0.76, 1.48, local.y);
    let lookTwist = mix(0.92, 0.08, skid) * motion * lookBlend;
    let torsoPivot = vec3<f32>(0.0, 0.88, -0.02);
    local = torsoPivot + rotateY(local - torsoPivot, lookTwist);
    localNormal = rotateY(localNormal, lookTwist);
  }

  if (
    part == 0u || part == 3u || part == 4u || part == 5u ||
    part == 22u || part == 24u || part == 25u ||
    (part == 10u && local.y > 1.48) ||
    (part == 8u && local.y > 1.3)
  ) {
    let headLook = mix(0.27, 0.035, skid) * motion;
    let headPivot = vec3<f32>(0.0, 1.5, -0.02);
    local = headPivot + rotateY(local - headPivot, headLook);
    localNormal = rotateY(localNormal, headLook);
  }

  let lean = carve * (0.08 + ridePose * 0.04) + skid * 0.03 + brakePose * 0.025 + compression * 0.012;
  let bank = carve * 0.026;
  if (part != 11u && part != 14u && part != 15u && part != 17u) {
    let stancePivot = vec3<f32>(0.0, 0.12, -0.04);
    local = stancePivot + rotateX(local - stancePivot, lean);
    localNormal = rotateX(localNormal, lean);
    local = stancePivot + rotateZ(local - stancePivot, bank);
    localNormal = rotateZ(localNormal, bank);
  }
  if (part == 14u || part == 15u || part == 17u || (part == 8u && local.y < 0.28)) {
    let boardEdge = carve * 0.12 + skid * 0.085;
    local = rotateX(local, boardEdge);
    localNormal = rotateX(localNormal, boardEdge);
  }
  if (part != 11u && airborne > 0.001) {
    let airPivot = vec3<f32>(0.0, 0.42, -0.04);
    let airPitch = takeoff * 0.065 - descent * 0.048;
    local = airPivot + rotateZ(local - airPivot, airPitch);
    localNormal = rotateZ(localNormal, airPitch);
  }

  let modelYaw = select(boardYaw, travelHeading, part == 11u);
  let playerOrigin = vec3<f32>(globals.reserved.x, globals.weather.y - 0.015 + bob + jumpHeight, globals.reserved.y);
  var worldOffset = rotateY(local, modelYaw);
  var worldNormal = rotateY(localNormal, modelYaw);
  if (part != 11u) {
    let terrainPitch = -atan(clamp(globals.terrain.y, -0.5, 0.5));
    let terrainRoll = atan(clamp(globals.terrain.x, -0.5, 0.5));
    worldOffset = rotateZ(rotateX(worldOffset, terrainPitch), terrainRoll);
    worldNormal = rotateZ(rotateX(worldNormal, terrainPitch), terrainRoll);
  }
  let worldPosition = playerOrigin + worldOffset;
  worldNormal = normalize(worldNormal);

  let cameraDistance = globals.camera.z;
  let fieldOfView = globals.camera.w;
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let cameraTarget = vec3<f32>(globals.reserved.x, globals.weather.y + 1.05, globals.reserved.y);
  let orbit = vec3<f32>(sin(globals.camera.x) * cameraDistance, 2.0 + globals.camera.y * 7.0, cos(globals.camera.x) * cameraDistance);
  let cameraPosition = cameraTarget + orbit;
  let forward = normalize(cameraTarget - cameraPosition);
  let right = normalize(cross(forward, vec3<f32>(0.0, 1.0, 0.0)));
  let up = normalize(cross(right, forward));
  let relative = worldPosition - cameraPosition;
  let viewX = dot(relative, right);
  let viewY = dot(relative, up);
  let viewZ = dot(relative, forward);
  let focal = 1.0 / fieldOfView;
  let near = 0.08;
  let far = 220.0;
  let clipZ = (far / (far - near)) * viewZ - (near * far / (far - near));

  output.position = vec4<f32>(viewX * focal / aspect, viewY * focal, clipZ, viewZ);
  output.worldPosition = worldPosition;
  output.worldNormal = worldNormal;
  output.viewDirection = cameraPosition - worldPosition;
  output.viewDistance = length(relative);
  output.part = part;
  output.localPosition = local;
  return output;
}

@fragment
fn fsPlayer(input: PlayerVertexOut) -> @location(0) vec4<f32> {
  let normal = normalize(input.worldNormal);
  let viewDirection = normalize(input.viewDirection);
  let sunDirection = normalize(vec3<f32>(0.44, 0.205, -0.874));
  let halfway = normalize(viewDirection + sunDirection);
  let direct = saturate(dot(normal, sunDirection));
  let sky = 0.32 + saturate(normal.y) * 0.42;
  let rim = pow(1.0 - saturate(dot(normal, viewDirection)), 3.0);
  let specular = pow(saturate(dot(normal, halfway)), 56.0);

  var albedo = vec3<f32>(0.105, 0.235, 0.29);
  var roughness = 0.86;
  if (input.part == 1u) {
    let dyeHeight = smoothstep(0.56, 1.34, input.localPosition.y);
    albedo = mix(vec3<f32>(0.072, 0.175, 0.218), vec3<f32>(0.125, 0.285, 0.335), dyeHeight);
    roughness = 0.92;
  } else if (input.part == 0u) {
    albedo = vec3<f32>(0.035, 0.085, 0.105);
    roughness = 0.22;
  } else if (input.part == 2u) {
    albedo = vec3<f32>(0.087, 0.205, 0.254);
    roughness = 0.82;
  } else if (input.part == 3u) {
    albedo = vec3<f32>(0.09, 0.218, 0.278);
    roughness = 0.88;
  } else if (input.part == 4u) {
    albedo = vec3<f32>(0.78, 0.52, 0.33);
    roughness = 0.72;
  } else if (input.part == 5u) {
    albedo = vec3<f32>(0.39, 0.055, 0.038);
  } else if (input.part == 6u) {
    albedo = vec3<f32>(0.072, 0.185, 0.235);
    roughness = 0.9;
  } else if (input.part == 7u || input.part == 18u || input.part == 19u) {
    albedo = vec3<f32>(0.06, 0.15, 0.205);
  } else if (input.part == 8u) {
    albedo = vec3<f32>(0.16, 0.27, 0.32);
    roughness = 0.34;
  } else if (input.part == 10u) {
    albedo = vec3<f32>(0.018, 0.052, 0.078);
  } else if (input.part == 12u) {
    albedo = vec3<f32>(0.035, 0.095, 0.125);
    roughness = 0.74;
  } else if (input.part == 13u || input.part == 16u || input.part == 17u) {
    albedo = vec3<f32>(0.018, 0.046, 0.062);
    roughness = 0.42;
  } else if (input.part == 20u || input.part == 21u) {
    albedo = vec3<f32>(0.105, 0.215, 0.255);
    roughness = 0.3;
  } else if (input.part == 22u) {
    let lensSide = smoothstep(-0.12, 0.12, input.localPosition.x);
    albedo = mix(vec3<f32>(0.035, 0.25, 0.34), vec3<f32>(0.12, 0.42, 0.5), lensSide);
    roughness = 0.08;
  } else if (input.part == 23u) {
    albedo = vec3<f32>(0.012, 0.036, 0.05);
    roughness = 0.36;
  } else if (input.part == 24u) {
    albedo = vec3<f32>(0.045, 0.105, 0.13);
    roughness = 0.62;
  } else if (input.part == 25u) {
    albedo = vec3<f32>(0.012, 0.045, 0.062);
    roughness = 0.28;
  } else if (input.part == 14u) {
    let nose = smoothstep(0.08, 0.94, input.localPosition.x);
    let noseInlay =
      (1.0 - smoothstep(0.018, 0.062, abs(input.localPosition.z + 0.08))) *
      smoothstep(0.18, 0.5, input.localPosition.x);
    albedo = mix(vec3<f32>(0.055, 0.225, 0.285), vec3<f32>(0.105, 0.36, 0.42), nose);
    albedo = albedo + vec3<f32>(0.42, 0.76, 0.82) * noseInlay * 0.58;
    roughness = 0.24;
  } else if (input.part == 15u) {
    albedo = vec3<f32>(0.012, 0.038, 0.05);
    roughness = 0.34;
  }

  let coolAmbient = vec3<f32>(0.44, 0.62, 0.78) * (0.64 + sky * 0.42);
  let warmDirect = vec3<f32>(1.0, 0.73, 0.48) * (0.12 + direct * 1.32);
  var color = albedo * (coolAmbient + warmDirect);
  let snowBounce = 0.07 + saturate(-normal.y * 0.5 + 0.5) * 0.08;
  color = color + albedo * vec3<f32>(0.34, 0.5, 0.65) * snowBounce;
  var clothLift = 1.0;
  if (input.part == 1u) {
    clothLift = 0.965 + 0.035 * sin(input.localPosition.y * 34.0 + input.localPosition.x * 19.0);
  }
  color = color * clothLift;

  let weaveX = input.localPosition.x * 176.0 + input.localPosition.z * 31.0;
  let weaveY = input.localPosition.y * 194.0 - input.localPosition.z * 23.0;
  let weaveSampling = 1.0 - smoothstep(0.42, 1.5, max(fwidth(weaveX), fwidth(weaveY)));
  let weave = sin(weaveX) * sin(weaveY) * weaveSampling;
  let clothMaterial =
    input.part == 1u || input.part == 2u || input.part == 3u || input.part == 6u ||
    input.part == 7u || input.part == 12u || input.part == 18u || input.part == 19u;
  if (clothMaterial) {
    color = color * (0.985 + weave * 0.015);
  }
  if (input.part == 1u) {
    let panelAngle = atan2(input.localPosition.z, input.localPosition.x);
    let panelSeam = pow(abs(sin(panelAngle * 4.0)), 46.0);
    let hem = 1.0 - smoothstep(0.04, 0.12, abs(input.localPosition.y - 0.58));
    color = color * (1.0 - panelSeam * 0.16);
    color = color + vec3<f32>(0.08, 0.16, 0.21) * hem * 0.22;
  }
  if (input.part == 3u) {
    let hoodBack = smoothstep(0.035, 0.16, input.localPosition.z);
    let hoodSeam = 1.0 - smoothstep(0.008, 0.026, abs(input.localPosition.x));
    color = color + vec3<f32>(0.16, 0.3, 0.38) * hoodBack * hoodSeam * 0.18;
  }
  if (input.part == 0u) {
    let visorBand = 1.0 - smoothstep(0.016, 0.042, abs(input.localPosition.y - 1.605));
    color = color + vec3<f32>(0.12, 0.48, 0.68) * visorBand * (0.12 + rim * 0.28);
  }
  if (input.part == 22u) {
    let opticalFresnel = pow(1.0 - saturate(dot(normal, viewDirection)), 2.0);
    let lensSweep = 0.5 + 0.5 * sin(input.localPosition.x * 34.0 - input.localPosition.y * 18.0);
    color = color + vec3<f32>(0.18, 0.72, 0.9) * (0.2 + opticalFresnel * 0.58 + lensSweep * 0.075);
  }
  if (input.part == 24u) {
    let maskCenter = 1.0 - smoothstep(0.012, 0.075, abs(input.localPosition.x));
    color = color * (1.0 - maskCenter * 0.12) + vec3<f32>(0.08, 0.2, 0.25) * maskCenter * 0.08;
  }
  if (input.part == 6u) {
    let capeTail = saturate((1.29 - input.localPosition.y) / 0.61);
    let capeCenter = capeTail * 0.055 + sin(capeTail * 3.14159) * 0.035;
    let capeEdge = smoothstep(0.19, 0.34, abs(input.localPosition.x - capeCenter));
    let capeSeam = 1.0 - smoothstep(0.008, 0.024, abs(input.localPosition.x - capeCenter));
    let capeFold = 0.95 + 0.05 * cos(input.localPosition.x * 18.0 + input.localPosition.y * 4.0);
    color = color * capeFold * (1.0 - capeEdge * 0.12);
    color = color + vec3<f32>(0.12, 0.26, 0.31) * capeSeam * 0.12;
  }
  color = color + vec3<f32>(0.43, 0.67, 0.82) * rim * 0.34;
  color = color + vec3<f32>(1.0, 0.82, 0.61) * specular * (1.0 - roughness) * 0.6;

  var snowCatch = 0.0;
  if (
    input.part == 2u || input.part == 8u || input.part == 10u || input.part == 14u ||
    input.part == 20u || input.part == 21u
  ) {
    snowCatch = smoothstep(0.58, 0.91, normal.y) * 0.13;
  }
  color = mix(color, vec3<f32>(0.63, 0.78, 0.88) * (0.7 + direct * 0.7), snowCatch);

  if (input.part == 9u) {
    let pulse = 0.88 + sin(globals.viewport.z * 3.2) * 0.12;
    let charge = 0.18 + globals.weather.z * 0.82;
    color = vec3<f32>(0.22, 0.72, 1.0) * (1.15 + charge * 6.9) * pulse;
  }
  if (input.part == 11u) {
    if (globals.weather.z < 0.012) {
      discard;
    }
    let energyRim = pow(1.0 - saturate(dot(normal, viewDirection)), 2.0);
    color = vec3<f32>(0.08, 0.64, 1.0) * (3.8 + energyRim * 4.5) * globals.weather.z;
  }

  let fog = smoothstep(18.0, 74.0, input.viewDistance);
  color = mix(color, vec3<f32>(0.48, 0.62, 0.72), fog * 0.82);
  return vec4<f32>(max(color, vec3<f32>(0.0)), 1.0);
}
`;

export const snowveilBeaconShader = /* wgsl */ `
${sharedUniforms}

struct BeaconVertexIn {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) part: f32,
};

struct BeaconVertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPosition: vec3<f32>,
  @location(1) worldNormal: vec3<f32>,
  @location(2) viewDirection: vec3<f32>,
  @location(3) localPosition: vec3<f32>,
  @location(4) @interpolate(flat) part: u32,
  @location(5) @interpolate(flat) activation: f32,
  @location(6) viewDistance: f32,
  @location(7) @interpolate(flat) cameraOcclusion: f32,
};

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn rotateY(point: vec3<f32>, angle: f32) -> vec3<f32> {
  let cosine = cos(angle);
  let sine = sin(angle);
  return vec3<f32>(point.x * cosine + point.z * sine, point.y, -point.x * sine + point.z * cosine);
}

fn beaconData(instance: u32) -> vec4<f32> {
  if (instance == 0u) {
    return globals.beaconA;
  }
  if (instance == 1u) {
    return globals.beaconB;
  }
  return globals.beaconC;
}

fn atmosphere(direction: vec3<f32>, sunDirection: vec3<f32>) -> vec3<f32> {
  let up = saturate(direction.y * 0.5 + 0.5);
  let horizon = pow(1.0 - abs(direction.y), 4.0);
  let sunAmount = saturate(dot(direction, sunDirection));
  var color = mix(vec3<f32>(0.54, 0.67, 0.75), vec3<f32>(0.035, 0.115, 0.19), pow(up, 0.66));
  color = color + vec3<f32>(0.3, 0.23, 0.16) * horizon * pow(sunAmount, 5.0);
  color = color + vec3<f32>(1.0, 0.78, 0.51) * pow(sunAmount, 460.0) * 7.0;
  color = color + vec3<f32>(1.0, 0.62, 0.34) * pow(sunAmount, 38.0) * 0.72;
  return color;
}

@vertex
fn vsBeacon(input: BeaconVertexIn, @builtin(instance_index) instance: u32) -> BeaconVertexOut {
  var output: BeaconVertexOut;
  let beacon = beaconData(instance);
  let activation = beacon.w;
  let part = u32(round(input.part));
  let time = globals.viewport.z;
  var local = input.position;
  var normal = normalize(input.normal);

  if (part == 2u) {
    let ringAngle = time * (0.14 + activation * 0.72) + f32(instance) * 1.7;
    local = rotateY(local, ringAngle);
    normal = rotateY(normal, ringAngle);
    local.y = local.y + activation * (0.075 + sin(time * 2.4 + f32(instance)) * 0.028);
  }
  if (part == 1u) {
    let crystalScale = 0.94 + activation * (0.06 + sin(time * 2.9 + f32(instance) * 1.3) * 0.018);
    local.y = 0.48 + (local.y - 0.48) * crystalScale;
  }

  let worldPosition = beacon.xyz + local;
  let cameraTarget = vec3<f32>(globals.reserved.x, globals.weather.y + 1.05, globals.reserved.y);
  let orbit = vec3<f32>(sin(globals.camera.x) * globals.camera.z, 2.0 + globals.camera.y * 7.0, cos(globals.camera.x) * globals.camera.z);
  let cameraPosition = cameraTarget + orbit;
  let forward = normalize(cameraTarget - cameraPosition);
  let right = normalize(cross(forward, vec3<f32>(0.0, 1.0, 0.0)));
  let up = normalize(cross(right, forward));
  let relative = worldPosition - cameraPosition;
  let viewX = dot(relative, right);
  let viewY = dot(relative, up);
  let viewZ = dot(relative, forward);
  let focal = 1.0 / globals.camera.w;
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let near = 0.08;
  let far = 220.0;
  let clipZ = (far / (far - near)) * viewZ - (near * far / (far - near));

  output.position = vec4<f32>(viewX * focal / aspect, viewY * focal, clipZ, viewZ);
  output.worldPosition = worldPosition;
  output.worldNormal = normal;
  output.viewDirection = cameraPosition - worldPosition;
  output.localPosition = local;
  output.part = part;
  output.activation = activation;
  output.viewDistance = length(relative);
  let playerDistance = length(cameraTarget - cameraPosition);
  let beaconFromCamera = beacon.xyz - cameraPosition;
  let beaconAlongView = dot(beaconFromCamera, forward);
  let beaconFromSightline = length(beaconFromCamera - forward * beaconAlongView);
  let betweenCameraAndRider =
    step(0.25, beaconAlongView) * (1.0 - step(playerDistance + 0.85, beaconAlongView));
  let sightlineCorridor = 1.0 - smoothstep(0.9, 2.8, beaconFromSightline);
  output.cameraOcclusion = betweenCameraAndRider * sightlineCorridor;
  return output;
}

@fragment
fn fsBeacon(input: BeaconVertexOut) -> @location(0) vec4<f32> {
  let normal = normalize(input.worldNormal);
  let viewDirection = normalize(input.viewDirection);
  let sunDirection = normalize(vec3<f32>(0.44, 0.205, -0.874));
  let halfway = normalize(viewDirection + sunDirection);
  let direct = saturate(dot(normal, sunDirection));
  let rim = pow(1.0 - saturate(dot(normal, viewDirection)), 3.0);
  let specular = pow(saturate(dot(normal, halfway)), 72.0);

  var albedo = vec3<f32>(0.09, 0.145, 0.175);
  var roughness = 0.82;
  if (input.part == 1u) {
    albedo = mix(vec3<f32>(0.1, 0.27, 0.35), vec3<f32>(0.075, 0.53, 0.72), input.activation);
    roughness = 0.2;
  } else if (input.part == 2u) {
    albedo = mix(vec3<f32>(0.055, 0.11, 0.14), vec3<f32>(0.1, 0.42, 0.58), input.activation);
    roughness = 0.27;
  } else if (input.part == 3u) {
    albedo = vec3<f32>(0.55, 0.67, 0.73);
    roughness = 0.9;
  }

  let ambient = vec3<f32>(0.37, 0.53, 0.68) * (0.7 + saturate(normal.y) * 0.35);
  let warm = vec3<f32>(1.0, 0.7, 0.43) * (0.1 + direct * 1.15);
  var color = albedo * (ambient + warm);
  color = color + vec3<f32>(0.35, 0.65, 0.82) * rim * 0.24;
  color = color + vec3<f32>(1.0, 0.82, 0.62) * specular * (1.0 - roughness) * 0.52;

  if (input.part == 1u) {
    let facet = 0.72 + 0.28 * abs(normal.x * 0.63 + normal.z * 0.37);
    let core = smoothstep(0.52, 1.42, input.localPosition.y);
    let crystalLight = 0.13 + input.activation * (0.72 + core * 1.15 + rim * 0.52);
    color = color * facet + vec3<f32>(0.04, 0.56, 1.0) * crystalLight;
  }
  if (input.part == 2u) {
    color = color + vec3<f32>(0.08, 0.62, 1.0) * (0.05 + input.activation * (0.52 + rim * 1.05));
  }
  if (input.part == 0u) {
    let stoneBand = 0.88 + sin(input.localPosition.y * 19.0 + input.localPosition.x * 3.7) * 0.06;
    color = color * stoneBand + vec3<f32>(0.06, 0.11, 0.15) * (0.72 + rim * 0.28);
  }

  let rayDirection = -viewDirection;
  let fog = smoothstep(18.0, 50.0, input.viewDistance);
  color = mix(color, atmosphere(normalize(vec3<f32>(rayDirection.x, max(rayDirection.y, 0.025), rayDirection.z)), sunDirection), fog);
  // A beacon crossed by the chase camera should reveal the rider instead of
  // becoming an opaque full-frame obstruction. At normal gameplay distances
  // this evaluates to one and preserves the established material.
  let proximityFade = smoothstep(1.6, 5.0, input.viewDistance);
  let sightlineFade = mix(1.0, 0.1, input.cameraOcclusion);
  let cameraFade = min(proximityFade, sightlineFade);
  return vec4<f32>(max(color, vec3<f32>(0.0)), cameraFade);
}
`;

export const snowveilPostShader = /* wgsl */ `
${sharedUniforms}

@group(0) @binding(1) var sceneColor: texture_2d<f32>;
@group(0) @binding(2) var sceneSampler: sampler;

struct PostVertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vsPost(@builtin(vertex_index) vertexIndex: u32) -> PostVertexOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var output: PostVertexOut;
  let position = positions[vertexIndex];
  output.position = vec4<f32>(position, 0.0, 1.0);
  // WebGPU render targets use a top-left texture origin, while this
  // fullscreen triangle is authored in clip space. Flip Y when resolving
  // the off-screen HDR target so the final canvas keeps its orientation.
  output.uv = vec2<f32>(position.x * 0.5 + 0.5, 1.0 - (position.y * 0.5 + 0.5));
  return output;
}

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn hash12(point: vec2<f32>) -> f32 {
  let p = fract(vec3<f32>(point.xyx) * vec3<f32>(0.1031, 0.1030, 0.0973));
  let q = p + dot(p, p.yzx + vec3<f32>(33.33));
  return fract((q.x + q.y) * q.z);
}

fn bloomSource(color: vec3<f32>) -> vec3<f32> {
  let luminance = dot(color, vec3<f32>(0.2126, 0.7152, 0.0722));
  let contribution = smoothstep(0.78, 1.65, luminance);
  return color * contribution;
}

fn aces(color: vec3<f32>) -> vec3<f32> {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

@fragment
fn fsPost(input: PostVertexOut) -> @location(0) vec4<f32> {
  let dimensions = vec2<f32>(textureDimensions(sceneColor));
  let texel = 1.0 / dimensions;
  let center = textureSample(sceneColor, sceneSampler, input.uv).rgb;

  var bloom = vec3<f32>(0.0);
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(2.0, 0.0)).rgb);
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(-2.0, 0.0)).rgb);
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(0.0, 2.0)).rgb);
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(0.0, -2.0)).rgb);
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(4.0, 4.0)).rgb) * 0.72;
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(-4.0, 4.0)).rgb) * 0.72;
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(4.0, -4.0)).rgb) * 0.72;
  bloom = bloom + bloomSource(textureSample(sceneColor, sceneSampler, input.uv + texel * vec2<f32>(-4.0, -4.0)).rgb) * 0.72;
  bloom = bloom / 6.88;

  var color = aces(center * 0.96 + bloom * 0.19);
  color = (color - 0.5) * 1.035 + 0.5;

  let vignetteUv = input.uv * (1.0 - input.uv.yx);
  let vignette = pow(saturate(vignetteUv.x * vignetteUv.y * 18.0), 0.11);
  color = color * mix(0.79, 1.0, vignette);

  let completionAge = globals.objective.z;
  if (completionAge < 4.2) {
    let aspect = dimensions.x / max(dimensions.y, 1.0);
    let ritualPoint = (input.uv - 0.5) * vec2<f32>(aspect, 1.0);
    let ritualRadius = length(ritualPoint);
    let waveRadius = completionAge * 0.43;
    let waveWidth = 0.018 + completionAge * 0.012;
    let wave = 1.0 - smoothstep(waveWidth, waveWidth * 3.4, abs(ritualRadius - waveRadius));
    let flash = exp(-completionAge * 2.6);
    let crystallineEdge = pow(saturate(1.0 - ritualRadius * 0.72), 4.0) * exp(-completionAge * 0.74);
    color = color + vec3<f32>(0.08, 0.48, 0.86) * (wave * 0.2 + flash * 0.1 + crystallineEdge * 0.035);
  }

  let grain = hash12(input.uv * dimensions + fract(globals.viewport.z) * 91.0) - 0.5;
  color = color + grain * 0.0065;
  color = pow(max(color, vec3<f32>(0.0)), vec3<f32>(0.95));
  return vec4<f32>(color, 1.0);
}
`;
