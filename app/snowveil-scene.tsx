"use client";

import { useEffect, useRef, useState } from "react";
import { snowveilSkyShader, snowveilTerrainShader } from "./snowveil-shader";

type SceneState = "loading" | "ready" | "unsupported" | "error";

export function SnowveilScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const [sceneState, setSceneState] = useState<SceneState>("loading");
  const [message, setMessage] = useState("Preparing atmosphere");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    const webgpu = navigator.gpu;
    if (!webgpu) {
      queueMicrotask(() => {
        if (!disposed) setSceneState("unsupported");
      });
      return () => {
        disposed = true;
      };
    }

    let animationFrame = 0;
    let device: GPUDevice | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let lastFrame = performance.now();
    let fpsStarted = lastFrame;
    let fpsFrames = 0;
    let yaw = 0;
    let pitch = 0.02;
    let distance = 6.9;
    let renderScale = 1.0;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;

    const onPointerDown = (event: PointerEvent) => {
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

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

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
        context.configure({ device: activeDevice, format, alphaMode: "opaque" });

        const skyShaderModule = activeDevice.createShaderModule({
          label: "Snowveil original procedural sky shader",
          code: snowveilSkyShader,
        });
        const terrainShaderModule = activeDevice.createShaderModule({
          label: "Snowveil original procedural terrain shader",
          code: snowveilTerrainShader,
        });

        const [skyCompilation, terrainCompilation] = await Promise.all([
          skyShaderModule.getCompilationInfo(),
          terrainShaderModule.getCompilationInfo(),
        ]);
        const shaderErrors = [...skyCompilation.messages, ...terrainCompilation.messages].filter(
          (entry: { type: string }) => entry.type === "error",
        );
        if (shaderErrors.length) {
          throw new Error(shaderErrors.map((entry: { message: string }) => entry.message).join("\n"));
        }

        const skyPipeline = activeDevice.createRenderPipeline({
          label: "Snowveil atmosphere pipeline",
          layout: "auto",
          vertex: { module: skyShaderModule, entryPoint: "vsMain" },
          fragment: { module: skyShaderModule, entryPoint: "fsMain", targets: [{ format }] },
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
                format,
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
            targets: [{ format }],
          },
          primitive: { topology: "triangle-list", cullMode: "back" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less",
          },
        });

        const uniformBuffer = activeDevice.createBuffer({
          label: "Snowveil frame uniforms",
          size: 64,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const skyBindGroup = activeDevice.createBindGroup({
          layout: skyPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });
        const terrainBindGroup = activeDevice.createBindGroup({
          layout: terrainPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });
        const snowOverlayBindGroup = activeDevice.createBindGroup({
          layout: snowOverlayPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });
        const uniforms = new Float32Array(16);

        const terrainSegments = 384;
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

        let depthTexture: GPUTexture | undefined;
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
            depthTexture = activeDevice.createTexture({
              label: "Snowveil depth buffer",
              size: [width, height],
              format: "depth24plus",
              usage: GPUTextureUsage.RENDER_ATTACHMENT,
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
          const delta = Math.min((now - lastFrame) / 1000, 0.05);
          lastFrame = now;
          fpsFrames += 1;

          if (now - fpsStarted > 800) {
            const fps = Math.round((fpsFrames * 1000) / (now - fpsStarted));
            if (fpsRef.current) fpsRef.current.textContent = `${fps} FPS`;
            if (fps < 42 && renderScale > 0.78) renderScale -= 0.04;
            if (fps > 56 && renderScale < 1.0) renderScale += 0.025;
            fpsStarted = now;
            fpsFrames = 0;
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
          uniforms[9] = 0.78;
          uniforms[10] = 0.24;
          uniforms[11] = 0;
          activeDevice.queue.writeBuffer(uniformBuffer, 0, uniforms);

          const encoder = activeDevice.createCommandEncoder({ label: "Snowveil frame" });
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
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
          pass.setBindGroup(0, terrainBindGroup);
          pass.setVertexBuffer(0, terrainVertexBuffer);
          pass.setIndexBuffer(terrainIndexBuffer, "uint32");
          pass.drawIndexed(terrainIndices.length);
          pass.setPipeline(snowOverlayPipeline);
          pass.setBindGroup(0, snowOverlayBindGroup);
          pass.draw(3);
          pass.end();
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
      device?.destroy?.();
    };
  }, []);

  return (
    <main className="snowveil">
      <canvas
        ref={canvasRef}
        className="snowveil__canvas"
        data-ready={sceneState === "ready"}
        aria-label="Interactive procedural snow landscape. Drag to orbit and scroll to change distance."
      />

      <div className="snowveil__veil" aria-hidden="true" />

      <header className="snowveil__brand" aria-label="Snowveil">
        <span className="snowveil__mark" aria-hidden="true" />
        <span className="snowveil__wordmark">Snowveil</span>
        <span className="snowveil__status">Visual study 001</span>
      </header>

      {sceneState === "ready" && (
        <footer className="snowveil__footer">
          <span>Drag to orbit</span>
          <span className="snowveil__rule" aria-hidden="true" />
          <span ref={fpsRef}>GPU ready</span>
        </footer>
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
