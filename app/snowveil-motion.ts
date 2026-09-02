export function slopeAlongHeading(slopeX: number, slopeZ: number, heading: number) {
  const forwardX = Math.sin(heading);
  const forwardZ = -Math.cos(heading);
  return slopeX * forwardX + slopeZ * forwardZ;
}

export function snowboardTargetYaw(travelHeading: number, brakeAmount: number, steerAmount: number) {
  const brake = Math.max(0, Math.min(brakeAmount, 1));
  const steer = Math.max(-1, Math.min(steerAmount, 1));
  // The board's local +X axis is its nose. A committed edge needs enough lead
  // to shape a real arc across the fall line; braking still pivots the long
  // axis fully across the velocity vector instead of steering it.
  return travelHeading - Math.PI / 2 + brake * Math.PI / 2 + steer * 0.32 * (1 - brake);
}

export function snowboardLongAxis(boardYaw: number) {
  return { x: Math.cos(boardYaw), z: Math.sin(boardYaw) };
}

export function snowboardSkidAmount(boardYaw: number, travelHeading: number) {
  const alignedBoardYaw = travelHeading - Math.PI / 2;
  const skidAngle = Math.atan2(
    Math.sin(boardYaw - alignedBoardYaw),
    Math.cos(boardYaw - alignedBoardYaw),
  );
  return Math.max(0, Math.min(Math.abs(skidAngle) / (Math.PI / 2), 1));
}

export function snowboardTravelTurnRate(speed: number, brakeAmount: number) {
  const normalizedSpeed = Math.max(0, Math.min(speed / 8.6, 1));
  const brake = Math.max(0, Math.min(brakeAmount, 1));
  // A loaded edge pulls velocity into the board nose quickly enough for linked
  // piste turns. An intentional crosswise skid preserves the old direction
  // and sheds speed instead of becoming an overpowered brake-turn.
  return (1 + normalizedSpeed * 4.75) * (1 - brake) * (1 - brake);
}

export function snowboardSteerResponseRate(currentSteer: number, targetSteer: number) {
  const current = Math.max(-1, Math.min(currentSteer, 1));
  const target = Math.max(-1, Math.min(targetSteer, 1));
  const changingEdges =
    Math.abs(current) > 0.08 &&
    Math.abs(target) > 0.08 &&
    Math.sign(current) !== Math.sign(target);

  // Releasing one edge and establishing the other must be more immediate than
  // continuing to load an established carve, or alternating input feels stuck.
  return changingEdges ? 15 : 9.5;
}

export function snowboardLinkedTurnTarget(elapsedSeconds: number, lateralOffset: number) {
  const elapsed = Math.max(elapsedSeconds, 0);
  const centering = Math.max(-0.16, Math.min(-lateralOffset * 0.045, 0.16));
  return Math.sin(elapsed * 1.75) * 0.58 + centering;
}

export function snowboardContactAxes(edgeAmount: number) {
  const edge = Math.max(0, Math.min(edgeAmount, 1));
  return {
    halfLength: 0.9,
    halfWidth: 0.185 + (0.055 - 0.185) * edge,
  };
}

export function snowboardBrakeDrag(skidAmount: number) {
  const skid = Math.max(0, Math.min(skidAmount, 1));
  return skid * skid * 3.6;
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

export type SnowboardAirborneStep = {
  jumpHeight: number;
  jumpVelocity: number;
  landed: boolean;
  impactVelocity: number;
};

/**
 * Integrate vertical motion in world space, then express it as clearance above
 * the new terrain sample. A jump therefore follows a ballistic arc while the
 * snow below drops away or rises into a landing instead of following the ground.
 */
export function advanceSnowboardAirborne(
  previousGroundHeight: number,
  nextGroundHeight: number,
  jumpHeight: number,
  jumpVelocity: number,
  delta: number,
): SnowboardAirborneStep {
  const frameDelta = Math.max(0, Math.min(delta, 0.05));
  const wasAirborne = jumpVelocity > 0 || jumpHeight > 0.001;
  if (!wasAirborne || frameDelta === 0) {
    return {
      jumpHeight: Math.max(0, jumpHeight),
      jumpVelocity,
      landed: false,
      impactVelocity: 0,
    };
  }

  const nextVelocity = jumpVelocity - 10.8 * frameDelta;
  const previousWorldHeight = previousGroundHeight + Math.max(0, jumpHeight);
  const nextWorldHeight = previousWorldHeight + nextVelocity * frameDelta;
  const nextClearance = nextWorldHeight - nextGroundHeight;
  if (nextClearance <= 0) {
    return {
      jumpHeight: 0,
      jumpVelocity: 0,
      landed: true,
      impactVelocity: nextVelocity,
    };
  }

  return {
    jumpHeight: nextClearance,
    jumpVelocity: nextVelocity,
    landed: false,
    impactVelocity: 0,
  };
}

export function landingImpactForVelocity(verticalVelocity: number) {
  return Math.min(Math.max(-verticalVelocity / 4.8, 0), 1);
}

export function decayLandingCompression(compression: number, delta: number) {
  return compression * Math.exp(-Math.max(delta, 0) * 9.5);
}

export type RiderAnimationState = "idle" | "ride" | "brake" | "air" | "land";

export function riderAnimationState(
  speed: number,
  skidAmount: number,
  jumpHeight: number,
  landingCompression: number,
): RiderAnimationState {
  if (jumpHeight > 0.015) return "air";
  if (landingCompression > 0.06) return "land";
  if (speed > 0.2 && skidAmount > 0.55) return "brake";
  if (speed > 0.25) return "ride";
  return "idle";
}

export function riderTransitionRate(state: RiderAnimationState) {
  if (state === "air") return 14;
  if (state === "land") return 12;
  if (state === "brake") return 9;
  if (state === "ride") return 5.5;
  return 4.5;
}

export function riderPoseBlend(current: number, target: number, delta: number, rate: number) {
  const boundedCurrent = Math.max(0, Math.min(current, 1));
  const boundedTarget = Math.max(0, Math.min(target, 1));
  const blend = 1 - Math.exp(-Math.max(delta, 0) * Math.max(rate, 0));
  return boundedCurrent + (boundedTarget - boundedCurrent) * blend;
}

/**
 * Advance one scalar four-link cloth chain without allocating in the frame loop.
 * Each link follows the previous link plus a share of the external airflow, so
 * the cape root stays restrained while its free edge carries visible inertia.
 */
export function stepClothChain(
  positions: Float32Array,
  velocities: Float32Array,
  airflowTarget: number,
  delta: number,
) {
  const frameDelta = Math.max(0, Math.min(delta, 0.05));
  const boundedAirflow = Math.max(-0.28, Math.min(airflowTarget, 0.28));
  const linkCount = Math.min(positions.length, velocities.length, 4);
  for (let index = 0; index < linkCount; index += 1) {
    const progress = (index + 1) / linkCount;
    const leader = index === 0 ? 0 : positions[index - 1];
    const target = leader + boundedAirflow * (0.12 + progress * 0.1);
    const smoothTime = 0.075 + index * 0.032;
    const omega = 2 / smoothTime;
    const x = omega * frameDelta;
    const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const displacement = positions[index] - target;
    const temporary = (velocities[index] + omega * displacement) * frameDelta;
    velocities[index] = (velocities[index] - omega * temporary) * decay;
    positions[index] = target + (displacement + temporary) * decay;
  }
}
