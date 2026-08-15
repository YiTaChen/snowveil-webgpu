export function slopeAlongHeading(slopeX: number, slopeZ: number, heading: number) {
  const forwardX = Math.sin(heading);
  const forwardZ = -Math.cos(heading);
  return slopeX * forwardX + slopeZ * forwardZ;
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
