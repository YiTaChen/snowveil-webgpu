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
