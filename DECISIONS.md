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

## 2026-08-13 — Persistent snow uses ping-pong GPU history

Interactive snow state lives in two original 512×512 `rgba16float` textures
covering the finite 128-metre play field. A compute pass reads the previous
texture, stamps the board compression and displaced edge ridges, applies a very
slow recovery rate, and writes the next texture. Terrain vertices, normals, and
material response all read the newest history, so the visible track is geometry
instead of a decal and remains after the rider leaves.

An initially uniform 384×384 terrain grid made a sub-metre track visibly stair
stepped. The active 352×352 grid uses a player-centred quadratic density warp:
near-field spacing is roughly 13–14 centimetres while distant cells become
progressively larger. This removed the track stair-step while reducing triangle
count from the earlier uniform baseline.

Sampling snow history inside the ten-step terrain shadow loop reduced Chrome to
approximately 31 FPS. Deformation is now included in the visible surface height
and normal but excluded from the broad terrain shadow query; the same view
returned to 50–54 FPS when stationary and 44–47 FPS during movement.

## 2026-08-13 — Bespoke procedural rider replaces sphere assembly

The first instanced-ellipsoid rider was rejected after the browser still because
its separated parts read as a toy. The active prototype is generated as one
project-owned mesh: a ring-profiled tapered cloak, hood, face inset, curved
double-sided scarf, board, clasp, and emissive focus. It has a coherent silhouette
and supports lean and cloth motion, but its final character-art gate remains open.

## 2026-08-13 — Ice Pulse shares snow simulation history

Space casts the original Ice Pulse interaction at a point ahead and to the
rider's right. The compute pass presses a shallow centre into the snow and lifts
an annular displacement ridge. The green channel of the existing deformation
history stores a slowly fading procedural frost residue, so a cast remains
visually verifiable after the emissive projectile and screen-space energy ring
have disappeared. No decal or external effect asset is used.

The first energy target overlapped the rider's head in the review still and was
rejected. The offset target now creates a readable rider–projectile–impact
composition. Speed-dependent foreground spray also moves behind the rider rather
than crossing the cloak silhouette.
