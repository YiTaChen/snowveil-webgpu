"use client";

import { useEffect, useRef, useState } from "react";
import {
  snowveilBeaconShader,
  snowveilDeformationShader,
  snowveilPlayerShader,
  snowveilPostShader,
  snowveilSkyShader,
  snowveilTerrainShader,
} from "./snowveil-shader";
import { snowHeightAt } from "./snowveil-terrain";
import { createRiderGeometry } from "./snowveil-rider-geometry";
import { createBeaconGeometry } from "./snowveil-beacon-geometry";
import { createSnowveilAudio, type SnowveilAudio } from "./snowveil-audio";

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
    const demoMode = query.has("demo");
    if (evidenceMode) {
      document.documentElement.dataset.snowveilEvidence = "true";
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
    let yaw = 0;
    let pitch = 0.02;
    let distance = 5.9;
    let renderScale = 1.0;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let playerX = 0;
    let playerZ = -4;
    let playerHeading = 0;
    let playerVelocityX = 0;
    let playerVelocityZ = 0;
    let spellAge = 100;
    let completionPulse = 0;
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
      distance = Math.max(4.2, Math.min(11.5, distance + event.deltaY * 0.006));
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
        completionPulse = 1;
        const finalBeacon = activatedCount === beaconPositions.length;
        audio.activateBeacon(closestBeacon, finalBeacon);
        if (finalBeacon) {
          completionAge = 0;
          setRiteComplete(true);
        }
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      void audio.unlock().then((enabled) => {
        setAudioReady(true);
        setAudioEnabled(enabled);
      });
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      pressedKeys.add(event.code);
      keyPulseUntil.set(event.code, performance.now() + 145);
      if (event.code === "Space" && !event.repeat) {
        castIcePulse();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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
          postCompilation,
          playerCompilation,
          beaconCompilation,
          deformationCompilation,
        ] = await Promise.all([
            skyShaderModule.getCompilationInfo(),
            terrainShaderModule.getCompilationInfo(),
            postShaderModule.getCompilationInfo(),
            playerShaderModule.getCompilationInfo(),
            beaconShaderModule.getCompilationInfo(),
            deformationShaderModule.getCompilationInfo(),
          ]);
        const shaderErrors = [
          ...skyCompilation.messages,
          ...terrainCompilation.messages,
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
          fragment: { module: beaconShaderModule, entryPoint: "fsBeacon", targets: [{ format: sceneFormat }] },
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
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
          size: 128,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
        const deformationResolution = 768;
        const deformationTextures = [0, 1].map((index) =>
          activeDevice.createTexture({
            label: `Snowveil deformation history ${index}`,
            size: [deformationResolution, deformationResolution],
            format: "rgba16float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
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
        const uniforms = new Float32Array(32);

        const terrainSegments = 352;
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
          const ratio = Math.min(window.devicePixelRatio || 1, renderScale);
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
              fpsRef.current.textContent = `${fps} FPS · P95 ${p95.toFixed(1)} ms · 1% ${lowOnePercent}`;
            }
            if (!evidenceMode) {
              if (fps < 42 && renderScale > 0.78) renderScale -= 0.04;
              if (fps > 56 && renderScale < 1.0) renderScale += 0.025;
            }
            fpsStarted = now;
            fpsFrames = 0;
          }

          const manualInputX =
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
          const manualInputForward =
            (pressedKeys.has("KeyW") ||
            pressedKeys.has("ArrowUp") ||
            (keyPulseUntil.get("KeyW") ?? 0) > now ||
            (keyPulseUntil.get("ArrowUp") ?? 0) > now
              ? 1
              : 0) -
            (pressedKeys.has("KeyS") ||
            pressedKeys.has("ArrowDown") ||
            (keyPulseUntil.get("KeyS") ?? 0) > now ||
            (keyPulseUntil.get("ArrowDown") ?? 0) > now
              ? 1
              : 0);
          const demoTargetIndex = demoMode ? beaconActive.findIndex((isActive) => !isActive) : -1;
          const inputX = demoMode ? (demoTargetIndex >= 0 ? 1 : 0) : manualInputX;
          const inputForward = demoMode ? 0 : manualInputForward;
          const inputLength = Math.hypot(inputX, inputForward);
          const forwardX = Math.sin(yaw);
          const forwardZ = -Math.cos(yaw);
          const rightX = Math.cos(yaw);
          const rightZ = Math.sin(yaw);
          const rideSpeed = pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight") ? 8.4 : 5.4;
          const demoTarget = demoTargetIndex >= 0 ? beaconPositions[demoTargetIndex] : null;
          const demoTargetDistance = demoTarget ? Math.hypot(demoTarget.x - playerX, demoTarget.z - playerZ) : 0;
          const desiredVelocityX = demoTarget
            ? ((demoTarget.x - playerX) / Math.max(demoTargetDistance, 0.001)) * rideSpeed
            : inputLength > 0
              ? ((rightX * inputX + forwardX * inputForward) / inputLength) * rideSpeed
              : 0;
          const desiredVelocityZ = demoTarget
            ? ((demoTarget.z - playerZ) / Math.max(demoTargetDistance, 0.001)) * rideSpeed
            : inputLength > 0
              ? ((rightZ * inputX + forwardZ * inputForward) / inputLength) * rideSpeed
              : 0;
          const acceleration = 1 - Math.exp(-delta * (inputLength > 0 ? 7.5 : 4.2));
          playerVelocityX += (desiredVelocityX - playerVelocityX) * acceleration;
          playerVelocityZ += (desiredVelocityZ - playerVelocityZ) * acceleration;
          playerX += playerVelocityX * delta;
          playerZ += playerVelocityZ * delta;
          const playerRadius = Math.hypot(playerX, playerZ);
          if (playerRadius > 54) {
            const boundaryScale = 54 / playerRadius;
            playerX *= boundaryScale;
            playerZ *= boundaryScale;
          }
          const playerSpeed = Math.hypot(playerVelocityX, playerVelocityZ);
          audio.setMotion(playerSpeed);
          if (speedRef.current) speedRef.current.textContent = `${playerSpeed.toFixed(1)} m/s`;
          if (playerSpeed > 0.08) {
            const desiredHeading = Math.atan2(playerVelocityX, -playerVelocityZ);
            const headingDelta = Math.atan2(
              Math.sin(desiredHeading - playerHeading),
              Math.cos(desiredHeading - playerHeading),
            );
            playerHeading += headingDelta * (1 - Math.exp(-delta * 9));
          }
          const playerY = snowHeightAt(playerX, playerZ);
          spellAge += delta;
          const spellPulse = Math.exp(-spellAge * 2.7);
          completionPulse = Math.max(0, completionPulse - delta * 0.34);
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
                  ? "Space — awaken sigil"
                  : "Follow the blue light";
          }

          uniforms[0] = canvas.width;
          uniforms[1] = canvas.height;
          uniforms[2] = elapsed;
          uniforms[3] = delta;
          uniforms[4] = yaw;
          uniforms[5] = pitch;
          uniforms[6] = distance;
          uniforms[7] = 0.72;
          uniforms[8] = dragging ? 1 : 0;
          uniforms[9] = playerY;
          uniforms[10] = spellPulse;
          uniforms[11] = spellAge;
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
          uniforms[28] = activatedCount / beaconPositions.length;
          uniforms[29] = completionPulse;
          uniforms[30] = completionAge;
          activeDevice.queue.writeBuffer(uniformBuffer, 0, uniforms);

          if (!depthTexture || !sceneColorTexture || !postBindGroup) {
            animationFrame = requestAnimationFrame(render);
            return;
          }

          const encoder = activeDevice.createCommandEncoder({ label: "Snowveil frame" });
          const deformationWriteIndex = 1 - deformationReadIndex;
          const deformationPass = encoder.beginComputePass({ label: "Snowveil snow memory update" });
          deformationPass.setPipeline(deformationPipeline);
          deformationPass.setBindGroup(0, deformationBindGroups[deformationReadIndex]);
          deformationPass.dispatchWorkgroups(deformationResolution / 8, deformationResolution / 8);
          deformationPass.end();
          deformationReadIndex = deformationWriteIndex;
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
          pass.setPipeline(beaconPipeline);
          pass.setBindGroup(0, beaconBindGroup);
          pass.setVertexBuffer(0, beaconVertexBuffer);
          pass.setIndexBuffer(beaconIndexBuffer, "uint32");
          pass.drawIndexed(beaconGeometry.indices.length, beaconPositions.length);
          pass.setPipeline(playerPipeline);
          pass.setBindGroup(0, playerBindGroup);
          pass.setVertexBuffer(0, riderVertexBuffer);
          pass.setIndexBuffer(riderIndexBuffer, "uint32");
          pass.drawIndexed(riderGeometry.indices.length);
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
      audio.dispose();
      audioControllerRef.current = null;
      if (evidenceMode) {
        delete document.documentElement.dataset.snowveilEvidence;
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
        aria-label="Interactive procedural snow landscape. Ride with WASD, cast with Space, drag to orbit, and scroll to change distance."
      />

      <div className="snowveil__veil" aria-hidden="true" />

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
            <span>WASD ride · Space cast</span>
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
                ? "Snowveil needs a WebGPU-capable desktop browser and a recent GPU."
                : message}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
