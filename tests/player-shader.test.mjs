import assert from "node:assert/strict";
import test from "node:test";

import {
  snowveilDeformationShader,
  snowveilPlayerShader,
  snowveilSkyShader,
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
});

test("terrain and history use the same tapered snowboard contact", () => {
  for (const shader of [snowveilTerrainShader, snowveilDeformationShader]) {
    assert.match(shader, /let contactLong = abs\([^\n]+\) \/ 0\.9/);
    assert.match(shader, /let tipTaper = sqrt\(max\(1\.0 - contactLong \* contactLong, 0\.0\)\)/);
    assert.match(shader, /max\(contactWidth \* tipTaper, 0\.012\)/);
  }
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
