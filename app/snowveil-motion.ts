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
