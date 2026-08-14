# Visual acceptance gates

## Gate 1 — snow landscape

- A clean 1440p still must read as a cohesive winter environment before any
  character or game mechanic is added.
- Snow must have large landforms, medium directional drifts, fine wind ridges,
  translucent blue shadow response, restrained sparkle, and no flat white areas.
- The low sun, sky, fog, and snow lighting must share one coherent palette.
- No placeholder geometry, default material, visible faceting, noisy glitter,
  crushed shadows, clipped highlights, or obvious repeating texture may remain.
- Motion must hold a stable image without crawling surface noise or distracting
  particle patterns.

## Evidence

Each major visual milestone must include:

- a 2560×1440 still from the running build;
- a close, middle, and far-field inspection;
- frame-time and device notes;
- a written list of defects found in the captured frame;
- a second capture after the defects are addressed.

Passing a build is necessary but does not pass a visual gate.

## Captured review state

### 2026-08-13 — 2560×1440 defect capture

Evidence: [`evidence/gate-1-character-defect-2560x1440.jpg`](./evidence/gate-1-character-defect-2560x1440.jpg)

The native-resolution capture confirms that the snow landscape has coherent
large dunes, directional drift detail, low-sun atmosphere, and readable shadow
colour. Gate 1 remains open because the rider in this frame is still a simplified
cloak-and-hood silhouette: the dark side loses material definition and the pose
lacks readable shoulders, arms, and layered cloth construction.

Work after this capture adds an asymmetrical casting pose, rounded arms and
hands, shoulder pieces, a belt, a separate back-cape layer, and model-space cloth
panels. That intermediate checkpoint was subsequently rejected because its
ground-length coat and ellipsoid board still formed a pod-like silhouette.

### 2026-08-14 — rider rebuild comparison

Before: [`evidence/gate-1-rider-rebuild-before-2560x1440.jpg`](./evidence/gate-1-rider-rebuild-before-2560x1440.jpg)

After: [`evidence/gate-1-rider-rebuild-after-2560x1440.jpg`](./evidence/gate-1-rider-rebuild-after-2560x1440.jpg)

Inspections:

- close: [`evidence/gate-1-rider-close-2560x1440.jpg`](./evidence/gate-1-rider-close-2560x1440.jpg)
- middle: [`evidence/gate-1-rider-rebuild-after-2560x1440.jpg`](./evidence/gate-1-rider-rebuild-after-2560x1440.jpg)
- far: [`evidence/gate-1-rider-far-2560x1440.jpg`](./evidence/gate-1-rider-far-2560x1440.jpg)
- motion and cast: [`evidence/interaction-ride-track-1182x749.jpg`](./evidence/interaction-ride-track-1182x749.jpg), [`evidence/interaction-ice-pulse-1182x749.jpg`](./evidence/interaction-ice-pulse-1182x749.jpg)

The before frame exposed a black egg-shaped lower body, a thick collar, short
tube-like limbs, insufficient contact, and a board whose end-on projection read
as another body part. The retained rebuild exposes bent legs and boots, separates
the shoulder construction, introduces a readable hood seam and irregular cloth
hem, strengthens contact occlusion, and replaces the ellipsoid with a thin,
upturned, layered snow-surfing blade.

The close, middle, and far captures confirm that the new silhouette survives the
fixed chase camera and that the snow landscape remains the dominant subject.
The rider rebuild is accepted as an iteration checkpoint, not final character
art. Gate 1 remains open: dynamic-resolution motion still exposes stair-stepped
track edges at some slopes, the distant horizon can show a hard raster contour,
and the rider still needs a higher-detail animation/material pass before release.

### 2026-08-14 — track and horizon stability checkpoint

Interactive track: [`evidence/interaction-ride-track-aa-1182x749.jpg`](./evidence/interaction-ride-track-aa-1182x749.jpg)

Fixed 1440p horizon: [`evidence/gate-1-stability-after-2560x1440.jpg`](./evidence/gate-1-stability-after-2560x1440.jpg)

The denser deformation history, wider board stamp, and more concentrated terrain
warp reduce the earlier track staircase to a smaller, irregular broken-snow edge.
Derivative fades remove undersampled fine ridges without flattening the near
surface. Matching terrain fog to the exact sky calculation removes the dark
raster contour from the far mesh boundary in the new 2560×1440 capture. Browser
logs contain no WebGPU warnings or validation errors.

This is accepted as a stability checkpoint, not a final gate pass. The track
must still survive later oblique-camera and higher-speed tests, fixed 1440p is a
still-capture path rather than a playable target, and the rider still requires a
higher-detail animation and material pass.

### 2026-08-14 — rider force and material checkpoint

Consecutive curved-ride frames:

- [`evidence/interaction-carve-pose-a-1182x749.jpg`](./evidence/interaction-carve-pose-a-1182x749.jpg)
- [`evidence/interaction-carve-pose-b-1182x749.jpg`](./evidence/interaction-carve-pose-b-1182x749.jpg)

The two running-build frames are separated by about 0.4 seconds at 5.4 m/s. They
show a readable bank-to-recovery change in the torso and blade, knee compression,
and a different scarf/cape phase; the character is no longer a rigid mesh merely
translated along the terrain. The brighter dye range, local-space weave, snow
bounce, and cape folds preserve dark-cloth detail without introducing crawling
noise. Shallower compression also prevents a sustained ride from cutting an
implausibly deep trench. Browser logs contain no warnings or WebGPU errors.

The animation/material checkpoint is accepted, but final character art remains
open. Hands and shoulder armour are still simplified volumes, there is no facial
performance, and the shader deformation is a compact part-based prototype rather
than a production skeletal rig with authored clips and transitions.

### 2026-08-14 — winter-caster equipment checkpoint

Evidence:

- native 1440p landscape and rear silhouette: [`evidence/gate-1-armor-landscape-2560x1440.jpg`](./evidence/gate-1-armor-landscape-2560x1440.jpg)
- moving cape, shoulder shells, glove cuffs, and blade: [`evidence/interaction-armor-cape-1182x749.jpg`](./evidence/interaction-armor-cape-1182x749.jpg)
- front visor, guard, harness, and stance: [`evidence/rider-visor-front-1182x749.jpg`](./evidence/rider-visor-front-1182x749.jpg)

The spherical shoulder pads and intersecting two-column cape were rejected in
the first browser review. The retained geometry replaces them with curved edged
plates and a crowned, tapered, trimmed cape that remains coherent from the rear
and during a carve. The visor and chest harness give the previously blank front
view an intentional winter-caster identity; cuffs and leather gloves keep the
hands distinct from the sleeves. No image, model, texture, or animation asset is
used.

The primary 2560×1440 frame retains foreground drift detail, two isolated mid-
field mounds, a softer third terrain layer, and the shared low-sun atmosphere.
A separate full-orbit test found and then eliminated a distant tangent ridge by
closing the far mountain band and reaching full terrain fog at 50 metres. Browser
logs contain no warnings or WebGPU validation errors.

This passes the current equipment checkpoint, not final production character
art. The compact shader-driven part rig still lacks authored state transitions,
the coat body remains deliberately stylized, and there is no audio, UI objective,
or broader game loop yet.

### 2026-08-14 — playable Frost Rite checkpoint

Evidence:

- native 1440p completed rite: [`evidence/gate-1-frost-rite-2560x1440.png`](./evidence/gate-1-frost-rite-2560x1440.png)
- interactive route at 2 / 3: [`evidence/ritual-progress-1182x749.png`](./evidence/ritual-progress-1182x749.png)
- interactive completed rite: [`evidence/ritual-complete-1182x749.png`](./evidence/ritual-complete-1182x749.png)

The route reaches all three world-space beacons, fires the visible Ice Pulse at
the same point used for activation, advances the restrained HUD from 0 / 3 to
`Veil stabilized`, and stops at completion. Activated crystals, rings, support
fins, and procedural snow sigils remain readable against the existing low-sun
palette. The completed 1182×749 frame reports 56 FPS, P95 33.3 ms, and 1% low 29;
browser logs contain no WebGPU warning or validation error.

The first 1440p review found clipped cyan emission and a crushed-black stone
plinth. Both were rejected before capture: the retained beacon preserves more
crystal facet variation, lifts cool stone bounce, and lowers the snow-sigil
intensity. The visual checkpoint passes as an original playable loop, but it is
not a final production-content claim. Fixed 1440p remains too slow for gameplay,
the compact rider rig still has no authored transitions, and procedural audio
and a stronger completion presentation remain open release tasks.

### 2026-08-14 — synchronized audio and completion checkpoint

Evidence:

- interactive completion beat: [`evidence/ritual-finale-audio-1182x749.png`](./evidence/ritual-finale-audio-1182x749.png)
- fixed 1440p completion beat: [`evidence/gate-1-frost-rite-finale-2560x1440.png`](./evidence/gate-1-frost-rite-finale-2560x1440.png)

The exact third-activation frames show the normal running scene rather than a
separate victory page: Ice Pulse remains visible, the final crystal and snow
mark are active, a cold post-process wave crosses the composition, the central
title appears, and the rider decelerates. With audio explicitly enabled, the
same event schedules the third drone and original three-layer completion chord.

At 1182×749 the captured beat reports 53 FPS, P95 33.3 ms, and 1% low 30. The
fixed 1440p frame preserves the terrain ridges and low-sun palette beneath the
transient blue wave, with no clipped full-screen flash. Audio enable, mute, and
re-enable states were verified through the accessible button; browser logs show
no AudioContext or WebGPU error. This closes the earlier open audio and completion
presentation tasks, while release-grade 1440p performance and production skeletal
animation remain outside the current checkpoint.

### 2026-08-14 — 1440p shadow-cost checkpoint

Evidence:

- ten-step baseline: [`evidence/performance-shadow-before-2560x1440.png`](./evidence/performance-shadow-before-2560x1440.png)
- retained six-step result: [`evidence/performance-shadow-after-2560x1440.png`](./evidence/performance-shadow-after-2560x1440.png)
- retained full-rite result: [`evidence/performance-rite-after-2560x1440.png`](./evidence/performance-rite-after-2560x1440.png)

The fixed-camera pair preserves the low-sun dune shading, foreground surface
relief, outcrop shadow, three-beacon depth order, and exact sky/fog continuity.
Pixel comparison records only 0.241% mean absolute 8-bit-channel difference even
with different procedural particle and grain frames. The accepted shader raises
idle fixed-1440p performance from 17–18 to 26 FPS and the complete rite from 16
to 22 FPS by stopping terrain shadows before fog dominates.

The more aggressive four-step version and reduced bloom resolve were rejected
after measured browser review. This checkpoint therefore improves a documented
bottleneck without weakening the HDR resolve or claiming that 22–26 FPS is a
release-grade native-1440p target.
