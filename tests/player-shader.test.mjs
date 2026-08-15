import assert from "node:assert/strict";
import test from "node:test";

import { snowveilPlayerShader } from "../app/snowveil-shader.ts";

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
});
