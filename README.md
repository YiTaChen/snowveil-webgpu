# Snowveil WebGPU

Snowveil is an original real-time snow-world visual study. Its first milestone is
a cinematic procedural landscape rendered with native WebGPU and hand-written
WGSL: wind-shaped dunes, layered snow response, a low winter sun, atmospheric
haze, stable crystalline glints, and restrained blowing snow.

The product standard is visual quality. A feature is not accepted merely because
it works; it must also survive a clean 1440p still-frame review.

## Prerequisites

- Node.js `>=22.13.0`

## Run locally

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

Use a desktop browser with WebGPU enabled. Drag the scene to orbit and use the
mouse wheel to change camera distance.

## Originality and licensing

No reference-project code or assets are copied into this repository. The current
scene uses no image, model, HDRI, animation, or audio assets. Terrain, lighting,
atmosphere, snow particles, and surface detail are produced procedurally by the
project's own WGSL code.

See [ORIGINALITY.md](./ORIGINALITY.md) and [ASSETS.md](./ASSETS.md) before adding
any visual or audio dependency.

Original project code is released under the [MIT License](./LICENSE).

## Milestones

1. Cinematic snow visual gate — in progress; stable raster baseline established.
2. Geometry terrain and temporal rendering.
3. Persistent deformable snow.
4. Character motion, contact, and snow-surfing.
5. Original spell interactions and performance hardening.

The current build is a development milestone, not a claim that the final visual
gate has passed. See [PERF.md](./PERF.md) and [QUALITY.md](./QUALITY.md).
