const sharedUniforms = /* wgsl */ `
struct Globals {
  viewport: vec4<f32>,
  camera: vec4<f32>,
  weather: vec4<f32>,
  reserved: vec4<f32>,
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
  for (var layer = 0; layer < 3; layer = layer + 1) {
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
  for (var layer = 0; layer < 2; layer = layer + 1) {
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

  let cameraTarget = vec3<f32>(0.0, 1.1, -5.0);
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
  let alpha = saturate(flake * 0.42);
  return vec4<f32>(vec3<f32>(0.78, 0.89, 0.96), alpha);
}
`;

export const snowveilTerrainShader = /* wgsl */ `
${sharedUniforms}

struct TerrainVertexIn {
  @location(0) grid: vec2<f32>,
};

struct TerrainVertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPosition: vec3<f32>,
  @location(1) worldNormal: vec3<f32>,
  @location(2) viewDirection: vec3<f32>,
  @location(3) viewDistance: f32,
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

fn terrainHeight(point: vec2<f32>) -> f32 {
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
  let farRise = smoothstep(38.0, 82.0, radius) * mountainProfile;
  let outcrop = outcropField(point);
  let outcropLift = smoothstep(0.12, 0.58, outcrop) * 1.55 + smoothstep(0.46, 0.78, outcrop) * 0.32;
  return -0.72 + broad + longSwell + drifts + ridges + heroDune + foregroundDip + farRise + outcropLift;
}

fn terrainNormal(point: vec2<f32>) -> vec3<f32> {
  let epsilon = 0.12;
  let left = terrainHeight(point - vec2<f32>(epsilon, 0.0));
  let right = terrainHeight(point + vec2<f32>(epsilon, 0.0));
  let back = terrainHeight(point - vec2<f32>(0.0, epsilon));
  let front = terrainHeight(point + vec2<f32>(0.0, epsilon));
  return normalize(vec3<f32>(left - right, epsilon * 2.0, back - front));
}

@vertex
fn vsTerrain(input: TerrainVertexIn) -> TerrainVertexOut {
  var output: TerrainVertexOut;
  let worldXZ = input.grid * 86.0;
  let worldPosition = vec3<f32>(worldXZ.x, terrainHeight(worldXZ), worldXZ.y);

  let yaw = globals.camera.x;
  let pitch = globals.camera.y;
  let cameraDistance = globals.camera.z;
  let fieldOfView = globals.camera.w;
  let aspect = globals.viewport.x / max(globals.viewport.y, 1.0);
  let cameraTarget = vec3<f32>(0.0, 1.1, -5.0);
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

  output.position = vec4<f32>(viewX * focal / aspect, viewY * focal, clipZ, viewZ);
  output.worldPosition = worldPosition;
  output.worldNormal = terrainNormal(worldXZ);
  output.viewDirection = cameraPosition - worldPosition;
  output.viewDistance = length(relative);
  return output;
}

fn softShadow(position: vec3<f32>, sunDirection: vec3<f32>) -> f32 {
  var shade = 1.0;
  var travel = 0.18;
  for (var step = 0; step < 10; step = step + 1) {
    let samplePosition = position + sunDirection * travel;
    let clearance = samplePosition.y - terrainHeight(samplePosition.xz);
    shade = min(shade, 6.0 * clearance / travel);
    if (clearance < 0.002 || travel > 38.0) {
      break;
    }
    travel = travel + clamp(clearance * 0.88, 0.16, 4.2);
  }
  return saturate(shade * 0.55 + 0.4);
}

fn atmosphere(direction: vec3<f32>, sunDirection: vec3<f32>) -> vec3<f32> {
  let up = saturate(direction.y * 0.5 + 0.5);
  let sunAmount = saturate(dot(direction, sunDirection));
  var color = mix(vec3<f32>(0.55, 0.68, 0.76), vec3<f32>(0.035, 0.115, 0.19), pow(up, 0.66));
  color = color + vec3<f32>(0.5, 0.34, 0.21) * pow(sunAmount, 18.0) * 0.25;
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
  let ripple = sin(dot(input.worldPosition.xz, across) * 3.8 + noise2(input.worldPosition.xz * 0.68) * 2.2);
  let rippleBreak = smoothstep(0.28, 0.74, noise2(vec2<f32>(
    dot(input.worldPosition.xz, wind) * 0.21,
    dot(input.worldPosition.xz, across) * 0.085
  )));
  let fineWave = sin(dot(input.worldPosition.xz, across) * 13.5 + noise2(input.worldPosition.xz * 0.38) * 4.2);
  let fineRipple = fineWave * rippleBreak;
  normal = normalize(
    normal + vec3<f32>(microA * 0.054, 0.0, microB * 0.054) * detailFade +
    vec3<f32>(across.x, 0.0, across.y) * (ripple * 0.032 + microC * 0.045 + fineRipple * 0.026) * detailFade
  );

  let direct = saturate(dot(normal, sunDirection));
  var shadow = 1.0;
  if (input.viewDistance < 34.0 && direct > 0.01) {
    shadow = softShadow(input.worldPosition + normal * 0.04, sunDirection);
  }

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
  let ridgeTone = pow(abs(sin(dot(input.worldPosition.xz, across) * 3.2)), 24.0) * detailFade;
  let fineCrest = pow(max(fineWave, 0.0), 10.0) * rippleBreak * detailFade;
  let surfaceVariation = 0.95 + 0.05 * noise2(input.worldPosition.xz * 3.1) - ridgeTone * 0.018 - fineCrest * 0.032;
  let outcrop = outcropField(input.worldPosition.xz);
  let rockReveal = smoothstep(0.24, 0.72, outcrop) * smoothstep(0.1, 0.46, 1.0 - normal.y);

  var snow = base * (bounce + warmSun * wrapped * shadow * 1.35 + subsurface);
  snow = snow * surfaceVariation;
  snow = snow + vec3<f32>(1.0, 0.84, 0.62) * roughSpecular * 0.46;
  snow = snow + vec3<f32>(0.76, 0.9, 1.0) * fresnel * 0.15;
  snow = snow + vec3<f32>(1.0, 0.9, 0.7) * glint * 3.4;
  snow = snow + vec3<f32>(0.68, 0.84, 0.95) * fineCrest * 0.035 * wrapped;
  let rock = vec3<f32>(0.065, 0.105, 0.14) * (0.72 + warmSun * direct * shadow * 0.65) + vec3<f32>(0.12, 0.19, 0.25) * fresnel * 0.22;
  snow = mix(snow, rock, rockReveal * 0.78);

  let rayDirection = -viewDirection;
  let fog = smoothstep(16.0, 82.0, input.viewDistance);
  let groundMist = exp(-max(input.worldPosition.y + 0.4, 0.0) * 0.58) * smoothstep(9.0, 72.0, input.viewDistance);
  let atmospheric = atmosphere(normalize(vec3<f32>(rayDirection.x, max(rayDirection.y, 0.025), rayDirection.z)), sunDirection);
  let color = mix(snow, atmospheric, saturate(fog * 0.92 + groundMist * 0.13));
  return vec4<f32>(max(color, vec3<f32>(0.0)), 1.0);
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

  let grain = hash12(input.uv * dimensions + fract(globals.viewport.z) * 91.0) - 0.5;
  color = color + grain * 0.0065;
  color = pow(max(color, vec3<f32>(0.0)), vec3<f32>(0.95));
  return vec4<f32>(color, 1.0);
}
`;
