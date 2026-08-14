# Decisions

## 2026-08-13 — Original native WebGPU vertical slice

The first visual gate uses one original native-WebGPU full-frame shader instead
of importing a game framework or external visual assets. This creates a fast,
copyright-clean surface for iterating on composition, snow response, atmosphere,
and tone mapping before committing to the later geometry and simulation stack.

The ray-marched heightfield is intentionally an art-direction prototype. It will
be retained as a distant-terrain or loading-view option if the geometry-based
milestone surpasses it; otherwise it remains the evidence for why a different
rendering architecture is required.

## 2026-08-13 — Raster terrain replaces full-frame ray marching

Chrome testing showed that the art-direction ray marcher produced attractive
close snow at some angles, but grazing rays created disconnected distant bands
and the shader fell below an acceptable interactive frame rate. More conservative
marching removed some gaps but further reduced performance; more aggressive
marching increased the gaps. This is an architectural conflict, not a tuning
problem.

The primary renderer therefore moves to a dense native-WebGPU grid displaced in
the vertex shader. The same original terrain and snow functions remain, while
real depth, stable silhouettes, and a much smaller fragment cost provide the
foundation required for later deformation and motion-vector passes.

## 2026-08-13 — HDR before interactive snow

The raster renderer now shades into an `rgba16float` scene target. A separate
fullscreen resolve performs a restrained bright-pass bloom, ACES-style tone
mapping, vignette, and sub-visible grain before presenting to the canvas. This
keeps sun energy and crystalline highlights above display white without clipping
the snow body to a flat value.

Chrome validation exposed a vertical flip in the first resolve because the
off-screen render target and the fullscreen triangle used different Y-origin
conventions. The post vertex shader now explicitly flips the sampled Y
coordinate. No new WebGPU validation errors were emitted after the corrected
reload.
