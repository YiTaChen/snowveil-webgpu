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
