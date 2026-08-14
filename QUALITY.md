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
panels. That checkpoint is saved but has not yet received its required second
2560×1440 comparison capture.
