import assert from "node:assert/strict";
import test from "node:test";

import {
  snowveilDeformationShader,
  snowveilPlayerShader,
  snowveilSkyShader,
  snowveilSpindriftShader,
  snowveilTerrainShader,
} from "../app/snowveil-shader.ts";

test("player shader gates casting and retains state-specific athletic loading", () => {
  assert.match(snowveilPlayerShader, /let castPose = smoothstep\([^\n]+globals\.weather\.z\);/);
  assert.match(
    snowveilPlayerShader,
    /let relaxedRightForearm = mix\(-1\.42, -0\.78, athleticPose\) \* \(1\.0 - castPose\);/,
  );
  assert.match(snowveilPlayerShader, /-1\.82 \* athleticPose/);
  assert.match(snowveilPlayerShader, /ridePose \* 0\.13 \+ brakePose \* 0\.29/);
  assert.match(snowveilPlayerShader, /airPose \* \(0\.24 \+ descent \* 0\.1\) \+ landPose \* 0\.3/);
  assert.match(snowveilPlayerShader, /part == 16u \|\| part == 23u \|\| part == 9u/);
  assert.match(snowveilPlayerShader, /part == 22u \|\| part == 24u \|\| part == 25u/);
  assert.match(snowveilPlayerShader, /let charge = 0\.18 \+ globals\.weather\.z \* 0\.82/);
  assert.match(snowveilPlayerShader, /let lookTwist = mix\(0\.92, 0\.08, skid\)/);
  assert.match(snowveilPlayerShader, /let headLook = mix\(0\.27, 0\.035, skid\)/);
  assert.match(snowveilPlayerShader, /fn clothFlowAt\(chain: vec4<f32>, amount: f32\)/);
  assert.match(snowveilPlayerShader, /clothFlowAt\(globals\.clothFlowX, tail\)/);
  assert.match(snowveilPlayerShader, /part == 6u \|\| part == 26u/);
});

test("world spindrift follows rendered terrain and preserves depth parallax", () => {
  assert.match(snowveilSpindriftShader, /@compute @workgroup_size\(64\)/);
  assert.match(snowveilSpindriftShader, /@builtin\(instance_index\) instanceIndex: u32/);
  assert.match(snowveilSpindriftShader, /let ground = terrainHeight\(worldXZ\)/);
  assert.match(snowveilSpindriftShader, /particleCentersWrite\[index\] = vec4<f32>\(center, cycleFade \* edgeFade\)/);
  assert.match(snowveilSpindriftShader, /let centerPacket = particleCenters\[instanceIndex\]/);
  assert.match(snowveilSpindriftShader, /textureSampleLevel\(deformationMap, deformationSampler, uv, 0\.0\)\.r/);
  assert.match(snowveilSpindriftShader, /let anchor = floor\(globals\.reserved\.xy \/ 8\.0\) \* 8\.0/);
  assert.match(snowveilSpindriftShader, /let widthAxis = normalize\(broadside \+ cameraRight \* 0\.075\)/);
  assert.match(snowveilSpindriftShader, /let distanceFade = smoothstep\(0\.8, 2\.0, distance\)/);
});

test("terrain and history use the same tapered snowboard contact", () => {
  for (const shader of [snowveilTerrainShader, snowveilDeformationShader]) {
    assert.match(shader, /let contactLong = abs\([^\n]+\) \/ 0\.9/);
    assert.match(shader, /let tipTaper = sqrt\(max\(1\.0 - contactLong \* contactLong, 0\.0\)\)/);
    assert.match(shader, /max\(contactWidth \* tipTaper, 0\.012\)/);
  }
  assert.match(snowveilDeformationShader, /let speedLoad = smoothstep\(0\.05, 5\.5, speed\)/);
  assert.match(snowveilDeformationShader, /let compressionDepth = mix\(0\.022, 0\.078, speedLoad\)/);
  assert.match(snowveilDeformationShader, /let ridgeHeight = mix\(0\.004, 0\.018, speedLoad\)/);
  assert.doesNotMatch(snowveilDeformationShader, /\) \* speed \* grounded/);
});

test("powder spray is driven by edge load and actual board skid", () => {
  assert.match(snowveilSkyShader, /let skidAngle = atan2\(/);
  assert.match(snowveilSkyShader, /let powderLoad = abs\(powderMemory\) \* grounded/);
  assert.match(snowveilSkyShader, /max\(max\(abs\(globals\.objective\.y\), skid\), powderLoad\)/);
  assert.match(snowveilSkyShader, /let spraySide = select\(storedSide, requestedSide/);
  assert.match(snowveilSkyShader, /powderLoad < 0\.025/);
  assert.match(snowveilSkyShader, /particle < 12/);
  assert.match(snowveilSkyShader, /spray \* 1\.05/);
  assert.match(snowveilSkyShader, /vec3<f32>\(0\.42, 0\.64, 0\.8\)/);
});

test("Ice Pulse is projected between the casting hand and world impact", () => {
  assert.match(snowveilSkyShader, /fn projectSpellPoint\(worldPosition: vec3<f32>\)/);
  assert.match(snowveilSkyShader, /let sourceWorld = playerOrigin \+ rotateSpellLocal\([^\n]+globals\.objective\.x\);/);
  assert.match(snowveilSkyShader, /let impactWorld = playerOrigin \+ rotateSpellLocal\([^\n]+globals\.reserved\.z\);/);
  assert.match(snowveilSkyShader, /for \(var segment = 0; segment < 6; segment = segment \+ 1\)/);
  assert.match(snowveilSkyShader, /let broken = smoothstep\(-0\.32, 0\.46, sin\(angle \* 7\.0/);
  assert.match(snowveilSkyShader, /let radialFracture =/);
  assert.doesNotMatch(snowveilSkyShader, /uv - vec2<f32>\(0\.543, 0\.58\)/);
  assert.match(snowveilPlayerShader, /let spellSpin = time \* 0\.72 \+ spellPhase \* 2\.6/);
});

test("low sun projects rider, board, and beacons onto the snow", () => {
  assert.match(snowveilTerrainShader, /@location\(5\) actorShadow: f32/);
  assert.match(snowveilTerrainShader, /let legSample = shadowSegmentSample\(/);
  assert.match(snowveilTerrainShader, /let torsoSample = shadowSegmentSample\(/);
  assert.match(snowveilTerrainShader, /let headSample = shadowSegmentSample\(/);
  assert.match(snowveilTerrainShader, /let boardYaw = globals\.objective\.x/);
  assert.match(snowveilTerrainShader, /boardCenter - boardForward \* 0\.79/);
  for (const beacon of ["beaconA", "beaconB", "beaconC"]) {
    assert.match(snowveilTerrainShader, new RegExp(`beaconCastShadow\\(point, globals\\.${beacon}, shadowSlope\\)`));
  }
  assert.match(snowveilTerrainShader, /input\.terrainShadow \* \(1\.0 - input\.actorShadow \* 0\.55\)/);
});
