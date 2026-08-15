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
