# Snowveil WebGPU

Snowveil is an original real-time snow-world game prototype. It renders a
cinematic procedural landscape with native WebGPU and hand-written WGSL:
wind-shaped dunes, layered snow response, a low winter sun, atmospheric haze,
stable crystalline glints, persistent board tracks, and restrained blowing snow.

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

Use a WebGPU-capable browser. With a keyboard, hold W or Up to accelerate, use
A/D or Left/Right to carve, and hold S or Down to rotate the board across the
travel direction and brake. Space jumps; E casts Ice Pulse. On a narrow or
coarse-pointer device, the same six actions are available through the glass
onscreen controls and support simultaneous steering plus acceleration. Drag the
scene to orbit, hold Shift for a faster keyboard traverse, and use the mouse
wheel to change camera distance. Audio begins only after a key, canvas, touch
control, or explicit audio-button gesture and can be muted from the top-right
control. Snow grade contributes real forward or resisting acceleration: a
downhill board can coast without W, while the same input climbs more slowly in
the opposite direction.

The playable Frost Rite asks the rider to awaken three original sigil beacons.
Follow the dormant blue cores, aim the visible casting hand toward a beacon,
and press E when the HUD prompts. Each successful Ice Pulse activates its
crystal and rotating ring, records a frost mark in the snow, and advances the
ritual state.

Append `?demo` to the local URL for a deterministic end-to-end route used by
visual QA. It steers toward each real beacon and casts through the same Ice Pulse
and proximity test as keyboard input while exercising the same heading, speed,
board-yaw, and snow-contact state; it is not a pre-rendered or separate evidence
scene. Append `&evidence` for the fixed 2560×1440 CSS performance path. Append
`&capture` for the calibrated still path: the page is 1280×720 while WebGPU
allocates and shades a true 2560×1440 target, allowing the app browser's 2×
export to contain the complete frame instead of a top-left crop.
For repeatable physics review, `?slope=downhill` and `?slope=uphill` place the
rider on the same local grade with opposite headings; they use the normal
controller and renderer rather than a separate animation.

## Originality and licensing

No reference-project code or assets are copied into this repository. The current
scene uses no image, model, HDRI, animation, or audio assets. Terrain, lighting,
atmosphere, snow particles, surface detail, rider, beacons, sigils, wind, board
hiss, spell tones, and the completion chord are produced procedurally by
project-owned TypeScript and WGSL code.

See [ORIGINALITY.md](./ORIGINALITY.md), [ASSETS.md](./ASSETS.md), and
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) before adding any visual,
audio, or code dependency.

Original project code is released under the [MIT License](./LICENSE).

## Milestones

1. Cinematic snow visual gate — accepted for the current vertical slice; HDR
   raster landscape and 1440p still-review evidence established.
2. Temporal stability and measured capture evidence.
3. Persistent GPU deformable snow — interactive baseline established.
4. Character motion, contact, and snow-surfing — animation/material checkpoint established.
5. Original spell interactions and performance hardening — Ice Pulse baseline established.
6. Playable Frost Rite loop — three instanced sigils, shared spell activation,
   persistent ritual marks, HUD progress, and deterministic completion route established.
7. Procedural sound and synchronized finale — gesture-safe Web Audio mix,
   three-state audio control, completion chord, title, and frost-wave checkpoint established.
8. Native-resolution performance pass — fog-aligned six-step terrain shadows
   replace the ten-step 38-metre path, with pixel-difference and route evidence recorded.
9. Release audit — starter-only database and styling scaffolds removed, direct
   packages upgraded, social metadata verified, production audit at zero, and
   third-party licence/security records captured.
10. Snowboard causality pass — nose-first glide, direction-aware torso twist,
    edge-loaded elliptical snow contact, crosswise braking, and Space jump are
    verified from the running build.
11. Terrain-coupled ride pass — CPU/GPU snow height parity, natural downhill
    coast, uphill resistance, slope-aligned stance, and takeoff-angle retention
    are verified from the running build.
12. Continuous-contact performance pass — active snow stamps sweep between
    grounded frames, airborne travel leaves no false groove, untouched history
    decays at 30 Hz, and the unchanged six-sample terrain shadow runs on the
    dense terrain vertices for a measured native-1440p gain.
13. Jump-response pass — signed vertical velocity shapes takeoff and descent,
    impact velocity drives a tested no-overshoot landing compression, and a
    short original snow burst marks only the grounded contact frame.
14. Responsive-input pass — accessible glass touch controls share the keyboard
    movement state, support held and simultaneous inputs, preserve the scene on
    a 480×659 mobile viewport, and leave the desktop composition unchanged.
15. Board-readable causality v2 — the travel-following three-quarter camera,
    asymmetric nose, torso/head look, skid-derived braking resistance, explicit
    long elliptical contact, and real Space jump are verified together from the
    running build.
16. Regional snow-history pass — active board and spell contact retain per-frame
    stamps while the compute shader writes a local 64² region; a one-second
    full sweep handles global decay with phase-correct continuous presentation.
17. Visible-1440p release pass — redundant full-screen snowfall layers are
    consolidated, the near-focused terrain grid is reduced to 288², and a
    tested 84–100% dynamic-resolution controller exposes its live scale in the
    HUD while retaining a fixed 100% evidence mode.
18. Articulated rider pass — distinct shoulder, elbow, hip, knee, boot, cuff,
    and guard groups add edge-dependent weight transfer and impact compression;
    the capture route separates full-frame 1440p visual proof from performance
    telemetry after a host-pixel screenshot audit.
19. Authored pose-transition pass — mutually prioritized idle, ride, brake,
    air, and land targets feed a tested exponential envelope; the same physical
    controller now produces distinct ride, crosswise-brake, tuck, and absorption
    silhouettes without state-driven speed or contact shortcuts.
20. Athletic action-silhouette pass — normal riding now lowers the centre of
    mass and opens asymmetric balance arms, idle relaxes the casting forearm,
    and only a live Ice Pulse raises it; stronger state-specific knee loading
    remains layered over the same board, jump, and contact physics.
21. Camera-obstruction pass — frost beacons now detect whether they occupy the
    chase-camera sightline, fade through a depth-safe alpha path only while
    obstructing the rider, and return to their opaque established material at
    ordinary viewing distances.
22. Rider equipment-detail pass — split optical lenses, a raised goggle rim,
    lower mask, hinges, vents, glove thumbs, hand-back plates, and a pulse-gated
    casting core add close-range construction while inheriting the existing
    head, elbow, and shoulder hierarchy; mouse-wheel inspection now reaches a
    safe 2.8-metre close camera.
23. Snowboard causality v3 — the board nose now leads a carve before velocity
    follows, actual board-to-travel skid angle supplies braking drag, the rider
    looks into travel, a 1536² history retains the tapered long contact print,
    and Space exposes its physical airborne height in the live HUD.
24. Edge-response powder pass — grounded speed, real skid, carve pressure, and
    a signed short-lived powder envelope drive a directional low snow plume;
    airborne contact cuts it immediately, while a separate synthesized edge
    band adds audible scrape without a recording or sample.

The current build is a polished playable vertical slice, not a claim of a full
AAA production or a hundred-million-particle physical simulation. See
[PERF.md](./PERF.md) and [QUALITY.md](./QUALITY.md) for measured limits.
