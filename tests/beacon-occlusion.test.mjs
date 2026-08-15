import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { snowveilBeaconShader } from "../app/snowveil-shader.ts";

test("beacons fade only as transparent camera obstructions", async () => {
  assert.match(snowveilBeaconShader, /@location\(7\) @interpolate\(flat\) cameraOcclusion: f32/);
  assert.match(snowveilBeaconShader, /betweenCameraAndRider \* sightlineCorridor/);
  assert.match(snowveilBeaconShader, /min\(proximityFade, sightlineFade\)/);

  const sceneSource = await readFile(new URL("../app/snowveil-scene.tsx", import.meta.url), "utf8");
  const beaconPipelineStart = sceneSource.indexOf("const beaconPipeline =");
  const beaconPipelineEnd = sceneSource.indexOf("const deformationPipeline =", beaconPipelineStart);
  const beaconPipeline = sceneSource.slice(beaconPipelineStart, beaconPipelineEnd);
  assert.match(beaconPipeline, /srcFactor: "src-alpha"/);
  assert.match(beaconPipeline, /dstFactor: "one-minus-src-alpha"/);
  assert.match(beaconPipeline, /depthWriteEnabled: false/);

  const playerDraw = sceneSource.lastIndexOf("pass.setPipeline(playerPipeline)");
  const beaconDraw = sceneSource.lastIndexOf("pass.setPipeline(beaconPipeline)");
  assert.ok(playerDraw >= 0 && beaconDraw > playerDraw, "transparent beacons must render after the rider");
});
