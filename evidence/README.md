# Visual evidence

Evidence files are original captures from the running Snowveil WebGPU build.
They are review artefacts, not third-party source material.

- `gate-1-character-defect-2560x1440.jpg` — first native 1440p defect capture.
  The environment is accepted as an iteration baseline; the character art in
  this frame is explicitly rejected and is documented in `QUALITY.md`.
- `gate-1-rider-rebuild-before-2560x1440.jpg` — native before frame for the
  second rider review; the pod silhouette is explicitly rejected.
- `gate-1-rider-rebuild-after-2560x1440.jpg` — retained middle-distance frame
  after the character, contact, and snow-surfing blade rebuild.
- `gate-1-rider-close-2560x1440.jpg` — close inspection of the retained rider
  silhouette, boot bindings, board sidewall, raised tips, and snow contact.
- `gate-1-rider-far-2560x1440.jpg` — far inspection confirming that the low sun,
  terrain layers, and winter atmosphere remain dominant in the composition.
- `interaction-ride-track-1182x749.jpg` — native interactive capture of rider
  motion and persistent snow deformation.
- `interaction-ride-track-aa-1182x749.jpg` — retained interactive capture after
  higher-resolution snow history, wider board stamping, and near-field terrain
  concentration reduced the track-edge staircase.
- `interaction-ice-pulse-1182x749.jpg` — native interactive capture of the
  original Ice Pulse ring, projectile, and deformation residue.
- `gate-1-stability-after-2560x1440.jpg` — fixed native 1440p evidence after
  derivative-based snow-detail filtering and exact terrain-to-sky fog matching.
- `interaction-carve-pose-a-1182x749.jpg` — first retained close frame from the
  deterministic 5.4 m/s ride, showing the loaded edge and compressed stance.
- `interaction-carve-pose-b-1182x749.jpg` — second frame about 0.4 seconds later,
  showing stance recovery and independent cape/scarf phase.
- `gate-1-armor-landscape-2560x1440.jpg` — fixed native 1440p review after the
  shoulder, cape, glove, visor, and distant-ridge rebuild.
- `interaction-armor-cape-1182x749.jpg` — moving rear/side inspection of the
  crowned cape, plate rims, cuffs, boot clearance, and snow-surfing blade.
- `rider-visor-front-1182x749.jpg` — stationary front inspection of the original
  framed visor, nose guard, crossing harness, gloves, and layered stance.
- `ritual-progress-1182x749.png` — running deterministic route after two of the
  three real frost sigils have been activated through Ice Pulse.
- `ritual-complete-1182x749.png` — warmed interactive completion frame showing
  the active crystal, orbit ring, snow mark, final HUD state, and retained frame
  metrics.
- `gate-1-frost-rite-2560x1440.png` — fixed native 1440p material and composition
  review of the accepted Frost Rite checkpoint.
- `ritual-finale-audio-1182x749.png` — exact interactive third-activation beat
  with audio enabled, completion title, Ice Pulse, and cold expansion wave.
- `gate-1-frost-rite-finale-2560x1440.png` — fixed native 1440p inspection of
  the synchronized completion presentation.
- `performance-shadow-before-2560x1440.png` — fixed-camera ten-step terrain
  shadow baseline at 17–18 FPS.
- `performance-shadow-after-2560x1440.png` — retained six-step, fog-aligned
  terrain-shadow result at 26 FPS.
- `performance-rite-after-2560x1440.png` — completed fixed-1440p route with the
  retained shadow path, audio enabled, and synchronized finale at 22 FPS.
- `motion-base-1182x749.png` — retained three-quarter default camera that keeps
  the snowboard stance and blade axis legible at rest.
- `motion-glide-1182x749.png` — real W-input glide at 4.6 m/s with the blade's
  long axis leading along the trajectory.
- `motion-carve-1182x749.png` — real W+D carve at 4.9 m/s showing direction,
  edge load, upper-body counter-rotation, and a curved persistent track.
- `motion-brake-1182x749.png` — real S-input edge-stop at 1.0 m/s with the blade
  rotated across the travel direction and its contact band narrowed.
- `motion-jump-1182x749.png` — real Space input while moving at 4.3 m/s, with a
  visible board-to-snow gap and no airborne stamp.
- `motion-rite-complete-1182x749.png` — end-to-end `?demo` regression after the
  motion correction, ending at `Veil stabilized` without browser warnings.
- `slope-natural-coast-1182x749.png` — same-controller no-input downhill probe
  recording 1.2 m/s natural coast and slope-aligned board contact.
- `slope-uphill-1182x749.png` — ten W pulses on the shared test grade facing
  uphill, reaching 3.1 m/s.
- `slope-downhill-1182x749.png` — the identical ten W pulses facing downhill,
  reaching 5.1 m/s.
- `slope-jump-glove-defect-1182x749.png` — rejected jump frame that exposed a
  glove detached from the torso-turned arm because it shared a leg part number.
- `slope-jump-1182x749.png` — accepted 5.3 m/s slope takeoff after the glove
  transform split, with connected hand equipment and a visible airborne gap.
- `slope-rite-complete-1182x749.png` — complete deterministic route after CPU/GPU
  terrain-height parity and slope physics, with no browser warnings.
- `performance-snow-history-before-2560x1440.png` — same-session fixed-1440p
  baseline before deformation scheduling and vertex-shadow changes, at 21 FPS.
- `performance-snow-history-after-2560x1440.png` — scheduling-only intermediate
  at 22 FPS; retained to isolate the small idle-compute gain.
- `performance-vertex-shadow-candidate-2560x1440.png` — exploratory 30 FPS frame
  from moving the unchanged six-sample terrain shadow to the dense vertex grid.
- `performance-vertex-shadow-after-2560x1440.png` — retained steady 28 FPS
  fixed-1440p frame after the complete snow-history and vertex-shadow pass.
- `performance-vertex-shadow-motion-1182x749.png` — rejected low-frequency
  history experiment whose fast curved track exposed scalloped stamp spacing.
- `performance-snow-history-motion-1182x749.png` — accepted swept-contact curve
  at 4.3 m/s, with the pointed edge-loaded footprint joined between frames.
- `performance-snow-history-jump-gap-1182x749.png` and
  `performance-snow-history-jump-gap-orbit-1182x749.png` — airborne inspections
  confirming that the rider can separate from the snow while contact stamping is
  disabled; the orbit frame is diagnostic rather than a composition gate.
- `performance-vertex-shadow-rite-1182x749.png` — completed three-sigil route
  after both retained optimisations, ending at `Veil stabilized` without errors.
- `motion-jump-arc-1182x749.png` — moving Space jump with signed vertical
  velocity shaping the airborne board/body attitude and a clear snow gap.
- `motion-landing-impact-1182x749.png` — first grounded frame from the same
  sequence, showing knee/torso absorption and a short snow-powder burst.
- `motion-landing-rite-complete-1182x749.png` — complete deterministic route
  after the landing-response uniform and particle pass, with clean browser logs.
- `mobile-controls-idle-480x659.png` — narrow-viewport composition with both
  translucent touch clusters, safe footer spacing, and a 60 FPS idle reading.
- `mobile-controls-ride-480x659.png` — touch-driven ride and carve state with
  shared board orientation, rider pose, and desktop-equivalent movement logic.
- `mobile-controls-jump-480x659.png` — onscreen Jump at speed with visible
  board-to-snow separation and the controls still clear of the rider.
- `mobile-controls-pulse-480x659.png` — onscreen Ice Pulse with projectile ring,
  snow crater, residual light, and a 60 FPS warmed reading.
- `mobile-controls-desktop-rite-1182x749.png` — desktop 3/3 route after the
  responsive input change, confirming the controls remain visually absent.
- `snowboard-causality-v2-ride-720x850.png` — clean 6.5 m/s three-quarter chase
  frame with the board nose and continuous wake aligned to the same trajectory.
- `snowboard-causality-v2-brake-720x850.png` — real shared Brake/S input captured
  at 1.2 m/s after the blade has moved across the trajectory and onto its edge.
- `snowboard-causality-v2-jump-720x850.png` — real shared Jump/Space input at
  6.5 m/s with a clear board-to-snow gap and no airborne contact stamp.
- `performance-native-baseline-2560x1440.png` — fresh 2560×1440 fixed-canvas
  idle at 60 FPS before the regional-history comparison; later visible-viewport
  audit means this is not a complete full-display native claim.
- `performance-native-active-before-2560x1440.png` — full 768² active-history
  baseline at 1/3 route progress, 7.1 m/s, and 47 FPS.
- `performance-native-active-after-2560x1440.png` — retained 64² regional-write
  frame at 1/3 progress, 6.8 m/s, and 60 FPS.
- `performance-native-complete-before-2560x1440.png` — complete fixed-native
  route before the regional update, at 45 FPS.
- `performance-native-complete-after-2560x1440.png` — complete fixed-native
  retained route at 46 FPS; recorded to keep the all-state limit explicit.
- `performance-regional-history-track-1182x749.png` — 60 FPS interactive track
  inspection showing a joined board wake after regionalisation.
- `performance-regional-history-rite-1182x749.png` — 60 FPS completed route with
  all three sigils, snow deformation, and spell residue preserved.
- `performance-visible-native-idle-before-2560x1440.png` — 44 FPS native-target
  idle telemetry with the original five snowfall layers and 352² terrain. A
  later host-scale audit reclassified the image as a top-left crop, not full-
  frame composition evidence.
- `performance-visible-native-idle-after-2560x1440.png` — retained 100%-scale
  idle telemetry at 51 FPS; subject to the same crop limitation.
- `performance-visible-native-route-before-2560x1440.png` — 352², five-layer
  completed-route telemetry at 44 FPS; subject to the same crop limitation.
- `performance-visible-native-route-full-2560x1440.png` — retained 288² route
  telemetry at 47 FPS and 100%; subject to the same crop limitation.
- `performance-visible-release-route-2560x1440.png` — automatic-route telemetry
  at the disclosed 84% scale and 60 FPS; subject to the same crop limitation.
- `performance-adaptive-track-1182x749.png` — 6.6 m/s close route frame at
  100% scale and 60 FPS, retaining the joined pointed board wake.
- `rider-articulation-before-1182x749.png` and
  `rider-articulation-after-1182x749.png` — same-size moving comparison before
  and after the smaller hood, vented hem, independent boots, guards, and joint
  hierarchy.
- `rider-articulation-close-1182x749.png`,
  `rider-articulation-carve-1182x749.png`, and
  `rider-articulation-far-1182x749.png` — near, loaded-carve, and distant
  silhouette inspections at 60 FPS and 100% render scale.
- `rider-articulation-jump-1182x749.png` and
  `rider-articulation-landing-1182x749.png` — real shared Space input at 5.4 m/s
  and its first grounded compression state, with clean browser diagnostics.
- `rider-articulation-native-2560x1440.png` — calibrated complete-frame moving
  capture: 1280×720 CSS presentation, true 2560×1440 WebGPU target, 48 FPS.
- `rider-articulation-native-complete-2560x1440.png` — calibrated complete-frame
  three-sigil result at a true 2560×1440 target, 46 FPS and 100% RES.
- `rider-transition-ride-1182x749.png` — real forward input at 5.3 m/s with the
  board nose, hips, and gaze carried into the travel direction.
- `rider-transition-brake-1182x749.png` — real moving Brake/S input at 1.9 m/s
  with a crosswise edged board, deeper knee load, and stabilising arms.
- `rider-transition-air-1182x749.png` — real Space input at 5.5 m/s with a clear
  snow gap, tucked knees, opened arms, and contact stamping disabled.
- `rider-transition-land-1182x749.png` — first grounded frame at 4.6 m/s with
  authored landing absorption layered over the physical compression response.
- `rider-transition-native-2560x1440.png` — calibrated complete-frame moving
  capture at a true 2560×1440 WebGPU target, 45 FPS and 100% RES.
- `rider-action-idle-1182x749.png` — non-casting idle with the formerly raised
  forearm relaxed and both boots still seated on the blade.
- `rider-action-ride-1182x749.png` — real W input with lower knee loading and an
  asymmetric snowboard balance silhouette instead of a permanent casting pose.
- `rider-action-brake-1182x749.png` — real moving S input with deeper edge-stop
  compression and the balancing arm clear of the torso.
- `rider-action-air-1182x749.png` — real Space input at 5.4 m/s with stronger
  tuck, board separation, and no snow-contact stamp in the airborne interval.
- `rider-action-cast-1182x749.png` — real E input restoring the raised pointing
  forearm only while the Ice Pulse, projectile ring, and crater are visible.
- `rider-action-land-1182x749.png` — post-jump joint inspection confirming that
  the stronger landing load keeps guards, boots, and blade visually continuous.
- `rider-action-native-2560x1440.png` — calibrated complete-frame 6.8 m/s route
  capture at a true 2560×1440 WebGPU target and 100% RES.
- `camera-occlusion-after-2560x1440.png` — the same calibrated first-sigil route
  region after sightline-aware alpha keeps the rider and snow path readable
  through the near beacon; distant beacons retain their established opacity.
- `rider-detail-before-1182x749.png` — closest pre-change front inspection with
  one dark visor surface, ball-ended gloves, and the hand-sized constant core.
- `rider-detail-after-1182x749.png` — retained 2.8-metre front inspection with
  split cold-glass lenses, narrower frame, mask construction, and thumb shapes.
- `rider-detail-ride-1182x749.png` — real 5.4 m/s input showing all new head and
  hand pieces inheriting the moving procedural hierarchy at 60 FPS.
- `rider-detail-cast-1182x749.png` — real E input showing the smaller hand core
  brightening with the projectile, crater, and post-process ring.
- `rider-detail-native-2560x1440.png` — calibrated complete-frame active route
  at a true 2560×1440 target, 47 FPS and 100% RES.
