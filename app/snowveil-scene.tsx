"use client";

import { useEffect, useRef, useState } from "react";
import {
  snowveilBeaconShader,
  snowveilDeformationShader,
  snowveilPlayerShader,
  snowveilPostShader,
  snowveilSkyShader,
  snowveilSpindriftShader,
  snowveilTerrainShader,
} from "./snowveil-shader";
import { snowHeightAt, snowSurfaceAt } from "./snowveil-terrain";
import { createRiderGeometry } from "./snowveil-rider-geometry";
import { createBeaconGeometry } from "./snowveil-beacon-geometry";
import { createSnowveilAudio, type SnowveilAudio } from "./snowveil-audio";
import {
  decayLandingCompression,
  downhillSpeedHeadroom,
  landingImpactForVelocity,
  nextRenderScale,
  riderAnimationState,
  riderPoseBlend,
  riderTransitionRate,
  stepClothChain,
  snowHistoryRegionOffset,
  slopeAlongHeading,
  snowboardBrakeDrag,
  snowboardSkidAmount,
  snowboardTargetYaw,
  snowboardTravelTurnRate,
  snowGravityAcceleration,
} from "./snowveil-motion";

type SceneState = "loading" | "ready" | "unsupported" | "error";

export function SnowveilScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const objectiveRef = useRef<HTMLSpanElement>(null);
  const promptRef = useRef<HTMLSpanElement>(null);
  const audioControllerRef = useRef<SnowveilAudio | null>(null);
  const [sceneState, setSceneState] = useState<SceneState>("loading");
  const [message, setMessage] = useState("Preparing atmosphere");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [riteComplete, setRiteComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    const query = new URLSearchParams(window.location.search);
    const evidenceMode = query.has("evidence");
    const captureMode = query.has("capture");
    const demoMode = query.has("demo");
    const requestedRenderScale = Number(query.get("renderScale"));
    const fixedRenderScale =
      Number.isFinite(requestedRenderScale) && requestedRenderScale > 0
        ? Math.max(0.84, Math.min(requestedRenderScale, 1))
        : undefined;
    const slopeProbe = query.get("slope");
    const hasSlopeProbe = slopeProbe === "downhill" || slopeProbe === "uphill";
    if (evidenceMode) {
      document.documentElement.dataset.snowveilEvidence = "true";
    }
    if (captureMode) {
      document.documentElement.dataset.snowveilCapture = "true";
    }
    const webgpu = navigator.gpu;
    if (!webgpu) {
      queueMicrotask(() => {
        if (!disposed) setSceneState("unsupported");
      });
      return () => {
        disposed = true;
      };
    }

    const audio = createSnowveilAudio();
    audioControllerRef.current = audio;

    let animationFrame = 0;
    let device: GPUDevice | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let lastFrame = performance.now();
    let fpsStarted = lastFrame;
    let fpsFrames = 0;
    const frameTimes: number[] = [];
    // A three-quarter chase view keeps the nose-first board axis and the
    // rider's counter-rotated upper body legible at the same time.
    let yaw = -0.72;
    let pitch = 0.065;
    let distance = 5.9;
    let renderScale = fixedRenderScale ?? 1.0;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let playerX = 0;
    let playerZ = hasSlopeProbe ? 0 : -4;
    let previousStampX = playerX;
    let previousStampZ = playerZ;
    let playerHeading = 0;
    let playerBoardYaw = snowboardTargetYaw(playerHeading, 0, 0);
    let playerSpeed = 0;
    let playerSurface = snowSurfaceAt(playerX, playerZ);
    let playerSlopeX = playerSurface.slopeX;
    let playerSlopeZ = playerSurface.slopeZ;
    let visualSlopeX = playerSlopeX;
    let visualSlopeZ = playerSlopeZ;
    let takeoffSlopeX = playerSlopeX;
    let takeoffSlopeZ = playerSlopeZ;
    if (slopeProbe === "downhill") {
      playerHeading = Math.atan2(-playerSlopeX, playerSlopeZ);
      playerBoardYaw = snowboardTargetYaw(playerHeading, 0, 0);
    } else if (slopeProbe === "uphill") {
      playerHeading = Math.atan2(playerSlopeX, -playerSlopeZ);
      playerBoardYaw = snowboardTargetYaw(playerHeading, 0, 0);
    }
    let boardSkid = 0;
    let steerVisual = 0;
    let jumpHeight = 0;
    let jumpVelocity = 0;
    let landingCompression = 0;
    let powderEnergy = 0;
    let powderSide = 1;
    let ridePose = 0;
    let brakePose = 0;
    let airPose = 0;
    let landPose = 0;
    const clothFlowX = new Float32Array(4);
    const clothFlowXVelocity = new Float32Array(4);
    const clothFlowZ = new Float32Array(4);
    const clothFlowZVelocity = new Float32Array(4);
    let spellAge = 100;
    let completionAge = 100;
    let activatedCount = 0;
    const beaconPositions = [
      { x: -6.5, z: -14.5 },
      { x: 12.5, z: -25.5 },
      { x: -15.5, z: -36.5 },
    ];
    const beaconActive = [false, false, false];
    const pressedKeys = new Set<string>();
    const keyPulseUntil = new Map<string, number>();
    const activeControlPointers = new Map<number, string>();

    const angleDelta = (target: number, current: number) =>
      Math.atan2(Math.sin(target - current), Math.cos(target - current));

    const onPointerDown = (event: PointerEvent) => {
      void audio.unlock().then((enabled) => {
        setAudioReady(true);
        setAudioEnabled(enabled);
      });
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      yaw -= dx * 0.0032;
      pitch = Math.max(-0.16, Math.min(0.24, pitch - dy * 0.0022));
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      distance = Math.max(2.8, Math.min(11.5, distance + event.deltaY * 0.006));
    };

    const castIcePulse = () => {
      spellAge = 0;
      audio.cast();
      const spellForwardX = Math.sin(playerHeading);
      const spellForwardZ = -Math.cos(playerHeading);
      const spellRightX = Math.cos(playerHeading);
      const spellRightZ = Math.sin(playerHeading);
      const impactX = playerX + spellForwardX * 3.2 + spellRightX * 0.9;
      const impactZ = playerZ + spellForwardZ * 3.2 + spellRightZ * 0.9;
      let closestBeacon = -1;
      let closestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < beaconPositions.length; index += 1) {
        if (beaconActive[index]) continue;
        const beacon = beaconPositions[index];
        const impactDistance = Math.hypot(impactX - beacon.x, impactZ - beacon.z);
        if (impactDistance < closestDistance) {
          closestDistance = impactDistance;
          closestBeacon = index;
        }
      }
      if (closestBeacon >= 0 && closestDistance < 2.6) {
        beaconActive[closestBeacon] = true;
        activatedCount += 1;
        const finalBeacon = activatedCount === beaconPositions.length;
        audio.activateBeacon(closestBeacon, finalBeacon);
        if (finalBeacon) {
          completionAge = 0;
          setRiteComplete(true);
        }
      }
    };

    const unlockAudio = () => {
      void audio.unlock().then((enabled) => {
        setAudioReady(true);
        setAudioEnabled(enabled);
      });
    };

    const pressInput = (code: string, repeat = false) => {
      pressedKeys.add(code);
      keyPulseUntil.set(code, performance.now() + 145);
      if (code === "Space" && !repeat && jumpHeight <= 0.001) {
        takeoffSlopeX = playerSlopeX;
        takeoffSlopeZ = playerSlopeZ;
        jumpVelocity = 3.85;
        audio.jump();
      }
      if (code === "KeyE" && !repeat) {
        castIcePulse();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      unlockAudio();
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      pressInput(event.code, event.repeat);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code);
    };

    const touchControls = Array.from(
      document.querySelectorAll<HTMLButtonElement>("[data-snowveil-key]"),
    );
    const onControlPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      const button = event.currentTarget as HTMLButtonElement;
      const code = button.dataset.snowveilKey;
      if (!code) return;
      unlockAudio();
      activeControlPointers.set(event.pointerId, code);
      button.dataset.active = "true";
      button.setPointerCapture(event.pointerId);
      pressInput(code);
    };
    const onControlPointerEnd = (event: PointerEvent) => {
      const button = event.currentTarget as HTMLButtonElement;
      const code = activeControlPointers.get(event.pointerId);
      if (!code) return;
      activeControlPointers.delete(event.pointerId);
      pressedKeys.delete(code);
      button.dataset.active = "false";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    for (const control of touchControls) {
      control.addEventListener("pointerdown", onControlPointerDown);
      control.addEventListener("pointerup", onControlPointerEnd);
      control.addEventListener("pointercancel", onControlPointerEnd);
      control.addEventListener("lostpointercapture", onControlPointerEnd);
    }

    async function start() {
      try {
        setMessage("Warming the snow field");
        const adapter = await webgpu.requestAdapter({ powerPreference: "high-performance" });
        if (!adapter) throw new Error("No compatible GPU adapter was found.");

        const activeDevice = await adapter.requestDevice();
        device = activeDevice;
        activeDevice.addEventListener("uncapturederror", (event: GPUUncapturedErrorEvent) => {
          console.error("Snowveil WebGPU validation error", event.error?.message ?? event.error);
        });
        void activeDevice.lost.then((info) => {
          if (!disposed) {
            console.error("Snowveil WebGPU device lost", info.reason, info.message);
          }
        });
        const context = canvas.getContext("webgpu");
        if (!context) throw new Error("WebGPU canvas context is unavailable.");

        const format = webgpu.getPreferredCanvasFormat();
        const sceneFormat: GPUTextureFormat = "rgba16float";
        context.configure({ device: activeDevice, format, alphaMode: "opaque" });

        const skyShaderModule = activeDevice.createShaderModule({
          label: "Snowveil original procedural sky shader",
          code: snowveilSkyShader,
        });
        const terrainShaderModule = activeDevice.createShaderModule({
          label: "Snowveil original procedural terrain shader",
          code: snowveilTerrainShader,
        });
        const spindriftShaderModule = activeDevice.createShaderModule({
          label: "Snowveil world-space spindrift shader",
          code: snowveilSpindriftShader,
        });
        const postShaderModule = activeDevice.createShaderModule({
          label: "Snowveil HDR post shader",
          code: snowveilPostShader,
        });
        const playerShaderModule = activeDevice.createShaderModule({
          label: "Snowveil original procedural rider shader",
          code: snowveilPlayerShader,
        });
        const beaconShaderModule = activeDevice.createShaderModule({
          label: "Snowveil original frost-sigil beacon shader",
          code: snowveilBeaconShader,
        });
        const deformationShaderModule = activeDevice.createShaderModule({
          label: "Snowveil persistent snow deformation shader",
          code: snowveilDeformationShader,
        });

        const [
          skyCompilation,
          terrainCompilation,
          spindriftCompilation,
          postCompilation,
          playerCompilation,
          beaconCompilation,
          deformationCompilation,
        ] = await Promise.all([
            skyShaderModule.getCompilationInfo(),
            terrainShaderModule.getCompilationInfo(),
            spindriftShaderModule.getCompilationInfo(),
            postShaderModule.getCompilationInfo(),
            playerShaderModule.getCompilationInfo(),
            beaconShaderModule.getCompilationInfo(),
            deformationShaderModule.getCompilationInfo(),
          ]);
        const shaderErrors = [
          ...skyCompilation.messages,
          ...terrainCompilation.messages,
          ...spindriftCompilation.messages,
          ...postCompilation.messages,
          ...playerCompilation.messages,
          ...beaconCompilation.messages,
          ...deformationCompilation.messages,
        ].filter((entry: { type: string }) => entry.type === "error");
        if (shaderErrors.length) {
          throw new Error(shaderErrors.map((entry: { message: string }) => entry.message).join("\n"));
        }

        const skyPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil atmosphere pipeline",
          layout: "auto",
          vertex: { module: skyShaderModule, entryPoint: "vsMain" },
          fragment: { module: skyShaderModule, entryPoint: "fsMain", targets: [{ format: sceneFormat }] },
          primitive: { topology: "triangle-list" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: false,
            depthCompare: "always",
          },
        });

        const snowOverlayPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil foreground snow pipeline",
          layout: "auto",
          vertex: { module: skyShaderModule, entryPoint: "vsMain" },
          fragment: {
            module: skyShaderModule,
            entryPoint: "fsSnowOverlay",
            targets: [
              {
                format: sceneFormat,
                blend: {
                  color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
                  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
                },
              },
            ],
          },
          primitive: { topology: "triangle-list" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: false,
            depthCompare: "always",
          },
        });

        const spindriftPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil world-space spindrift pipeline",
          layout: "auto",
          vertex: { module: spindriftShaderModule, entryPoint: "vsSpindrift" },
          fragment: {
            module: spindriftShaderModule,
            entryPoint: "fsSpindrift",
            targets: [
              {
                format: sceneFormat,
                blend: {
                  color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
                  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
                },
              },
            ],
          },
          primitive: { topology: "triangle-strip", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: false,
            depthCompare: "less",
          },
        });

        const spindriftComputePipeline = activeDevice.createComputePipeline({
          label: "Snowveil world-space spindrift placement pipeline",
          layout: "auto",
          compute: { module: spindriftShaderModule, entryPoint: "updateSpindrift" },
        });

        const terrainPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil raster terrain pipeline",
          layout: "auto",
          vertex: {
            module: terrainShaderModule,
            entryPoint: "vsTerrain",
            buffers: [
              {
                arrayStride: 8,
                attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
              },
            ],
          },
          fragment: {
            module: terrainShaderModule,
            entryPoint: "fsTerrain",
            targets: [{ format: sceneFormat }],
          },
          primitive: { topology: "triangle-list", cullMode: "back" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less",
          },
        });

        const postPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil HDR resolve pipeline",
          layout: "auto",
          vertex: { module: postShaderModule, entryPoint: "vsPost" },
          fragment: { module: postShaderModule, entryPoint: "fsPost", targets: [{ format }] },
          primitive: { topology: "triangle-list" },
        });

        const playerPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil procedural rider pipeline",
          layout: "auto",
          vertex: {
            module: playerShaderModule,
            entryPoint: "vsPlayer",
            buffers: [
              {
                arrayStride: 28,
                attributes: [
                  { shaderLocation: 0, offset: 0, format: "float32x3" },
                  { shaderLocation: 1, offset: 12, format: "float32x3" },
                  { shaderLocation: 2, offset: 24, format: "float32" },
                ],
              },
            ],
          },
          fragment: { module: playerShaderModule, entryPoint: "fsPlayer", targets: [{ format: sceneFormat }] },
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less",
          },
        });

        const beaconPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil frost-sigil beacon pipeline",
          layout: "auto",
          vertex: {
            module: beaconShaderModule,
            entryPoint: "vsBeacon",
            buffers: [
              {
                arrayStride: 28,
                attributes: [
                  { shaderLocation: 0, offset: 0, format: "float32x3" },
                  { shaderLocation: 1, offset: 12, format: "float32x3" },
                  { shaderLocation: 2, offset: 24, format: "float32" },
                ],
              },
            ],
          },
          fragment: {
            module: beaconShaderModule,
            entryPoint: "fsBeacon",
            targets: [
              {
                format: sceneFormat,
                blend: {
                  color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
                  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
                },
              },
            ],
          },
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: false,
            depthCompare: "less",
          },
        });

        const deformationPipeline = activeDevice.createComputePipeline({
          label: "Snowveil persistent snow compute pipeline",
          layout: "auto",
          compute: { module: deformationShaderModule, entryPoint: "updateSnow" },
        });

        const uniformBuffer = activeDevice.createBuffer({
          label: "Snowveil frame uniforms",
          size: 208,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const spindriftParticleCount = 768;
        const spindriftParticleBuffer = activeDevice.createBuffer({
          label: "Snowveil computed world-space spindrift centers",
          size: spindriftParticleCount * 16,
          usage: GPUBufferUsage.STORAGE,
        });
        const skyBindGroup = activeDevice.createBindGroup({
          layout: skyPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });
        const snowOverlayBindGroup = activeDevice.createBindGroup({
          layout: snowOverlayPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });
        const playerBindGroup = activeDevice.createBindGroup({
          layout: playerPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });
        const beaconBindGroup = activeDevice.createBindGroup({
          layout: beaconPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });
        const postSampler = activeDevice.createSampler({
          label: "Snowveil HDR linear sampler",
          magFilter: "linear",
          minFilter: "linear",
        });
        const deformationSampler = activeDevice.createSampler({
          label: "Snowveil deformation sampler",
          magFilter: "linear",
          minFilter: "linear",
          addressModeU: "clamp-to-edge",
          addressModeV: "clamp-to-edge",
        });
        activeDevice.pushErrorScope("validation");
        // 1536 samples across the 128 m field retain the tapered board print;
        // the former 768 map collapsed its narrow edge contact to one texel.
        const deformationResolution = 1536;
        const deformationTextures = [0, 1].map((index) =>
          activeDevice.createTexture({
            label: `Snowveil deformation history ${index}`,
            size: [deformationResolution, deformationResolution],
            format: "rgba16float",
            usage:
              GPUTextureUsage.TEXTURE_BINDING |
              GPUTextureUsage.STORAGE_BINDING |
              GPUTextureUsage.COPY_SRC |
              GPUTextureUsage.COPY_DST,
          }),
        );
        const deformationViews = deformationTextures.map((texture) => texture.createView());
        const terrainBindGroups = deformationViews.map((view) =>
          activeDevice.createBindGroup({
            layout: terrainPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: view },
              { binding: 2, resource: deformationSampler },
            ],
          }),
        );
        const spindriftBindGroup = activeDevice.createBindGroup({
          layout: spindriftPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 3, resource: { buffer: spindriftParticleBuffer } },
          ],
        });
        const spindriftComputeBindGroups = deformationViews.map((view) =>
          activeDevice.createBindGroup({
            layout: spindriftComputePipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: view },
              { binding: 2, resource: deformationSampler },
              { binding: 4, resource: { buffer: spindriftParticleBuffer } },
            ],
          }),
        );
        const deformationBindGroups = deformationViews.map((view, readIndex) =>
          activeDevice.createBindGroup({
            layout: deformationPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: view },
              { binding: 2, resource: deformationViews[1 - readIndex] },
            ],
          }),
        );
        const deformationSetupError = await activeDevice.popErrorScope();
        if (deformationSetupError) {
          throw new Error(`Snow deformation setup failed: ${deformationSetupError.message}`);
        }
        let deformationReadIndex = 0;
        const deformationInterval = 1;
        const deformationRegionSize = 128;
        let deformationAccumulator = deformationInterval;
        let snowHistoryTouched = false;
        const uniforms = new Float32Array(52);

        const terrainSegments = 288;
        const terrainVertexCount = (terrainSegments + 1) * (terrainSegments + 1);
        const terrainVertices = new Float32Array(terrainVertexCount * 2);
        let vertexOffset = 0;
        for (let z = 0; z <= terrainSegments; z += 1) {
          for (let x = 0; x <= terrainSegments; x += 1) {
            terrainVertices[vertexOffset] = (x / terrainSegments) * 2 - 1;
            terrainVertices[vertexOffset + 1] = (z / terrainSegments) * 2 - 1;
            vertexOffset += 2;
          }
        }

        const terrainIndices = new Uint32Array(terrainSegments * terrainSegments * 6);
        let indexOffset = 0;
        const rowWidth = terrainSegments + 1;
        for (let z = 0; z < terrainSegments; z += 1) {
          for (let x = 0; x < terrainSegments; x += 1) {
            const topLeft = z * rowWidth + x;
            const topRight = topLeft + 1;
            const bottomLeft = topLeft + rowWidth;
            const bottomRight = bottomLeft + 1;
            terrainIndices[indexOffset] = topLeft;
            terrainIndices[indexOffset + 1] = bottomLeft;
            terrainIndices[indexOffset + 2] = topRight;
            terrainIndices[indexOffset + 3] = topRight;
            terrainIndices[indexOffset + 4] = bottomLeft;
            terrainIndices[indexOffset + 5] = bottomRight;
            indexOffset += 6;
          }
        }

        const terrainVertexBuffer = activeDevice.createBuffer({
          label: "Snowveil terrain grid vertices",
          size: terrainVertices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        const terrainIndexBuffer = activeDevice.createBuffer({
          label: "Snowveil terrain grid indices",
          size: terrainIndices.byteLength,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        activeDevice.queue.writeBuffer(terrainVertexBuffer, 0, terrainVertices);
        activeDevice.queue.writeBuffer(terrainIndexBuffer, 0, terrainIndices);

        const riderGeometry = createRiderGeometry();
        const riderVertexBuffer = activeDevice.createBuffer({
          label: "Snowveil bespoke rider vertices",
          size: riderGeometry.vertices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        const riderIndexBuffer = activeDevice.createBuffer({
          label: "Snowveil bespoke rider indices",
          size: riderGeometry.indices.byteLength,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        activeDevice.queue.writeBuffer(riderVertexBuffer, 0, riderGeometry.vertices);
        activeDevice.queue.writeBuffer(riderIndexBuffer, 0, riderGeometry.indices);

        const beaconGeometry = createBeaconGeometry();
        const beaconVertexBuffer = activeDevice.createBuffer({
          label: "Snowveil frost-sigil beacon vertices",
          size: beaconGeometry.vertices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        const beaconIndexBuffer = activeDevice.createBuffer({
          label: "Snowveil frost-sigil beacon indices",
          size: beaconGeometry.indices.byteLength,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        activeDevice.queue.writeBuffer(beaconVertexBuffer, 0, beaconGeometry.vertices);
        activeDevice.queue.writeBuffer(beaconIndexBuffer, 0, beaconGeometry.indices);

        let depthTexture: GPUTexture | undefined;
        let sceneColorTexture: GPUTexture | undefined;
        let postBindGroup: GPUBindGroup | undefined;
        let depthWidth = 0;
        let depthHeight = 0;

        const resize = () => {
          const ratio = captureMode ? 2 : Math.min(window.devicePixelRatio || 1, renderScale);
          const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
          const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          if (depthWidth !== width || depthHeight !== height) {
            depthTexture?.destroy?.();
            sceneColorTexture?.destroy?.();
            depthTexture = activeDevice.createTexture({
              label: "Snowveil depth buffer",
              size: [width, height],
              format: "depth24plus",
              usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            sceneColorTexture = activeDevice.createTexture({
              label: "Snowveil HDR scene color",
              size: [width, height],
              format: sceneFormat,
              usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            });
            postBindGroup = activeDevice.createBindGroup({
              layout: postPipeline.getBindGroupLayout(0),
              entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
                { binding: 1, resource: sceneColorTexture.createView() },
                { binding: 2, resource: postSampler },
              ],
            });
            depthWidth = width;
            depthHeight = height;
          }
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();

        const started = performance.now();
        const render = (now: number) => {
          if (disposed) return;
          resize();

          const elapsed = (now - started) / 1000;
          const frameTime = Math.min(now - lastFrame, 100);
          const delta = Math.min(frameTime / 1000, 0.05);
          landingCompression = decayLandingCompression(landingCompression, delta);
          lastFrame = now;
          fpsFrames += 1;
          frameTimes.push(frameTime);
          if (frameTimes.length > 240) frameTimes.shift();

          if (now - fpsStarted > 800) {
            const fps = Math.round((fpsFrames * 1000) / (now - fpsStarted));
            const sortedFrameTimes = [...frameTimes].sort((a, b) => a - b);
            const p95 = sortedFrameTimes[Math.min(sortedFrameTimes.length - 1, Math.floor(sortedFrameTimes.length * 0.95))];
            const p99 = sortedFrameTimes[Math.min(sortedFrameTimes.length - 1, Math.floor(sortedFrameTimes.length * 0.99))];
            const lowOnePercent = Math.round(1000 / Math.max(p99, 0.01));
            if (fpsRef.current) {
              fpsRef.current.textContent = `${fps} FPS · P95 ${p95.toFixed(1)} ms · 1% ${lowOnePercent} · ${Math.round(renderScale * 100)}% RES`;
            }
            if (!evidenceMode && !captureMode && fixedRenderScale === undefined) {
              renderScale = nextRenderScale(renderScale, fps, p95);
            }
            fpsStarted = now;
            fpsFrames = 0;
          }

          const manualSteer =
            (pressedKeys.has("KeyD") ||
            pressedKeys.has("ArrowRight") ||
            (keyPulseUntil.get("KeyD") ?? 0) > now ||
            (keyPulseUntil.get("ArrowRight") ?? 0) > now
              ? 1
              : 0) -
            (pressedKeys.has("KeyA") ||
            pressedKeys.has("ArrowLeft") ||
            (keyPulseUntil.get("KeyA") ?? 0) > now ||
            (keyPulseUntil.get("ArrowLeft") ?? 0) > now
              ? 1
              : 0);
          const manualThrottle =
            (pressedKeys.has("KeyW") ||
            pressedKeys.has("ArrowUp") ||
            (keyPulseUntil.get("KeyW") ?? 0) > now ||
            (keyPulseUntil.get("ArrowUp") ?? 0) > now
              ? 1
              : 0);
          const manualBrake =
            pressedKeys.has("KeyS") ||
            pressedKeys.has("ArrowDown") ||
            (keyPulseUntil.get("KeyS") ?? 0) > now ||
            (keyPulseUntil.get("ArrowDown") ?? 0) > now
              ? 1
              : 0;
          const demoTargetIndex = demoMode ? beaconActive.findIndex((isActive) => !isActive) : -1;
          const demoTarget = demoTargetIndex >= 0 ? beaconPositions[demoTargetIndex] : null;
          const demoHeading = demoTarget
            ? Math.atan2(demoTarget.x - playerX, -(demoTarget.z - playerZ))
            : playerHeading;
          const steerInput = demoTarget
            ? Math.max(-1, Math.min(1, angleDelta(demoHeading, playerHeading) * 1.8))
            : manualSteer;
          const throttleInput = demoTarget ? 1 : demoMode ? 0 : manualThrottle;
          const brakeInput = demoMode ? (demoTarget ? 0 : 1) : manualBrake;
          const speedLimit = demoMode
            ? 6.4
            : pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight")
              ? 8.4
              : 5.4;
          boardSkid += (brakeInput - boardSkid) * (1 - Math.exp(-delta * (brakeInput > 0 ? 11 : 6.5)));
          steerVisual += (steerInput - steerVisual) * (1 - Math.exp(-delta * 8.5));
          const groundedBeforeMotion = jumpHeight <= 0.018;
          const targetBoardYaw = snowboardTargetYaw(playerHeading, boardSkid, steerVisual);
          playerBoardYaw += angleDelta(targetBoardYaw, playerBoardYaw) * (1 - Math.exp(-delta * 11));
          const actualBoardSkid = snowboardSkidAmount(playerBoardYaw, playerHeading);
          const edgePressure = Math.max(actualBoardSkid, Math.abs(steerVisual) * 0.55);
          if (Math.abs(steerVisual) > 0.06) {
            powderSide = Math.sign(steerVisual);
          } else if (actualBoardSkid > 0.06) {
            powderSide = Math.sign(
              angleDelta(playerBoardYaw, playerHeading - Math.PI / 2),
            );
          }
          const powderTarget = groundedBeforeMotion
            ? Math.min(
                1,
                Math.min(playerSpeed / 8.4, 1) *
                  (0.16 + Math.pow(edgePressure, 1.35) * 1.25),
              )
            : 0;
          const powderRate = powderTarget > powderEnergy ? 36 : 4.2;
          powderEnergy +=
            (powderTarget - powderEnergy) * (1 - Math.exp(-delta * powderRate));
          if (groundedBeforeMotion) {
            const boardNoseHeading = playerBoardYaw + Math.PI / 2;
            const travelTurnRate = snowboardTravelTurnRate(playerSpeed, boardSkid);
            playerHeading +=
              angleDelta(boardNoseHeading, playerHeading) *
              (1 - Math.exp(-delta * travelTurnRate));
          }
          const forwardX = Math.sin(playerHeading);
          const forwardZ = -Math.cos(playerHeading);
          const slopeAlongTravel = slopeAlongHeading(playerSlopeX, playerSlopeZ, playerHeading);
          const slopeGravity = groundedBeforeMotion ? snowGravityAcceleration(slopeAlongTravel) : 0;
          const driveAcceleration = throttleInput * (demoMode ? 7.2 : 5.8) * (groundedBeforeMotion ? 1 : 0.12);
          playerSpeed += (driveAcceleration + slopeGravity) * delta;
          const drag = groundedBeforeMotion
            ? 0.24 + (throttleInput > 0 ? 0 : 0.52) + snowboardBrakeDrag(actualBoardSkid)
            : 0.08;
          const downhillHeadroom = groundedBeforeMotion ? downhillSpeedHeadroom(slopeAlongTravel) : 0;
          const speedCeiling = groundedBeforeMotion
            ? speedLimit + downhillHeadroom
            : Math.max(speedLimit, playerSpeed);
          playerSpeed = Math.min(speedCeiling, Math.max(0, playerSpeed * Math.exp(-drag * delta)));

          // Resolve the moving rider against a world-space katabatic wind, then
          // let two four-link damped chains carry that force down the cloth.
          // The small gust term changes force rather than vertex phase, so a
          // turn or stop has real lag instead of restarting a sine animation.
          const windGust = 1 + Math.sin(elapsed * 0.63 + Math.sin(elapsed * 0.17) * 1.4) * 0.16;
          const relativeWindX = 0.82 * 1.25 * windGust - forwardX * playerSpeed;
          const relativeWindZ = 0.57 * 1.25 * windGust - forwardZ * playerSpeed;
          const boardCosine = Math.cos(playerBoardYaw);
          const boardSine = Math.sin(playerBoardYaw);
          const localWindX = relativeWindX * boardCosine + relativeWindZ * boardSine;
          const localWindZ = -relativeWindX * boardSine + relativeWindZ * boardCosine;
          const carveInertia = -steerVisual * Math.min(playerSpeed / 5.4, 1) * 0.075;
          stepClothChain(
            clothFlowX,
            clothFlowXVelocity,
            localWindX * 0.044 + carveInertia,
            delta,
          );
          stepClothChain(
            clothFlowZ,
            clothFlowZVelocity,
            localWindZ * 0.034 + Math.sign(steerVisual) * Math.abs(carveInertia) * 0.45,
            delta,
          );

          playerX += forwardX * playerSpeed * delta;
          playerZ += forwardZ * playerSpeed * delta;
          const playerRadius = Math.hypot(playerX, playerZ);
          if (playerRadius > 54) {
            const boundaryScale = 54 / playerRadius;
            playerX *= boundaryScale;
            playerZ *= boundaryScale;
            playerSpeed *= 0.35;
          }

          const wasAirborne = jumpHeight > 0.001;
          if (jumpVelocity > 0 || wasAirborne) {
            jumpVelocity -= 10.8 * delta;
            jumpHeight += jumpVelocity * delta;
            if (jumpHeight <= 0) {
              landingCompression = Math.max(landingCompression, landingImpactForVelocity(jumpVelocity));
              jumpHeight = 0;
              jumpVelocity = 0;
              if (wasAirborne) audio.land();
            }
          }

          const animationState = riderAnimationState(
            playerSpeed,
            actualBoardSkid,
            jumpHeight,
            landingCompression,
          );
          const poseRate = riderTransitionRate(animationState);
          ridePose = riderPoseBlend(ridePose, animationState === "ride" ? 1 : 0, delta, poseRate);
          brakePose = riderPoseBlend(brakePose, animationState === "brake" ? 1 : 0, delta, poseRate);
          airPose = riderPoseBlend(airPose, animationState === "air" ? 1 : 0, delta, poseRate);
          landPose = riderPoseBlend(landPose, animationState === "land" ? 1 : 0, delta, poseRate);

          audio.setMotion(
            playerSpeed,
            jumpHeight <= 0.018,
            actualBoardSkid,
            Math.abs(steerVisual),
            powderEnergy,
          );
          if (speedRef.current) {
            speedRef.current.textContent =
              jumpHeight > 0.03
                ? `${playerSpeed.toFixed(1)} m/s · AIR ${jumpHeight.toFixed(1)} m`
                : `${playerSpeed.toFixed(1)} m/s`;
          }
          playerSurface = snowSurfaceAt(playerX, playerZ);
          const slopeBlend = 1 - Math.exp(-delta * 7.5);
          playerSlopeX += (playerSurface.slopeX - playerSlopeX) * slopeBlend;
          playerSlopeZ += (playerSurface.slopeZ - playerSlopeZ) * slopeBlend;
          if (jumpHeight > 0.018) {
            visualSlopeX = takeoffSlopeX;
            visualSlopeZ = takeoffSlopeZ;
          } else {
            visualSlopeX += (playerSlopeX - visualSlopeX) * slopeBlend;
            visualSlopeZ += (playerSlopeZ - visualSlopeZ) * slopeBlend;
          }
          const playerY = playerSurface.height;
          spellAge += delta;
          const spellPulse = Math.exp(-spellAge * 2.7);
          completionAge += delta;

          const spellForwardX = Math.sin(playerHeading);
          const spellForwardZ = -Math.cos(playerHeading);
          const spellRightX = Math.cos(playerHeading);
          const spellRightZ = Math.sin(playerHeading);
          const previewImpactX = playerX + spellForwardX * 3.2 + spellRightX * 0.9;
          const previewImpactZ = playerZ + spellForwardZ * 3.2 + spellRightZ * 0.9;
          let nearestDormantDistance = Number.POSITIVE_INFINITY;
          for (let index = 0; index < beaconPositions.length; index += 1) {
            if (beaconActive[index]) continue;
            const beacon = beaconPositions[index];
            nearestDormantDistance = Math.min(
              nearestDormantDistance,
              Math.hypot(previewImpactX - beacon.x, previewImpactZ - beacon.z),
            );
          }
          if (demoMode && spellAge > 1.1 && nearestDormantDistance < 2.35) {
            castIcePulse();
          }
          if (objectiveRef.current) {
            objectiveRef.current.textContent =
              activatedCount === beaconPositions.length
                ? "Veil stabilized"
                : `Frost sigils ${activatedCount} / ${beaconPositions.length}`;
          }
          if (promptRef.current) {
            promptRef.current.textContent =
              activatedCount === beaconPositions.length
                ? "All sigils resonant"
                : nearestDormantDistance < 2.6
                  ? "E — awaken sigil"
                  : "Follow the blue light";
          }

          uniforms[0] = canvas.width;
          uniforms[1] = canvas.height;
          uniforms[2] = elapsed;
          const groundedForSnow = jumpHeight <= 0.085;
          const boardSnowActive = playerSpeed > 0.035 && groundedForSnow;
          const spellSnowActive = spellPulse > 0.01;
          const snowInteractionActive = boardSnowActive || spellSnowActive;
          snowHistoryTouched ||= snowInteractionActive;
          deformationAccumulator = Math.min(deformationAccumulator + delta, deformationInterval);
          const shouldDecaySnowHistory =
            snowHistoryTouched && deformationAccumulator >= deformationInterval;
          const shouldUpdateSnowHistory = snowInteractionActive || shouldDecaySnowHistory;
          const partialSnowUpdate = snowInteractionActive && !shouldDecaySnowHistory;
          const deformationDelta = shouldDecaySnowHistory ? deformationAccumulator : 0;
          if (shouldDecaySnowHistory) deformationAccumulator = 0;
          let deformationRegionX = playerX;
          let deformationRegionZ = playerZ;
          if (spellSnowActive) {
            deformationRegionX = boardSnowActive ? (playerX + previewImpactX) * 0.5 : previewImpactX;
            deformationRegionZ = boardSnowActive ? (playerZ + previewImpactZ) * 0.5 : previewImpactZ;
          }
          const deformationRegion = snowHistoryRegionOffset(
            deformationRegionX,
            deformationRegionZ,
            deformationResolution,
            128,
            deformationRegionSize,
          );
          uniforms[3] = deformationDelta;
          // Keep the orbit relative to travel so the default three-quarter
          // chase view continues to show which end of the board is leading.
          uniforms[4] = yaw - playerHeading;
          uniforms[5] = pitch;
          uniforms[6] = distance;
          uniforms[7] = 0.72;
          uniforms[8] = deformationAccumulator;
          uniforms[9] = playerY;
          uniforms[10] = spellPulse;
          uniforms[11] = powderEnergy * powderSide;
          uniforms[12] = playerX;
          uniforms[13] = playerZ;
          uniforms[14] = playerHeading;
          uniforms[15] = Math.min(playerSpeed / 8.4, 1);
          for (let index = 0; index < beaconPositions.length; index += 1) {
            const beacon = beaconPositions[index];
            const offset = 16 + index * 4;
            uniforms[offset] = beacon.x;
            uniforms[offset + 1] = snowHeightAt(beacon.x, beacon.z) - 0.04;
            uniforms[offset + 2] = beacon.z;
            uniforms[offset + 3] = beaconActive[index] ? 1 : 0;
          }
          uniforms[28] = playerBoardYaw;
          uniforms[29] = steerVisual;
          uniforms[30] = completionAge;
          uniforms[31] = jumpHeight;
          uniforms[32] = visualSlopeX;
          uniforms[33] = visualSlopeZ;
          uniforms[34] = previousStampX;
          uniforms[35] = previousStampZ;
          uniforms[36] = landingCompression;
          uniforms[37] = jumpVelocity;
          uniforms[38] = partialSnowUpdate ? deformationRegion.x : 0;
          uniforms[39] = partialSnowUpdate ? deformationRegion.y : 0;
          uniforms[40] = ridePose;
          uniforms[41] = brakePose;
          uniforms[42] = airPose;
          uniforms[43] = landPose;
          uniforms.set(clothFlowX, 44);
          uniforms.set(clothFlowZ, 48);
          activeDevice.queue.writeBuffer(uniformBuffer, 0, uniforms);
          if (!groundedForSnow || shouldUpdateSnowHistory) {
            previousStampX = playerX;
            previousStampZ = playerZ;
          }

          if (!depthTexture || !sceneColorTexture || !postBindGroup) {
            animationFrame = requestAnimationFrame(render);
            return;
          }

          const encoder = activeDevice.createCommandEncoder({ label: "Snowveil frame" });
          if (shouldUpdateSnowHistory) {
            const deformationWriteIndex = 1 - deformationReadIndex;
            if (partialSnowUpdate) {
              encoder.copyTextureToTexture(
                { texture: deformationTextures[deformationReadIndex] },
                { texture: deformationTextures[deformationWriteIndex] },
                [deformationResolution, deformationResolution],
              );
            }
            const deformationPass = encoder.beginComputePass({ label: "Snowveil snow memory update" });
            deformationPass.setPipeline(deformationPipeline);
            deformationPass.setBindGroup(0, deformationBindGroups[deformationReadIndex]);
            const dispatchSize = partialSnowUpdate ? deformationRegionSize : deformationResolution;
            deformationPass.dispatchWorkgroups(dispatchSize / 8, dispatchSize / 8);
            deformationPass.end();
            deformationReadIndex = deformationWriteIndex;
          }
          const spindriftPlacementPass = encoder.beginComputePass({
            label: "Snowveil world-space spindrift placement",
          });
          spindriftPlacementPass.setPipeline(spindriftComputePipeline);
          spindriftPlacementPass.setBindGroup(0, spindriftComputeBindGroups[deformationReadIndex]);
          spindriftPlacementPass.dispatchWorkgroups(Math.ceil(spindriftParticleCount / 64));
          spindriftPlacementPass.end();
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: sceneColorTexture.createView(),
                clearValue: { r: 0.025, g: 0.065, b: 0.1, a: 1 },
                loadOp: "clear",
                storeOp: "store",
              },
            ],
            depthStencilAttachment: {
              view: depthTexture.createView(),
              depthClearValue: 1,
              depthLoadOp: "clear",
              depthStoreOp: "store",
            },
          });
          pass.setPipeline(skyPipeline);
          pass.setBindGroup(0, skyBindGroup);
          pass.draw(3);
          pass.setPipeline(terrainPipeline);
          pass.setBindGroup(0, terrainBindGroups[deformationReadIndex]);
          pass.setVertexBuffer(0, terrainVertexBuffer);
          pass.setIndexBuffer(terrainIndexBuffer, "uint32");
          pass.drawIndexed(terrainIndices.length);
          pass.setPipeline(playerPipeline);
          pass.setBindGroup(0, playerBindGroup);
          pass.setVertexBuffer(0, riderVertexBuffer);
          pass.setIndexBuffer(riderIndexBuffer, "uint32");
          pass.drawIndexed(riderGeometry.indices.length);
          pass.setPipeline(beaconPipeline);
          pass.setBindGroup(0, beaconBindGroup);
          pass.setVertexBuffer(0, beaconVertexBuffer);
          pass.setIndexBuffer(beaconIndexBuffer, "uint32");
          pass.drawIndexed(beaconGeometry.indices.length, beaconPositions.length);
          pass.setPipeline(spindriftPipeline);
          pass.setBindGroup(0, spindriftBindGroup);
          pass.draw(4, spindriftParticleCount);
          pass.setPipeline(snowOverlayPipeline);
          pass.setBindGroup(0, snowOverlayBindGroup);
          pass.draw(3);
          pass.end();
          const postPass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0.01, g: 0.025, b: 0.04, a: 1 },
                loadOp: "clear",
                storeOp: "store",
              },
            ],
          });
          postPass.setPipeline(postPipeline);
          postPass.setBindGroup(0, postBindGroup);
          postPass.draw(3);
          postPass.end();
          activeDevice.queue.submit([encoder.finish()]);

          animationFrame = requestAnimationFrame(render);
        };

        if (!disposed) {
          setSceneState("ready");
          animationFrame = requestAnimationFrame(render);
        }
      } catch (error) {
        console.error("Snowveil WebGPU startup failed", error);
        if (!disposed) {
          setMessage(error instanceof Error ? error.message : "WebGPU failed to start.");
          setSceneState("error");
        }
      }
    }

    void start();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      for (const control of touchControls) {
        control.removeEventListener("pointerdown", onControlPointerDown);
        control.removeEventListener("pointerup", onControlPointerEnd);
        control.removeEventListener("pointercancel", onControlPointerEnd);
        control.removeEventListener("lostpointercapture", onControlPointerEnd);
      }
      audio.dispose();
      audioControllerRef.current = null;
      if (evidenceMode) {
        delete document.documentElement.dataset.snowveilEvidence;
      }
      if (captureMode) {
        delete document.documentElement.dataset.snowveilCapture;
      }
      device?.destroy?.();
    };
  }, []);

  return (
    <main className="snowveil">
      <canvas
        ref={canvasRef}
        className="snowveil__canvas"
        data-ready={sceneState === "ready"}
        aria-label="Interactive procedural snow landscape. Accelerate with W, carve with A and D, brake with S, jump with Space, cast with E, or use the onscreen touch controls. Drag to orbit and scroll to change distance."
      />

      <div className="snowveil__veil" aria-hidden="true" />

      <nav
        className="snowveil__touch-controls"
        data-visible={sceneState === "ready"}
        hidden={sceneState !== "ready"}
        aria-label="Snowboard touch controls"
      >
        <div className="snowveil__touch-steer">
          <button type="button" data-snowveil-key="KeyA" aria-label="Carve left">
            <span aria-hidden="true">‹</span>
            <small>Carve</small>
          </button>
          <button type="button" data-snowveil-key="KeyW" aria-label="Accelerate">
            <span aria-hidden="true">↑</span>
            <small>Ride</small>
          </button>
          <button type="button" data-snowveil-key="KeyD" aria-label="Carve right">
            <span aria-hidden="true">›</span>
            <small>Carve</small>
          </button>
          <button type="button" data-snowveil-key="KeyS" aria-label="Brake">
            <span aria-hidden="true">—</span>
            <small>Brake</small>
          </button>
        </div>
        <div className="snowveil__touch-actions">
          <button type="button" data-snowveil-key="Space" aria-label="Jump">
            <span aria-hidden="true">↥</span>
            <small>Jump</small>
          </button>
          <button type="button" data-snowveil-key="KeyE" aria-label="Cast Ice Pulse">
            <span aria-hidden="true">✦</span>
            <small>Pulse</small>
          </button>
        </div>
      </nav>

      <header className="snowveil__brand" aria-label="Snowveil">
        <span className="snowveil__mark" aria-hidden="true" />
        <span className="snowveil__wordmark">Snowveil</span>
        <span className="snowveil__status">Frost rite · WebGPU</span>
      </header>

      {sceneState === "ready" && (
        <>
          <aside className="snowveil__objective" aria-live="polite">
            <span className="snowveil__objective-label">Ritual</span>
            <span ref={objectiveRef} className="snowveil__objective-state">
              Frost sigils 0 / 3
            </span>
            <span ref={promptRef} className="snowveil__objective-prompt">
              Follow the blue light
            </span>
          </aside>

          {riteComplete && (
            <div className="snowveil__completion" role="status" aria-live="polite">
              <span>Frost rite</span>
              <strong>Veil stabilized</strong>
              <small>Three sigils resonate</small>
            </div>
          )}

          <button
            className="snowveil__audio"
            type="button"
            aria-pressed={audioEnabled}
            onClick={() => {
              void audioControllerRef.current?.toggle().then((enabled) => {
                setAudioReady(true);
                setAudioEnabled(enabled);
              });
            }}
          >
            <span aria-hidden="true" />
            {audioEnabled ? "Audio on" : audioReady ? "Audio off" : "Enable audio"}
          </button>

          <footer className="snowveil__footer">
            <span>W accelerate · A/D carve · S brake · Space jump · E pulse</span>
            <span className="snowveil__rule" aria-hidden="true" />
            <span ref={speedRef}>0.0 m/s</span>
            <span className="snowveil__rule" aria-hidden="true" />
            <span ref={fpsRef}>GPU ready</span>
          </footer>
        </>
      )}

      {sceneState === "loading" && (
        <div className="snowveil__loader" role="status" aria-live="polite">
          <div className="snowveil__loader-copy">
            <span>{message}</span>
            <span className="snowveil__loader-line" aria-hidden="true" />
          </div>
        </div>
      )}

      {(sceneState === "unsupported" || sceneState === "error") && (
        <div className="snowveil__fallback" role="alert">
          <div>
            <strong>{sceneState === "unsupported" ? "WebGPU required" : "Scene unavailable"}</strong>
            <span>
              {sceneState === "unsupported"
                ? "Snowveil needs a WebGPU-capable browser and a recent GPU."
                : message}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
