# Performance record

## 2026-08-13 — visual study 001

Environment: Chrome desktop, native WebGPU, browser viewport approximately
1180×740 CSS pixels. The renderer dynamically keeps internal resolution between
78% and 100% of the CSS viewport when sustained frame rate is below target.

| Renderer | Observed rate | Result |
| --- | ---: | --- |
| full-frame ray-marched terrain | 5–24 FPS | rejected; grazing-ray artefacts and insufficient frame rate |
| 384×384 raster terrain, atmosphere, terrain shadows | 51–60 FPS | accepted as architecture baseline |
| raster terrain plus foreground snow and stronger near-field detail | 40–56 FPS | active optimisation target |
| 16-bit HDR scene, eight-tap bloom resolve, ACES tone map | 47–51 FPS | accepted visual baseline; approximately 49 FPS in the review frame |
| rider, 512² persistent snow compute, locally dense terrain | 44–54 FPS | accepted interaction baseline; 44 FPS during automated curved-track capture |
| speed snow, Ice Pulse deformation and residual light | 40–45 FPS | 40 FPS during cast, 43 FPS during automated 5.4 m/s ride |

The figures are visual-development observations rather than a cross-device
benchmark. Before a release gate, the overlay will report frame time, median,
95th percentile, and 1% low instead of only rounded FPS.

The active HUD now reports rolling FPS, P95 frame time, and 1% low. A warmed
1180×740 Chrome review measured approximately 48 FPS, P95 33.7 ms, and 1% low
29 FPS. The fixed 2560×1440 evidence mode intentionally disables dynamic
resolution and measured 16 FPS, P95 82.4 ms, and 1% low 10 FPS; it is a still
capture path, not the current interactive performance target.

## 2026-08-14 — rider rebuild review

Environment: Chrome desktop with native WebGPU. Interactive captures used an
approximately 1182×749 CSS-pixel viewport with dynamic resolution enabled.
Evidence captures used the fixed 2560×1440 path and full-page capture so the
browser automation viewport could not crop the right side of the frame.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| warmed idle, interactive viewport | 54 FPS · P95 33.9 ms · 1% 29 | retained baseline |
| curved ride with persistent track | 42 FPS · P95 33.8 ms · 1% 20 | accepted for iteration; below release target |
| ride plus Ice Pulse capture | 41 FPS · P95 33.7 ms · 1% 20 | effect remains interactive; below release target |
| fixed 2560×1440 middle frame | 18 FPS · P95 100.0 ms · 1% 10 | still-evidence path only |
| fixed 2560×1440 close/far review | 16–19 FPS · P95 about 100 ms · 1% 10 | still-evidence path only |

The rebuilt rider adds only a small number of procedural vertices. The measured
movement range remains comparable with the previous Ice Pulse baseline; the
largest frame cost is still the terrain, persistent snow compute, HDR resolve,
and full-resolution evidence target. The interactive 1% low of 20 is not a
release pass and remains an optimisation requirement.

## 2026-08-14 — track-stability review

This pass raises snow history to 768², concentrates the unchanged 352² terrain
grid around the rider, and adds derivative-based material antialiasing. Values
below are HUD observations from warmed native-WebGPU Chrome runs.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| warmed idle, 1182×749 interactive viewport | 53 FPS · P95 33.4 ms · 1% 29 | retained |
| ride with widened persistent track | 52 FPS · P95 33.8 ms · 1% 29 | retained; no rider-checkpoint regression |
| fixed 2560×1440 horizon evidence | 16–19 FPS · P95 about 100 ms · 1% 10 | still-evidence path only |

The 768² compute pass updates 2.25 times as many snow-history texels as 512²,
but the retained interactive run remains near the warmed idle rate. The fixed
1440p path still is not a release-performance pass; it deliberately disables
dynamic resolution so evidence frames can be compared pixel-for-pixel.

## 2026-08-14 — rider motion and material review

Environment: active Chrome desktop tab, native WebGPU, 1182×749 CSS pixels,
dynamic resolution enabled, `?demo` curved ride at 5.4 m/s, camera distance 4.2.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| close curved ride, frame A | 60 FPS · P95 17.5 ms · 1% 56 | retained |
| close curved ride, frame B | 59 FPS · P95 17.5 ms · 1% 57 | retained |

The procedural banking, compression, secondary cloth motion, and antialiased
weave do not introduce a measurable regression in the retained active-tab run.
An unfocused automation window initially reported 14–16 FPS with 100 ms P95;
interacting with the same tab immediately restored 59–60 FPS. Those throttled
figures are recorded here as a measurement caveat, not treated as GPU cost.

## 2026-08-14 — rider equipment and full-orbit review

Environment: native WebGPU Chrome. Interactive inspection used 1182×749 CSS
pixels with dynamic resolution. Evidence inspection used the fixed 2560×1440
path. Values are HUD observations after the tab was active and warmed.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| sustained 5.4 m/s carve after equipment rebuild | 59 FPS · P95 32.6 ms · 1% 29 | retained |
| stationary 180° orbit after ridge fix | 53 FPS · P95 33.2 ms · 1% 30 | retained |
| fixed 2560×1440 final landscape | 17–20 FPS · P95 about 100 ms · 1% 10 | still-evidence path only |

The gridded cape, shoulder shells, visor, cuffs, and harness are a small fraction
of terrain cost. A rejected 230-metre terrain-warp experiment appeared around
40 FPS during its short review, but the same session showed 59 FPS after warmup;
the experiment is not used and the project retains the previously profiled
86-metre terrain grid. Fixed 1440p remains evidence-only.

## 2026-08-14 — Frost Rite route review

Environment: native WebGPU Chrome. The deterministic `?demo` route uses the
same movement integration and Ice Pulse activation test as manual play, visits
all three instanced beacons, and stops after the third activation.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| route at 2 / 3, 1182×749 | 40 FPS · P95 34.5 ms · 1% 28 | retained functional midpoint |
| completed route after warmup, 1182×749 | 56 FPS · P95 33.3 ms · 1% 29 | retained interactive checkpoint |
| completed route, fixed 2560×1440 | 18 FPS · P95 100.0 ms · 1% 10 | still-evidence path only |

The beacon mesh is rendered as three instances in one draw and the terrain
evaluates three compact analytic sigils only after activation. The completed
interactive rate remains inside the earlier warmed range. Fixed 1440p remains a
quality-comparison target, not a release-performance pass.

## 2026-08-14 — procedural audio and finale review

Environment: native WebGPU Chrome. Audio was explicitly enabled before the
deterministic route so wind, speed hiss, each Ice Pulse, beacon drones, and the
final chord were all live during measurement.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| route at 2 / 3 with audio, 1182×749 | 51 FPS · P95 33.2 ms · 1% 29 | retained |
| exact completion beat with audio, 1182×749 | 53 FPS · P95 33.3 ms · 1% 30 | retained |
| exact completion beat, fixed 2560×1440 | 16 FPS · P95 82.5 ms · 1% 10 | still-evidence path only |

The browser exposed no AudioContext or WebGPU error. Web Audio work does not
create a visible interactive regression; fixed 1440p remains evidence-only.

## 2026-08-14 — native 1440p shadow-cost review

Environment: native WebGPU Chrome, fixed 2560×1440 evidence mode. Before and
after idle captures use the same camera, world state, HDR resolve, and UI.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| ten-step shadows, fixed idle | 17–18 FPS · P95 67.6 ms · 1% 10 | baseline |
| six-step fog-aligned shadows, fixed idle | 26 FPS · P95 50.5 ms · 1% 12 | retained; about 44% FPS gain |
| ten-step shadows, exact rite completion | 16 FPS · P95 82.5 ms · 1% 10 | baseline |
| six-step shadows, full rite completion | 22 FPS · P95 50.8 ms · 1% 10 | retained; 37.5% FPS gain |
| retained shader, completed 1182×749 route | 60 FPS · P95 17.4 ms · 1% 57 | retained |

Raw-image comparison of the fixed idle pair reports 0.241% mean absolute
8-bit-channel difference and 0.583% of channels differing by more than eight
levels. Those figures include independently timed particles and post-process
grain. A four-step shadow test and a four-tap bloom resolve were both rejected:
their small or absent gain did not justify the visual or sampling reduction.

This materially improves the native evidence path but does not declare fixed
1440p release-ready; 22–26 FPS remains below the release target.

## 2026-08-14 — snowboard-causality interaction review

Environment: active in-app Chromium tab with native WebGPU, 1182×749 CSS pixels,
dynamic resolution enabled. Each row is a real keyboard-driven state captured
after the three-quarter chase-camera correction.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| nose-first glide at 4.6 m/s | 51 FPS · P95 33.4 ms · 1% 29 | retained |
| sustained carve at 4.9 m/s | 44 FPS · P95 33.9 ms · 1% 29 | retained; capture overhead present |
| crosswise brake at 1.0 m/s | 44 FPS · P95 33.8 ms · 1% 29 | retained |
| moving Space jump at 4.3 m/s | 45 FPS · P95 33.6 ms · 1% 29 | retained |
| completed deterministic route | 45 FPS · P95 33.9 ms · 1% 29 | retained functional regression |

The controller and camera pass adds no render pipeline or texture allocation.
The lower figures occurred while browser automation was actively taking PNG
captures and remain inside the earlier interaction range; they are not presented
as a 60 FPS release pass. The full route completed all three sigils and the
browser log contained no warning or WebGPU error.

## 2026-08-14 — terrain-coupled motion review

Environment: active in-app Chromium tab with native WebGPU, 1182×749 CSS pixels,
dynamic resolution enabled. Fixed review used the existing 2560×1440 evidence
path. The CPU performs one smoothed five-height surface sample per frame; the GPU
adds two vertex rotations and one terrain uniform vector without changing any
fragment path or texture allocation.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| no-input downhill coast at 1.2 m/s | 40 FPS · P95 50.4 ms · 1% 11 | retained causal proof during capture |
| ten-input uphill pass at 3.1 m/s | 45 FPS · P95 34.2 ms · 1% 20 | retained |
| identical downhill pass at 5.1 m/s | 37 FPS · P95 49.8 ms · 1% 15 | retained causal proof during capture |
| retained downhill jump at 5.3 m/s | 42 FPS · P95 34.3 ms · 1% 10 | retained; capture overhead present |
| completed three-sigil route | 45 FPS · P95 34.0 ms · 1% 29 | retained functional regression |
| fixed 2560×1440 idle | 24 FPS · P95 83.7 ms · 1% 10 | inside prior 22–26 FPS range |

The capture session includes navigation, audio startup, PNG readback, and an
actively sampled browser tab; its individual lows are not a release benchmark.
The fixed 1440p path remains inside its established range, so terrain coupling
does not create a measured native-resolution regression. Release-grade fixed
1440p performance remains open.

## 2026-08-14 — snow-history scheduling and vertex-shadow review

Environment: one active in-app Chromium tab with native WebGPU. Fixed captures
use the same 2560×1440 evidence camera and unchanged HDR/post-process path.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| per-frame history plus fragment terrain shadow, idle | 21 FPS · P95 66.3 ms · 1% 10 | same-session baseline |
| fresh-idle history skip only | 22 FPS · P95 65.7 ms · 1% 10 | retained, but not the main gain |
| six-sample shadow moved to dense terrain vertices | 28 FPS · P95 65.5 ms · 1% 15 | retained steady capture; exploratory capture reached 30 FPS |
| swept active track, 1182×749 | 54 FPS · P95 33.7 ms · 1% 29 | retained during PNG capture |
| airborne no-stamp check, 1182×749 | 60 FPS · P95 17.4 ms · 1% 56 | retained |
| completed three-sigil route, 1182×749 | 60 FPS · P95 33.3 ms · 1% 29 | retained functional capture |

The scheduler does not trade track continuity for idle speed: active board and
spell contact still update every rendered frame. A 15 Hz and then 30 Hz active
update experiment produced visibly scalloped curves and was rejected. Untouched
history alone decays at 30 Hz, while a fresh idle scene dispatches no deformation
compute work.

The fixed baseline-to-retained comparison improves displayed steady FPS by about
33%. Raw-image comparison against the scheduling-only frame reports 0.163% mean
absolute 8-bit-channel difference and 0.154% of channels differing by more than
eight levels. Independently timed particles and post-process grain are included.
Fixed 1440p remains a still-review target rather than a 60 FPS release claim.

## 2026-08-14 — rejected HDR/normal candidates and landing-response cost

Environment: one native-WebGPU in-app Chromium tab. The two native-resolution
candidates were reloaded back-to-back with an actual 2560×1440 canvas.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| `rgba16float` HDR target | 44 FPS · P95 33.7 ms · 1% 29 | retained compatibility path |
| packed `rg11b10ufloat` HDR target | 44 FPS · P95 33.7 ms · 1% 29 | rejected; no measured gain |
| vertex terrain normal baseline | 43 FPS · P95 33.5 ms · 1% 30 | retained |
| fragment-derivative terrain normal | 42 FPS · P95 33.7 ms · 1% 29 | rejected |
| moving jump/landing capture, 1182×749 | 44–50 FPS · P95 33.4–33.9 ms | retained under repeated PNG capture |
| completed route after landing pass, 1182×749 | 51 FPS · P95 33.6 ms · 1% 29 | retained functional capture |

The packed-HDR pair differed by 0.255% mean absolute 8-bit channel value in the
same visible crop and had no pixels differing by more than 16 levels, but equal
frame rate means that small precision trade does not buy performance here. Both
experiments were fully reverted. The retained landing response adds one uniform
vector and evaluates its 24-particle burst only while impact exceeds 0.012; it
does not allocate a new texture, buffer, draw, or compute pass.

## 2026-08-14 — responsive touch-input review

Environment: native WebGPU Chromium. The mobile review used the smallest stable
in-app viewport available in the session, 480×659 CSS pixels. The desktop route
used the established 1182×749 viewport.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| mobile idle with six controls | 60 FPS · P95 17.3 ms · 1% 57 | retained |
| mobile Ride taps reaching 4.5 m/s | 44 FPS · P95 33.5 ms · 1% 20 | active automation/capture |
| mobile moving Jump capture | 60 FPS · P95 33.4 ms · 1% 20 | retained |
| mobile Pulse and snow residue | 60 FPS · P95 17.7 ms · 1% 20 | retained |
| desktop completed route after input change | 60 FPS · P95 17.5 ms · 1% 57 | retained regression |

The control layer adds no render target, GPU buffer, shader branch, draw, or
compute dispatch. Its pointer map and DOM state are idle outside actual input.
The temporary 44 FPS figure occurred during rapid automated pointer dispatch and
PNG capture; the same mobile run returned to 60 FPS for Jump and Pulse evidence.

## 2026-08-14 — board-readable causality v2 review

Environment: native WebGPU Chromium at 720×850 CSS pixels with the responsive
controls active. Screenshots were read back from the running build.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| clean nose-first route ride at 6.5 m/s | 57 FPS · P95 17.7 ms · 1% 19 | retained |
| visible crosswise brake at 1.2 m/s | 60 FPS · P95 17.6 ms · 1% 56 | retained |
| real Jump/Space airborne frame at 6.5 m/s | 66 FPS · P95 17.8 ms · 1% 18 | retained; short sampling-window overshoot |

The camera-follow, asymmetric board nose, torso/head rotation, and changed
ellipse math add no render pass, texture, buffer, or draw call. Braking uses one
small CPU helper over the existing skid state. The above captures are visual QA
readings, not a claim that refresh-rate sampling can sustain above 60 FPS.

## 2026-08-14 — regional snow-history write review

Environment: one active native-WebGPU Chromium tab. These captures verified a
2560×1440 canvas and PNG, but later inspection proved that the browser's visible
viewport was smaller. They remain valid same-session comparisons for the snow-
history implementation, but they are superseded below for full visible-1440p
claims. The deterministic `?demo` route exercised rider contact, Ice Pulse
residue, three sigils, particles, terrain, HDR resolve, and completion.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| fresh fixed-canvas idle | 60 FPS · P95 17.5 ms · 1% 56 | smaller visible viewport; not a full-native claim |
| fixed-canvas active route before, 1/3 at 7.1 m/s | 47 FPS · P95 34.2 ms · 1% 10 | full 768² update per active frame |
| fixed-canvas completed route before | 45 FPS · P95 33.3 ms · 1% 29 | full-history baseline |
| fixed-canvas active route retained, 1/3 at 6.8 m/s | 60 FPS · P95 33.2 ms · 1% 20 | regional active write retained |
| fixed-canvas completed route retained | 46 FPS · P95 33.7 ms · 1% 29 | no visible-native claim |
| 1182×749 active track | 60 FPS · P95 17.7 ms · 1% 29 | continuous-contact inspection |
| 1182×749 completed route | 60 FPS · P95 17.5 ms · 1% 56 | retained functional regression |

The retained path copies the existing 768² history during active contact, then
dispatches only the local 64² rider/spell region: about 0.69% of the previous
compute invocations. A full-texture dispatch runs once per second to apply global
decay. The terrain shader presents that elapsed decay continuously, and a new
spell stamp compensates for the current phase so it never enters already faded.

Full-history sweeps at 30 Hz and 15 Hz improved the native active reading by only
about 2 FPS and were rejected. The retained result improves the comparable
active fixed-canvas reading from 47 to 60 FPS. Because the visible viewport was
not also 2560×1440, these values do not establish full-display native speed.

## 2026-08-14 — 2560×1440 CSS/native-target telemetry review

Environment: one active native-WebGPU Chromium tab with both `window.innerWidth`
and canvas CSS size fixed to 2560×1440 at DPR 1. The HUD now records render scale
alongside FPS, P95, and 1% low. `?evidence` holds 100%; normal play uses the same
renderer and can step between 84% and 100% with tested hysteresis. A later audit
found that the app browser exported the older PNGs at a separate 2× host-pixel
scale, so their telemetry remains valid but their image content is a top-left
crop rather than complete-frame visual evidence.

| Review state | Observed HUD | Result |
| --- | ---: | --- |
| original visible-native idle | 44 FPS · P95 33.6 ms · 1% 29 · 100% | recorded DOM/render-target baseline |
| retained visible-native idle | 51 FPS · P95 33.5 ms · 1% 29 · 100% | two atmospheric plus one foreground snow layer |
| original full-native completed route | 44 FPS · P95 33.7 ms · 1% 29 · 100% | five snow layers and 352² terrain |
| retained full-native completed route | 47 FPS · P95 33.5 ms · 1% 30 · 100% | fixed quality/evidence mode |
| fixed 84% completed route | 60 FPS · P95 17.5 ms · 1% 30 · 84% | deterministic release-floor probe |
| automatic completed route, warmed | 60 FPS · P95 32.7 ms · 1% 30 · 84% | default path; P95 window includes scale transition |
| 1182×749 active track | 60 FPS · P95 17.4 ms · 1% 56 · 100% | no downscale required |

The retained snowfall evaluates two atmospheric depth layers and one weighted
foreground layer instead of five full-screen procedural layers. Flake size,
motion, near/far separation, rider spray, landing powder, and spell particles
remain; the native-target idle telemetry rises from 44 to 51 FPS. The 288² terrain
grid retains about 7.2-centimetre spacing at the rider, below half
the 16.7-centimetre snow-history texel and sufficient for the accepted joined
contact track.

Reducing bloom from eight neighbours to four recovered only 2 FPS and was
rejected. Localising ritual marks, moving material fields to vertices, replacing
micro-noise, suppressing snow-history compute, and reducing the grid below 288²
each recovered 0–4 FPS or stopped scaling; all were reverted. The remaining
100%-native completion cost is therefore documented rather than hidden. Normal
play reaches 60 FPS by lowering the canvas to 2150×1209 inside the 2560×1440 CSS
viewport, with the exact 84% value visible in the HUD.

## 2026-08-14 — calibrated full-frame target capture

The app browser emits two host pixels per CSS pixel for full-page exports even
when the emulated page reports DPR 1. `?capture` therefore fixes the page and
canvas CSS size at 1280×720 while the WebGPU resize path explicitly allocates a
2560×1440 render target. Both are 16:9, the normal camera and shader paths are
unchanged, and the exported 2560×1440 PNG contains the full composition instead
of half of the page.

| Calibrated target state | Observed HUD | Result |
| --- | ---: | --- |
| articulated rider, active route | 48 FPS · P95 34.1 ms · 1% 15 · 100% | complete 2560×1440 frame |
| articulated rider, completed route | 46 FPS · P95 33.6 ms · 1% 29 · 100% | complete 2560×1440 frame |

This path is for visual evidence, not a faster renderer: it still shades all
3,686,400 pixels, and its completion reading remains consistent with the prior
46–47 FPS fixed-native boundary. Normal gameplay continues to use the disclosed
84–100% adaptive controller. The articulated limb hierarchy adds no pass,
texture, buffer, draw call, or imported animation runtime.

## 2026-08-14 — rider pose-transition cost

Four smoothed pose weights extend the shared scene uniform from 160 to 176
bytes. The change adds no texture, storage buffer, render pass, compute pass,
draw call, or external animation runtime. State selection and exponential
envelopes run once per frame on the CPU; the existing player vertex stage reads
the weights while evaluating its established part hierarchy.

| Active state | Observed HUD | Result |
| --- | ---: | --- |
| forward ride, 1182×749 | 60 FPS · P95 17.6 ms · 1% 56 · 100% | retained |
| moving edge brake, 1182×749 | 60 FPS · P95 17.5 ms · 1% 56 · 100% | retained |
| airborne, 1182×749 | 60 FPS · P95 17.3 ms · 1% 57 · 100% | retained |
| first landing, 1182×749 | 60 FPS · P95 17.3 ms · 1% 57 · 100% | retained |
| moving native target, 2560×1440 | 45 FPS · P95 34.3 ms · 1% 12 · 100% | documented fixed-native limit |

The interactive viewport remains frame-capped at 60 FPS through every new
state. The short active native capture remains consistent with the documented
fixed-native pixel-shading limit and is not used to claim native 60 FPS.

## 2026-08-14 — athletic silhouette cost

The action correction changes arithmetic inside the existing player vertex
stage only. It adds no uniform bytes, vertex or index data, pass, draw call,
texture, buffer, compute dispatch, or animation runtime. All inspected
1182×749 idle, ride, brake, air, cast, and landing states remain at 60 FPS and
100% RES, with P95 readings from 17.3 to 17.6 ms.

The calibrated native active screenshot briefly displays 60 FPS while its P95
window already records 33.5 ms and 1% low 20; that short counter value is not a
stable native-performance claim. After the deterministic route completes and
the measurement window warms, the true 2560×1440 target reports 44 FPS, P95
33.5 ms, 1% low 30, and 100% RES. This matches the established fixed-native
pixel-shading boundary.

## 2026-08-14 — sightline-aware beacon alpha

The existing instanced beacon draw changes from opaque depth writing to
source-alpha blending after the opaque rider draw. The shader adds one flat
occlusion value and a small per-vertex sightline calculation. There is no new
pass, draw, instance, geometry, buffer, texture, uniform, or CPU traversal.

The completed true 2560×1440 route stabilizes at 47 FPS, P95 33.8 ms, 1% low
20, and 100% RES with clean diagnostics. The normal 1182×749 completion route
remains at 60 FPS and 100% RES. These readings show no measurable regression
outside normal run-to-run variance; they do not change the documented fixed-
native performance boundary.

## 2026-08-14 — rider equipment-detail geometry

Helmet lenses, rim, bridge, hinges, mask vents, glove thumbs, hand plates, and
the smaller casting core remain inside the existing rider vertex/index buffers
and single player draw. Four extra material groups add no pipeline, pass, draw,
uniform, texture, storage buffer, or animation runtime.

The first visually accepted mesh used excessive sphere tessellation for
millimetre-scale pieces and coincided with a 44 FPS fixed-native completion
reading. Retessellating only those pieces preserves the close silhouette while
the final active capture reports 47 FPS, P95 33.7 ms, 1% low 21, and 100% RES;
the warmed completion reports 46 FPS, P95 33.5 ms, 1% low 29. The normal
1182×749 ride and cast checks remain at 60 FPS and 100% RES.

## 2026-08-14 — tapered-contact history resolution

The persistent history grows from 768² to 1536² because a 5.5-centimetre edged
contact cannot be represented honestly at the former 16.7-centimetre world
texel. Active regional dispatches grow from 64² to 128², preserving the same
physical update radius. Texture sampling count, render passes, terrain
tessellation, rider draw count, and post processing are unchanged.

| Running state | Observed HUD | Result |
| --- | ---: | --- |
| carve / brake / jump, 1182×749 | 60 FPS · P95 17.6–17.7 ms · 100% | retained |
| completed three-sigil route, 1182×749 | 60 FPS · P95 17.7 ms · 100% | retained |
| fixed-scale large host view | 47 FPS · P95 34.2 ms · 100% | consistent with established fixed-native boundary |

The large-view browser export was 2073×1440 and is not labelled as a true
2560×1440 screenshot. The project keeps the previously calibrated fixed-native
boundary rather than inflating this measurement. The complete `?capture` path
still allocates a 2560×1440 WebGPU target from a 1280×720 presentation.

## 2026-08-14 — edge-response powder cost

The first visible powder version evaluated 24 ballistic flecks inside a
0.58-radius full-screen region. Although the normal viewport remained at 60
FPS, the fixed-scale large host view fell to 43 FPS and was rejected. The
retained version preserves the anisotropic ground plume, halves fine flecks to
12, and shrinks the early-out region to 0.46.

| Running state | Observed HUD | Result |
| --- | ---: | --- |
| first 24-fleck large-view candidate | 43 FPS · P95 33.6 ms · 100% | rejected |
| retained 12-fleck large view | 46 FPS · P95 33.5 ms · 100% | within established 46–47 FPS boundary |
| retained carve/brake/air, 1182×749 | 60 FPS · P95 17.5–17.7 ms · 100% | retained |
| retained completed route, 1182×749 | 60 FPS · P95 17.3 ms · 100% | retained |

The audio addition is one pre-existing two-second procedural noise buffer read
through another filter/gain branch; it introduces no network or decoding cost.
The powder layer remains inside the existing overlay pass and adds no draw,
texture, buffer, compute dispatch, or pipeline.

## 2026-08-14 — relative-airflow cloth cost

The cloth solver mutates two persistent four-element position/velocity pairs on
the CPU and uploads two additional `vec4<f32>` values in the existing frame
uniform. The player vertex stage samples them only for the scarf, cape, and its
dedicated trim. Existing geometry and the single indexed rider draw are
unchanged.

| Running state | Observed HUD | Result |
| --- | ---: | --- |
| real carve and stopped-tail inspection, 1182×749 | 60 FPS · P95 17.2–17.3 ms · 100% | retained |
| completed three-sigil route, 1182×749 | 60 FPS · P95 17.2 ms · 100% | retained |
| true 2560×1440 canvas, manual carve | 48 FPS · P95 33.5 ms · 100% | consistent with prior 46–48 FPS target boundary |
| large visible host view | 47 FPS · P95 33.4 ms · 100% | retained |

The current browser exporter returns the complete `?capture` composition at
1280×720 even though a read-only canvas inspection reports a 1280×720 CSS
presentation backed by a 2560×1440 WebGPU target. That downsample is labelled at
its exported size; the 2073×1440 large-view crops used for telemetry are not
presented as native-resolution visual proof.

## 2026-08-15 — terrain-coupled spindrift cost

The retained weather field adds one 12-workgroup compute dispatch, one 12 KiB
storage buffer, and one depth-tested instanced draw. The compute stage evaluates
the existing terrain/deformation height once for each of 768 centres. The draw
uses four triangle-strip vertices per centre and no vertex buffer, texture,
sprite, upload stream, or per-frame CPU allocation.

| Same-session state | Observed HUD | Result |
| --- | ---: | --- |
| repeated terrain height in every quad vertex | 39 FPS · P95 34.0 ms · 1% 29 · 100% | rejected architecture |
| compute-shared centres, 768 particles, 1182×749 | 58 FPS · P95 17.7 ms · 1% 30 · 100% | retained interactive path |
| compute-shared centres, 768 particles, true 2560×1440 target | 39 FPS · P95 34.1 ms · 1% 29 · 100% | fixed-scale stress limit |
| diagnostic 64-particle true 2560×1440 target | 39 FPS · P95 34.1 ms · 1% 20 · 100% | particle count was not the pixel bottleneck |

The final target measurement used one active WebGPU tab; a two-tab run fell to
30 FPS and was discarded as GPU contention rather than application telemetry.
The browser exported the complete composition at 1280×720 while DOM inspection
confirmed a 2560×1440 backing canvas. Absolute readings from the prior day's
46–48 FPS session were not reproduced in this session, so this record does not
claim that older number. The controlled 768-versus-64 comparison instead shows
that the established terrain, HDR resolve, and 3.69-million-pixel path dominate
the fixed-scale limit. Normal play retains adaptive resolution and remains near
the display's 60 FPS cap.

## 2026-08-15 — bounded snow-load cost

The track correction replaces one raw multiply with one `smoothstep` and two
scalar `mix` operations inside the existing local snow-history compute path. It
adds no dispatch, pass, sample, texture, buffer, geometry, particle, or CPU
allocation.

| Same-session state | Observed HUD | Result |
| --- | ---: | --- |
| active deterministic route, 1182×749 | 60 FPS · P95 17.6 ms · 1% 57 · 100% | retained |
| completed three-sigil route, 1182×749 | 60 FPS · P95 17.6 ms · 1% 56 · 100% | retained |
| true 2560×1440 WebGPU target, 1280×720 presentation | 60 FPS · P95 17.3 ms · 1% 57 · 100% | retained in this session |

The calibrated target evidence is labelled at the exporter's actual 1280×720
pixel dimensions. The page allocates and shades its fixed 2560×1440 WebGPU
backing target in `?capture`, confirmed by the existing capture contract; the
downsample is not described as a native-size screenshot. Browser diagnostics
contained no warning, WGSL, WebGPU validation, or uncaptured-device error.
