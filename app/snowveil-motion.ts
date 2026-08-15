export function slopeAlongHeading(slopeX: number, slopeZ: number, heading: number) {
  const forwardX = Math.sin(heading);
  const forwardZ = -Math.cos(heading);
  return slopeX * forwardX + slopeZ * forwardZ;
}

export function snowboardTargetYaw(travelHeading: number, brakeAmount: number, steerAmount: number) {
  const brake = Math.max(0, Math.min(brakeAmount, 1));
  const steer = Math.max(-1, Math.min(steerAmount, 1));
  return travelHeading - Math.PI / 2 + brake * Math.PI / 2 + steer * 0.075 * (1 - brake);
}

export function snowboardLongAxis(boardYaw: number) {
  return { x: Math.cos(boardYaw), z: Math.sin(boardYaw) };
}

export function snowboardContactAxes(edgeAmount: number) {
  const edge = Math.max(0, Math.min(edgeAmount, 1));
  return {
    halfLength: 0.82,
    halfWidth: 0.18 + (0.052 - 0.18) * edge,
  };
}

export function snowboardBrakeDrag(skidAmount: number) {
  const skid = Math.max(0, Math.min(skidAmount, 1));
  return skid * skid * 5.2;
}

export function snowHistoryRegionOffset(
  worldX: number,
  worldZ: number,
  resolution = 768,
  worldSpan = 128,
  regionSize = 64,
) {
  const boundedRegion = Math.max(8, Math.min(Math.floor(regionSize), resolution));
  const maxOffset = Math.max(0, resolution - boundedRegion);
  const pixelX = (worldX / worldSpan + 0.5) * resolution - 0.5;
  const pixelZ = (worldZ / worldSpan + 0.5) * resolution - 0.5;
  return {
    x: Math.max(0, Math.min(Math.floor(pixelX - boundedRegion / 2), maxOffset)),
    y: Math.max(0, Math.min(Math.floor(pixelZ - boundedRegion / 2), maxOffset)),
  };
}

export function nextRenderScale(current: number, fps: number, p95Milliseconds: number) {
  const scale = Math.max(0.84, Math.min(current, 1));
  if (fps < 54 && scale > 0.84) {
    return Math.max(0.84, scale - 0.04);
  }
  if (fps > 59 && p95Milliseconds < 18.2 && scale < 1) {
    return Math.min(1, scale + 0.02);
  }
  return scale;
}

export function snowGravityAcceleration(slopeAlongTravel: number) {
  const acceleration = (-9.81 * slopeAlongTravel) / Math.sqrt(1 + slopeAlongTravel * slopeAlongTravel);
  return Math.max(-3.2, Math.min(3.2, acceleration));
}

export function downhillSpeedHeadroom(slopeAlongTravel: number) {
  return Math.max(0, -slopeAlongTravel) * 5.2;
}

export function landingImpactForVelocity(verticalVelocity: number) {
  return Math.min(Math.max(-verticalVelocity / 4.8, 0), 1);
}

export function decayLandingCompression(compression: number, delta: number) {
  return compression * Math.exp(-Math.max(delta, 0) * 9.5);
}
