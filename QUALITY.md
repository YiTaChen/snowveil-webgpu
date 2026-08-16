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

## Release evidence boundary

`public/og.png` is a generated link-preview card, not a running-build capture and
must never be used to pass a visual gate. Only files named in the dated evidence
sections above document renderer output. The final interactive route at the
normal 1182×749 review viewport reached 60 FPS, P95 17.4 ms, and 1% low 57 after
the retained shadow change; the fixed 2560×1440 path remains a still-review mode
at 22–26 FPS on the test machine.

### 2026-08-14 — snowboard motion-causality correction

Evidence:

- three-quarter idle composition: [`evidence/motion-base-1182x749.png`](./evidence/motion-base-1182x749.png)
- nose-first glide at 4.6 m/s: [`evidence/motion-glide-1182x749.png`](./evidence/motion-glide-1182x749.png)
- direction change and torso read at 4.9 m/s: [`evidence/motion-carve-1182x749.png`](./evidence/motion-carve-1182x749.png)
- crosswise edge-stop at 1.0 m/s: [`evidence/motion-brake-1182x749.png`](./evidence/motion-brake-1182x749.png)
- moving Space jump at 4.3 m/s: [`evidence/motion-jump-1182x749.png`](./evidence/motion-jump-1182x749.png)
- full three-sigil regression: [`evidence/motion-rite-complete-1182x749.png`](./evidence/motion-rite-complete-1182x749.png)

The prior board orientation is rejected even though its silhouette passed the
earlier art checkpoint. The new controller was browser-tested as one causal
sequence: repeated W input reached 5.4 m/s; repeated S input rotated toward a
crosswise edge-stop and reduced that speed to 0.1 m/s in roughly one-third of a
second; Space produced a visible airborne interval with no snow stamp or board
hiss; E remained the only manual Ice Pulse input. The 15-second deterministic
route still activated all three sigils and emitted no WebGPU or audio errors.

The running shader now uses one board-yaw value for mesh orientation, pointed
elliptical contact shadow, base/edge pressure, and persistent deformation. This
closes the basic direction/contact inconsistency. It does not claim a rigid-body
snowboard simulator: terrain slope does not yet contribute gravity, and the
compact procedural rider still has no production skeletal rig.

The first corrected capture was also rejected because an axis-aligned chase
camera compressed the real sideways stance into a narrow silhouette. The
retained three-quarter default camera leaves the physics unchanged while making
the board nose, crosswise brake, and upper-body counter-rotation legible. The
four interaction captures above are unmodified viewport screenshots from the
running WebGPU build; the complete route ended at `Veil stabilized` with no
browser warning, AudioContext error, or WebGPU validation error.

### 2026-08-14 — terrain-coupled ride and airborne attachment correction

Evidence:

- no-input downhill coast at 1.2 m/s: [`evidence/slope-natural-coast-1182x749.png`](./evidence/slope-natural-coast-1182x749.png)
- ten-input uphill result at 3.1 m/s: [`evidence/slope-uphill-1182x749.png`](./evidence/slope-uphill-1182x749.png)
- identical ten-input downhill result at 5.1 m/s: [`evidence/slope-downhill-1182x749.png`](./evidence/slope-downhill-1182x749.png)
- rejected detached-glove frame: [`evidence/slope-jump-glove-defect-1182x749.png`](./evidence/slope-jump-glove-defect-1182x749.png)
- retained slope takeoff at 5.3 m/s: [`evidence/slope-jump-1182x749.png`](./evidence/slope-jump-1182x749.png)
- full route after terrain coupling: [`evidence/slope-rite-complete-1182x749.png`](./evidence/slope-rite-complete-1182x749.png)

The paired uphill/downhill captures start from the same authored point and use
the same ten W pulses. Their 3.1 versus 5.1 m/s result proves that direction on
the snow grade now changes acceleration rather than merely changing pose. The
no-input frame records 1.2 m/s natural coast. The board and rider follow the
smoothed rendered grade, while the airborne frame retains its takeoff grade and
preserves a visible board-to-snow gap.

The first jump frame exposed a detached black glove next to the helmet. That
frame is deliberately retained as rejected evidence. In the accepted frame the
glove, cuff, arm, and glowing focus remain connected after the glove receives an
independent transform part. The deterministic route still reaches `Veil
stabilized`; browser logs contain no warning, AudioContext error, or WebGPU
validation error. This is a terrain-coupling checkpoint, not a claim of a full
rigid-body or avalanche simulation.

### 2026-08-14 — continuous contact-history and native-shadow checkpoint

Evidence:

- same-session 1440p baseline: [`evidence/performance-snow-history-before-2560x1440.png`](./evidence/performance-snow-history-before-2560x1440.png)
- scheduling-only 1440p intermediate: [`evidence/performance-snow-history-after-2560x1440.png`](./evidence/performance-snow-history-after-2560x1440.png)
- retained vertex-shadow 1440p frame: [`evidence/performance-vertex-shadow-after-2560x1440.png`](./evidence/performance-vertex-shadow-after-2560x1440.png)
- rejected low-frequency active track: [`evidence/performance-vertex-shadow-motion-1182x749.png`](./evidence/performance-vertex-shadow-motion-1182x749.png)
- retained swept-contact track: [`evidence/performance-snow-history-motion-1182x749.png`](./evidence/performance-snow-history-motion-1182x749.png)
- complete post-change route: [`evidence/performance-vertex-shadow-rite-1182x749.png`](./evidence/performance-vertex-shadow-rite-1182x749.png)

The low-frequency experiment is deliberately retained as a failed visual test:
individual elongated stamps remain recognizable along a fast curve. The accepted
compute path instead sweeps the pointed contact ellipse between consecutive
grounded positions. It keeps the narrow engaged-edge groove, displaced ridge,
and curved travel history continuous without restoring the earlier broad trench.

The terrain-shadow move retains the existing six height samples and near-field
fade, but evaluates them on the already dense terrain mesh. Pixel comparison is
well below one percent and the default composition retains its snow relief,
low-sun modelling, atmospheric depth, and character contact. The complete route
still reaches `Veil stabilized`; browser logs contain no warning, AudioContext
error, WGSL compile error, or WebGPU validation error.

### 2026-08-14 — causal jump arc and landing-impact checkpoint

Evidence:

- velocity-shaped airborne pose: [`evidence/motion-jump-arc-1182x749.png`](./evidence/motion-jump-arc-1182x749.png)
- first grounded impact frame: [`evidence/motion-landing-impact-1182x749.png`](./evidence/motion-landing-impact-1182x749.png)
- complete route after the animation change: [`evidence/motion-landing-rite-complete-1182x749.png`](./evidence/motion-landing-rite-complete-1182x749.png)

The earlier jump proved a board-to-snow gap but used one height-driven crouch for
the entire flight. The retained pair comes from one real 4.5–6.0 m/s input
sequence. Signed vertical velocity changes the board/body attitude between
takeoff and descent. On the first grounded frame the boots stay with the blade,
the knees and torso absorb impact, and a short low snow burst appears beside the
contact area; it is absent from the airborne frame.

Five consecutive frames around touchdown were inspected to reject a persistent
or floating spray. The burst is visible only at initial contact and decays with
the same tested compression envelope. The deterministic route still reaches
`Veil stabilized`, and browser logs contain no audio, WGSL, WebGPU validation,
or uncaptured-device error. This closes the rigid vertical-translation defect;
it remains a compact procedural part rig rather than a production motion-capture
or skeletal-animation claim.

### 2026-08-14 — responsive touch-control checkpoint

Evidence:

- unobstructed mobile idle composition: [`evidence/mobile-controls-idle-480x659.png`](./evidence/mobile-controls-idle-480x659.png)
- touch-driven ride and carve: [`evidence/mobile-controls-ride-480x659.png`](./evidence/mobile-controls-ride-480x659.png)
- moving touch Jump: [`evidence/mobile-controls-jump-480x659.png`](./evidence/mobile-controls-jump-480x659.png)
- touch Ice Pulse and residue: [`evidence/mobile-controls-pulse-480x659.png`](./evidence/mobile-controls-pulse-480x659.png)
- desktop 3/3 regression: [`evidence/mobile-controls-desktop-rite-1182x749.png`](./evidence/mobile-controls-desktop-rite-1182x749.png)

The 480×659 inspection keeps brand, ritual objective, rider, horizon, speed/FPS,
and both control clusters readable without a full-screen opaque HUD. Buttons
remain outside the primary rider silhouette and use the existing ice/glass
palette. The footer removes keyboard instructions at narrow widths while keeping
live speed and performance evidence above the controls.

Actual pointer events drove the shared controller to 4.5 m/s, produced a visible
airborne gap through Jump, and produced the existing Ice Pulse crater/residue.
The warmed mobile captures report 60 FPS. At 1182×749 the controls are visually
absent and the deterministic route still reaches `Veil stabilized` at 60 FPS.
Browser logs contain no WGSL, WebGPU, audio, or uncaptured-device error.

### 2026-08-14 — board-readable causality v2 checkpoint

Evidence:

- nose-first 6.5 m/s ride and continuous narrow wake: [`evidence/snowboard-causality-v2-ride-720x850.png`](./evidence/snowboard-causality-v2-ride-720x850.png)
- moving crosswise edge brake at 1.2 m/s: [`evidence/snowboard-causality-v2-brake-720x850.png`](./evidence/snowboard-causality-v2-brake-720x850.png)
- real Jump/Space airborne frame at 6.5 m/s: [`evidence/snowboard-causality-v2-jump-720x850.png`](./evidence/snowboard-causality-v2-jump-720x850.png)

The v1 state is rejected as insufficiently legible even though its CPU numbers
were directionally correct. In the retained ride frame the board axis and the
track point to the same destination, the longer lifted nose is distinguishable,
and the upper body and head open toward travel while the boots remain across the
board. The camera now follows heading instead of becoming an unrelated world-
space orbit after a turn.

The brake frame was captured while the rider still reports 1.2 m/s. The blade is
already crosswise and on edge; the input no longer removes speed independently
of that pose. The jump frame comes from the actual shared Jump/Space control at
6.5 m/s, shows a clear board-to-snow gap, and leaves no stamp through the air.
The three warmed 720×850 captures report 57–66 FPS with live touch controls and
unobstructed speed/performance telemetry.

Focused motion tests now assert the travel/board dot product, the 90-degree
brake relationship, a greater-than-4.5:1 flat contact aspect ratio, less than
30% edge-contact width/area, skid-derived drag, slope response, and landing
decay. This remains a compact procedural rig rather than a claim of full
biomechanical motion capture or a rigid-body snow solver.

### 2026-08-14 — regional snow-history performance checkpoint

Evidence:

- fixed-canvas idle baseline: [`evidence/performance-native-baseline-2560x1440.png`](./evidence/performance-native-baseline-2560x1440.png)
- native active before/after: [`evidence/performance-native-active-before-2560x1440.png`](./evidence/performance-native-active-before-2560x1440.png) and [`evidence/performance-native-active-after-2560x1440.png`](./evidence/performance-native-active-after-2560x1440.png)
- native completion before/after: [`evidence/performance-native-complete-before-2560x1440.png`](./evidence/performance-native-complete-before-2560x1440.png) and [`evidence/performance-native-complete-after-2560x1440.png`](./evidence/performance-native-complete-after-2560x1440.png)
- interactive continuous track: [`evidence/performance-regional-history-track-1182x749.png`](./evidence/performance-regional-history-track-1182x749.png)
- interactive completed rite: [`evidence/performance-regional-history-rite-1182x749.png`](./evidence/performance-regional-history-rite-1182x749.png)

The active before/after pair is an actual 2560×1440 canvas and retains the same
terrain, lighting, rider, sigils, particles, and HDR path. A later audit found
that its browser viewport was smaller, so it proves the relative snow-history
change but not a complete visible-native display chain. The visible board wake
remains narrow and joined rather than breaking into the scalloped ovals seen in
the rejected low-frequency experiment. Ice Pulse craters and blue residue remain
present through the complete three-sigil route; decay is visually continuous
between the one-second global history sweeps.

This pass closes the previously dominant per-frame full-history compute cost for
active riding. It does not close every release boundary: the fixed-native
completion frame is still 46 FPS with P95 spikes, and the character remains a
compact procedural part rig rather than a production skeletal animation system.
Those limits remain explicit rather than being hidden behind the 60 FPS active
route capture.

### 2026-08-14 — visible-1440p adaptive release checkpoint

Telemetry captures:

- native-target idle baseline telemetry: [`evidence/performance-visible-native-idle-before-2560x1440.png`](./evidence/performance-visible-native-idle-before-2560x1440.png)
- retained native-target idle telemetry: [`evidence/performance-visible-native-idle-after-2560x1440.png`](./evidence/performance-visible-native-idle-after-2560x1440.png)
- original native-target route telemetry: [`evidence/performance-visible-native-route-before-2560x1440.png`](./evidence/performance-visible-native-route-before-2560x1440.png)
- retained 288² native-target telemetry: [`evidence/performance-visible-native-route-full-2560x1440.png`](./evidence/performance-visible-native-route-full-2560x1440.png)
- automatic release telemetry: [`evidence/performance-visible-release-route-2560x1440.png`](./evidence/performance-visible-release-route-2560x1440.png)
- full-resolution interactive track: [`evidence/performance-adaptive-track-1182x749.png`](./evidence/performance-adaptive-track-1182x749.png)

For this checkpoint browser telemetry recorded `innerWidth`, `innerHeight`, CSS
canvas size, render-target size, and DPR at 2560×1440. A later capture audit found
that the app browser exports full-page pixels at a separate 2× host scale: these
older files have exact 2560×1440 dimensions but contain only the top-left half of
the CSS page. Their HUD numbers remain performance records, but they are no
longer accepted as complete-frame composition evidence. Full-native idle
improves from 44 to 51 FPS, and the completed route improves from 44 to 47 FPS at
100%. The default controller therefore settles at a disclosed 84% canvas scale
and returns to 60 FPS.

At 1182×749 the route remains at 100% and the close 6.6 m/s frame preserves the
asymmetric board, narrow continuous wake, wind ridges, particle depth, and rider
silhouette at 60 FPS. Browser diagnostics contain no WGSL compilation, WebGPU
validation, audio, or uncaptured-device error. Production skeletal animation is
still an open art boundary; the display-performance boundary is now both usable
and honestly measurable.

### 2026-08-14 — articulated rider and calibrated 1440p capture checkpoint

Evidence:

- moving before/after: [`evidence/rider-articulation-before-1182x749.png`](./evidence/rider-articulation-before-1182x749.png) and [`evidence/rider-articulation-after-1182x749.png`](./evidence/rider-articulation-after-1182x749.png)
- close/middle/far: [`evidence/rider-articulation-close-1182x749.png`](./evidence/rider-articulation-close-1182x749.png), [`evidence/rider-articulation-carve-1182x749.png`](./evidence/rider-articulation-carve-1182x749.png), and [`evidence/rider-articulation-far-1182x749.png`](./evidence/rider-articulation-far-1182x749.png)
- real Jump/landing pair: [`evidence/rider-articulation-jump-1182x749.png`](./evidence/rider-articulation-jump-1182x749.png) and [`evidence/rider-articulation-landing-1182x749.png`](./evidence/rider-articulation-landing-1182x749.png)
- complete-frame 2560×1440 target while moving: [`evidence/rider-articulation-native-2560x1440.png`](./evidence/rider-articulation-native-2560x1440.png)
- complete-frame 2560×1440 target after the rite: [`evidence/rider-articulation-native-complete-2560x1440.png`](./evidence/rider-articulation-native-complete-2560x1440.png)

The retained geometry reduces the oversized hood and pear-shaped hem, opens two
stance vents, separates boots from lower legs, and adds distinct knee guards,
upper arms, forearms, and cuffs. The player vertex stage now bends upper and
lower legs around connected hip/ankle pivots with different front/rear edge
loads. Forearms inherit elbow motion and then shoulder counterbalance; the
previous shared torso deformation no longer rotates the belt and cape trim about
the head. This remains an original compact part hierarchy, with no imported
mesh, skeleton, animation, image, or motion data.

The same-size moving pair shows more leg clearance, a smaller head, a narrower
coat, and two readable loaded knees. The close carve confirms that cuffs stay on
the forearms and guards bridge the leg segments; the far frame keeps the cape,
raised casting arm, separated legs, and asymmetric board readable. Actual shared
W/A/D and Space input produced the 5.4 m/s carve, airborne frame, and first
landing response. The 1182×749 checks remain at 60 FPS and browser diagnostics
contain no WGSL, WebGPU, audio, or uncaptured-device error.

The earlier forced 2560×1440 clip method was rejected because the app browser's
host export scale cropped the page despite producing a correctly sized PNG. The
new `?capture` path fixes the CSS page at 1280×720 and allocates a true
2560×1440 WebGPU canvas. Its 2× full-page export therefore covers the entire
16:9 scene. The moving target reports 48 FPS and the completed target 46 FPS at
100% RES, consistent with the documented fixed-native boundary. Production
facial performance, authored clip transitions, and a conventional deforming
skin skeleton remain outside this checkpoint.

### 2026-08-14 — authored rider state-transition checkpoint

Evidence:

- forward ride: [`evidence/rider-transition-ride-1182x749.png`](./evidence/rider-transition-ride-1182x749.png)
- moving edge brake: [`evidence/rider-transition-brake-1182x749.png`](./evidence/rider-transition-brake-1182x749.png)
- real Space jump: [`evidence/rider-transition-air-1182x749.png`](./evidence/rider-transition-air-1182x749.png)
- first landing absorption: [`evidence/rider-transition-land-1182x749.png`](./evidence/rider-transition-land-1182x749.png)
- complete-frame native target: [`evidence/rider-transition-native-2560x1440.png`](./evidence/rider-transition-native-2560x1440.png)

The retained motion controller classifies each physical frame with the strict
priority `air > land > brake > ride > idle`. One-hot targets pass through
exponential envelopes at state-specific rates, so the shader receives authored
transitions rather than abrupt pose switches. These weights only drive the
existing procedural hip, knee, shoulder, and elbow hierarchy: they do not alter
velocity, board heading, contact stamps, jump height, or collision state.

Actual shared keyboard input records the ride at 5.3 m/s, the moving brake at
1.9 m/s, the airborne pose at 5.5 m/s, and the first landing response at 4.6
m/s. All four 1182×749 frames report 60 FPS, 100% render scale, and clean
browser diagnostics. The calibrated 2560×1440 target records 7.1 m/s at 45 FPS,
P95 34.3 ms, 1% low 12, and 100% RES; it is retained as a truthful fixed-native
limit rather than presented as a 60 FPS result.

This closes the earlier lack of authored pose transitions for the compact
procedural rider. A conventional skinned production skeleton and facial
performance remain outside the current art boundary.

### 2026-08-14 — athletic action-silhouette checkpoint

Evidence:

- relaxed idle: [`evidence/rider-action-idle-1182x749.png`](./evidence/rider-action-idle-1182x749.png)
- normal ride: [`evidence/rider-action-ride-1182x749.png`](./evidence/rider-action-ride-1182x749.png)
- moving brake: [`evidence/rider-action-brake-1182x749.png`](./evidence/rider-action-brake-1182x749.png)
- real Space jump: [`evidence/rider-action-air-1182x749.png`](./evidence/rider-action-air-1182x749.png)
- real E cast: [`evidence/rider-action-cast-1182x749.png`](./evidence/rider-action-cast-1182x749.png)
- landing inspection: [`evidence/rider-action-land-1182x749.png`](./evidence/rider-action-land-1182x749.png)
- complete-frame native target: [`evidence/rider-action-native-2560x1440.png`](./evidence/rider-action-native-2560x1440.png)

The prior ride frame is rejected as a final action silhouette because the base
right forearm remained raised when no spell existed and the high-speed knee load
still read too close to standing. The retained shader lowers that arm at idle,
opens asymmetric balance arms only in athletic states, and restores the raised
casting arm only while the real Ice Pulse envelope is active. Ride, brake, air,
and land now add progressively stronger knee loading without changing the
physical controller or separating either boot from the board in close review.

Actual W, S, Space, and E input produced every 1182×749 frame. The ride, moving
brake, airborne, cast, and landing inspections remain at 60 FPS and 100% render
scale with no browser error. The calibrated native frame shades a true
2560×1440 target; after the route completes and its measurement window warms,
the same path reports 44 FPS, P95 33.5 ms, 1% low 30, and 100% RES. The compact
procedural character is more physically credible, but a conventional deforming
skin rig and detailed hands/facial performance remain outside this checkpoint.

### 2026-08-14 — chase-camera obstruction checkpoint

Before: [`evidence/rider-action-native-2560x1440.png`](./evidence/rider-action-native-2560x1440.png)

After: [`evidence/camera-occlusion-after-2560x1440.png`](./evidence/camera-occlusion-after-2560x1440.png)

The before frame records the real deterministic route immediately after the
first sigil. Its activated crystal, ring, fins, and plinth occupy the centre
foreground and obscure the snow path around the rider. The object is valid world
geometry, but letting it become an opaque camera obstruction fails a polished
third-person composition.

The retained frame uses the same route, camera logic, player controller, beacon
world positions, materials, and true 2560×1440 WebGPU target. A world-space
camera-to-rider corridor fades the near beacon while the two distant beacons
remain solid and readable. The rider, board, contact shadow, track, and
surrounding snow now stay visible through the obstruction. Browser diagnostics
report no WGSL, WebGPU, or uncaptured-device error.

At the normal review viewport the full three-sigil route remains at 60 FPS,
100% RES. The completed calibrated target stabilizes at 47 FPS, P95 33.8 ms,
1% low 20, and 100% RES. This passes the camera-obstruction checkpoint without
claiming fixed-native 60 FPS.

### 2026-08-14 — rider helmet and glove construction checkpoint

Evidence:

- before: [`evidence/rider-detail-before-1182x749.png`](./evidence/rider-detail-before-1182x749.png)
- close front after: [`evidence/rider-detail-after-1182x749.png`](./evidence/rider-detail-after-1182x749.png)
- moving hierarchy: [`evidence/rider-detail-ride-1182x749.png`](./evidence/rider-detail-ride-1182x749.png)
- live casting hand: [`evidence/rider-detail-cast-1182x749.png`](./evidence/rider-detail-cast-1182x749.png)
- complete-frame native target: [`evidence/rider-detail-native-2560x1440.png`](./evidence/rider-detail-native-2560x1440.png)

The before frame shows the prior single dark visor and featureless glove ends at
the closest available orbit. The retained close frame separates left and right
cold-glass optics inside a narrower raised frame, adds a bridge, side hinges,
mask plane and vents, and gives each hand a thumb plus raised back plate. The
new 2.8-metre wheel limit exposes these forms without clipping the hood, board,
or feet and remains an ordinary perspective camera, not a separate render.

Real W input at 5.4 m/s confirms that lens, mask, thumb, and hand plate groups
stay attached while head look, elbow balance, shoulder counterbalance, and
terrain stance all move. Real E input restores strong emission only at the
small casting core while the projectile, crater, and post wave are visible.
All 1182×749 close checks report 60 FPS and 100% RES; browser diagnostics are
clean.

The calibrated active frame shades a true 2560×1440 target at 47 FPS, P95 33.7
ms, 1% low 21, and 100% RES. The warmed completed route reports 46 FPS, P95
33.5 ms, 1% low 29, and 100% RES. Detailed hands and optics are improved, but
the compact procedural character remains below a conventional production skin
rig or facial-animation system.

### 2026-08-14 — visible snowboard causality checkpoint

Evidence:

- nose-led carve: [`evidence/snowboard-causality-carve-1182x749.png`](./evidence/snowboard-causality-carve-1182x749.png)
- crosswise deceleration: [`evidence/snowboard-causality-brake-1182x749.png`](./evidence/snowboard-causality-brake-1182x749.png)
- real Space jump: [`evidence/snowboard-causality-jump-1182x749.png`](./evidence/snowboard-causality-jump-1182x749.png)
- tapered contact inspection: [`evidence/snowboard-contact-taper-1182x749.png`](./evidence/snowboard-contact-taper-1182x749.png)
- completed route and track: [`evidence/snowboard-causality-route-1182x749.png`](./evidence/snowboard-causality-route-1182x749.png)

Actual keyboard input produced all action frames. Normal motion shows the
asymmetric raised nose leading the path while the upper body and head look into
travel. S then turns the long axis across the existing velocity and derives
deceleration from the measured skid angle; it no longer treats the brake key as
invisible drag. The close top inspection verifies that the contact narrows
toward both tips and toward the loaded edge. Space creates a visible snow gap
and reports `AIR 0.6 m` during the measured frame before the existing impact
response handles landing.

The full automated route still completes all three sigils at 60 FPS, P95 17.7
ms, and 100% RES. Browser diagnostics contain no WGSL, WebGPU, or uncaptured-
device error. Eighteen tests cover board alignment, skid, turn coupling, contact
taper, Space-to-vertical-velocity mapping, pose state, rendering, and geometry.

### 2026-08-14 — edge-responsive powder and scrape checkpoint

Evidence:

- restrained straight baseline: [`evidence/powder-response-straight-1182x749.png`](./evidence/powder-response-straight-1182x749.png)
- loaded carve plume: [`evidence/powder-response-grounded-carve-1182x749.png`](./evidence/powder-response-grounded-carve-1182x749.png)
- moving crosswise brake: [`evidence/powder-response-memory-brake-1182x749.png`](./evidence/powder-response-memory-brake-1182x749.png)
- airborne cutoff: [`evidence/powder-response-airborne-cutoff-1182x749.png`](./evidence/powder-response-airborne-cutoff-1182x749.png)
- completed route: [`evidence/powder-response-route-1182x749.png`](./evidence/powder-response-route-1182x749.png)

The straight frame keeps only a restrained wake. At 6.2 m/s the carve frame
shows a low cold-blue plume spreading from the loaded side rather than a generic
screen-centred particle halo. The brake frame remains in motion at 4.5 m/s and
retains the transferred powder energy after the long axis crosses travel. Space
then produces a 0.6 m visible gap with no cloud attached to the airborne rider.

The first 24-fleck candidate was rejected after a four-FPS large-view
regression. The retained twelve-fleck version returns that view to 46 FPS and
keeps the normal interaction and completed three-sigil route at 60 FPS, 100%
RES. With audio explicitly enabled, ride, carve, and brake exercise the separate
procedural edge band without an AudioContext or browser error. Diagnostics are
also free of WGSL, WebGPU validation, and uncaptured-device errors.

This passes the dynamic snow-response checkpoint. It remains a controlled
screen-space near-rider plume, not a world-particle fluid simulation; persistent
world snow displacement continues to come from the separate 1536² history.

### 2026-08-14 — relative-airflow cloth checkpoint

Evidence:

- loaded ride and carve: [`evidence/cloth-airflow-ride-1182x749.png`](./evidence/cloth-airflow-ride-1182x749.png)
- stopped-tail inertia: [`evidence/cloth-inertia-brake-1182x749.png`](./evidence/cloth-inertia-brake-1182x749.png)
- completed route: [`evidence/cloth-route-complete-1182x749.png`](./evidence/cloth-route-complete-1182x749.png)
- complete target downsample: [`evidence/cloth-airflow-target-1280x720.png`](./evidence/cloth-airflow-target-1280x720.png)

The ride frame comes from real W+D input at 5.6 m/s. The scarf opens along the
relative airflow while the cape carries a separate, shorter response down its
four-link span. After four real S inputs stop the rider, the second frame keeps
the free end extended instead of snapping immediately to an idle sine phase.
The dark edge remains joined because it now has its own transform id rather than
sharing the static belt and chest-harness group.

The normal interaction and completed three-sigil route remain at 60 FPS and
100% RES. A manual carve on the true 2560×1440 WebGPU target reports 48 FPS,
P95 33.5 ms, and 100% RES; a large visible host view reports 47 FPS. The current
browser export downscales the complete calibrated page to 1280×720, so that file
is labelled at its real exported dimensions and is not used as a native 1440p
still. Browser diagnostics contain no audio, WGSL, WebGPU validation, or
uncaptured-device error, and twenty tests cover the bounded cloth integrator,
geometry attachment, shader routing, movement, contact, audio, and rendering.

This closes the looping-cloth defect without claiming a full finite-element
fabric solver. The rider remains a compact procedural hierarchy rather than a
conventional skinned production character or facial-animation system.

### 2026-08-15 — world-space spindrift checkpoint

Evidence:

- active route and terrain depth: [`evidence/spindrift-final-1182x749.jpg`](./evidence/spindrift-final-1182x749.jpg)
- alternate orbit inspection: [`evidence/world-spindrift-orbit-1182x749.jpg`](./evidence/world-spindrift-orbit-1182x749.jpg)
- complete calibrated target export: [`evidence/spindrift-final-target-1280x720.jpg`](./evidence/spindrift-final-target-1280x720.jpg)

The first implementation failed the visual gate because it was almost
imperceptible. Raising density and shortening every ribbon produced an evenly
spaced scratch pattern and was also rejected. The retained field is sparser,
longer, softer, and concentrated in the lowest 1.45 metres above the rendered
snow. It follows the fixed katabatic wind without sharing a screen-space phase.
Camera orbit changes its overlap, while the depth buffer removes particles
behind the rider, beacons, dune crests, and displaced track lips.

At 1182×749 the active route reports 58 FPS, P95 17.7 ms, and 100% RES. The
single-tab calibrated stress path reports 39 FPS, P95 34.1 ms, 1% low 29, and
100% RES while a read-only inspection confirms the 2560×1440 WebGPU backing
target. The exporter returns a complete 1280×720 JPEG, so the evidence file is
labelled at that real exported size rather than presented as a native still.
Diagnostics from the final audit contain no warning, WGSL, WebGPU validation,
or device error. Twenty-two tests cover placement, depth/render topology,
terrain/deformation parity, snowboard causality, jumping, cloth, audio, and the
rest of the playable route.

This passes the requested spatial-weather quality gate without claiming a
volumetric fluid solver. The existing full-screen atmosphere still supplies
very distant snowfall; the new near/mid field supplies real world position,
terrain attachment, parallax, and occlusion.
