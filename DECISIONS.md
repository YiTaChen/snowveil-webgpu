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

Interactive snow state lives in two original 768×768 `rgba16float` textures
covering the finite 128-metre play field. A compute pass reads the previous
texture, stamps the board compression and displaced edge ridges, applies a very
slow recovery rate, and writes the next texture. Terrain vertices, normals, and
material response all read the newest history, so the visible track is geometry
instead of a decal and remains after the rider leaves.

An initially uniform 384×384 terrain grid made a sub-metre track visibly stair
stepped. The active 352×352 grid uses a player-centred quadratic density warp:
spacing is about 5.9 centimetres at the rider and remains below roughly 11
centimetres across the immediate board footprint, while distant cells become
progressively larger. This substantially reduces track stair-step without
raising the triangle count above the earlier uniform baseline.

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

## 2026-08-14 — Rider rebuild exposes contact and equipment

The first bespoke cloak mesh still collapsed into an egg-shaped silhouette in
the 2560×1440 defect frame. It also used one long ellipsoid beneath a ground-
length cloak, so there was no daylight for legs, boots, or a credible riding
stance. Colour changes could not solve those structural defects.

The rebuilt, still fully project-authored geometry shortens the coat to the
thigh, adds bent legs, boot shafts, bindings, separated shoulder plates, a
smaller collar, a broken cloth hem, a back seam, and an asymmetrical casting
arm. CPU and WGSL terrain hashes now use the same component order, and the rider
origin is lowered from 20 centimetres above the sampled terrain to a lightly
embedded contact position.

An intermediate pair of long skis failed the chase-camera review because their
projection looked like two hanging icicles. A lateral ellipsoid board passed the
rear view but became an oval when the rider turned. The retained snow-surfing
blade is therefore an original thin mesh with separate top, underside, sidewall,
bindings, and procedurally raised tips. This checkpoint improves the silhouette
without claiming final character art.

## 2026-08-14 — Track stability and horizon continuity

The deformation history increases from 512² to 768², giving the 128-metre field
about 16.7-centimetre simulation texels instead of 25-centimetre texels. The
board stamp now covers its full visible width and raises two separated edge
ridges. Concentrating the existing 352² terrain grid around the rider makes the
geometry denser where that history is inspected without paying for uniformly
dense distant terrain.

High-frequency wind ridges now use fragment derivatives to fade only when their
phase becomes undersampled. This keeps foreground relief while suppressing
sub-pixel shimmer in motion. The far-terrain fog also uses the same low sky,
high sky, horizon glow, solar disc, and halo calculation as the sky pass. A fully
fogged terrain sample therefore converges to the exact sky colour instead of
leaving a dark raster silhouette at the mesh boundary.

## 2026-08-14 — Rider motion is force-led, not a walk cycle

The snow-surfing rider should read as balancing against a continuous edge force,
not as a walking character translated over snow. The vertex shader now derives
a carve phase from normalized speed and applies it around a low stance pivot:
the torso banks, the knees compress, and the blade follows with a smaller edge
angle. The coat hem, back cape, and scarf use separate frequencies and amplitudes
so their motion follows the rider without moving as one rigid shell.

Dark winter cloth receives a restrained height-dependent dye shift, stable local-
space weave, snow bounce, fold shading, and snow-catching response. Derivatives
fade the weave when it would become undersampled. All motion and material detail
remains project-authored WGSL; no rig, animation clip, texture, or model asset is
imported.

The `?demo` query provides a deterministic curved 5.4 m/s ride for repeatable
visual QA while using the same input integration, deformation compute, and
rendering path as manual play. Long-run review also showed that the previous
13-centimetre snow compression read as a trench, so the retained board stamp is
7.5 centimetres deep with a 2.8-centimetre displaced edge ridge.

## 2026-08-14 — Deliberate winter gear replaces primitive volumes

The rebuilt moving silhouette still failed close review because two ellipsoids
read as toy shoulder pads, the two-column back cape intersected the coat and
collapsed into disconnected bright patches, and the unmarked face read as an
unfinished sphere. Adding more noise could not solve those geometry defects.

The retained project-authored mesh uses curved gridded shoulder shells with dark
lower rims, a six-column crowned cape with a broken tapered hem and separate edge
trim, leather gloves with raised cuffs, and a front harness. A framed dark visor,
central guard, and restrained blue reflection define the character as a winter
caster without pretending that a few spheres are a realistic human face. The
cape is offset from the coat, carries its own centre seam, and remains narrow
enough to preserve the leg and board silhouette while carving.

A 180-degree orbit exposed a thin high-contrast ridge where terrain beyond about
50 metres became tangent to the view. Extending the 352² grid from 86 to 230
metres retained the artifact and was rejected. The active renderer keeps the
dense 86-metre grid, reduces and closes the far mountain ring before the mesh
boundary, and reaches full terrain fog at 50 metres. The defect disappears while
the 1440p primary view retains three readable terrain layers.

## 2026-08-14 — Frost Rite turns the rendering study into a loop

Three project-authored frost-sigil beacons now form a short playable route. One
instanced mesh supplies a tapered stone plinth, snow cap, faceted crystal,
support fins, and floating torus; activation state and world position travel in
the shared frame uniform. Dormant crystals retain a weak cold core so the HUD's
direction is visually actionable, while activated crystals raise and accelerate
their rings without adding a separate animation system.

Manual Space input and deterministic `?demo` both call the same Ice Pulse cast
function. The projectile's visible offset is also the activation test point, so
the QA route cannot complete a beacon from an invisible or unrelated trigger.
Activated positions feed back into terrain shading to draw antialiased broken
rings and radial strokes in the snow. This supplements the existing deformation
history and prevents the objective prop from appearing merely placed on top of
the landscape.

The first activated 1440p frame was rejected because emission erased the crystal
facets and the unlit plinth collapsed to black. The retained material reduces
crystal and ring emission, lifts the stone's cool ambient response, and keeps
the ritual mark subordinate to the landscape. All new geometry, animation,
symbol design, route logic, and shading are original project code; no external
game, model, texture, icon, or audio asset is used.

## 2026-08-14 — Procedural audio shares gameplay state

Snowveil does not import recordings or a music track. A project-authored Web
Audio graph creates deterministic filtered noise for wind and board hiss, a low
environmental rumble, three restrained beacon drones, a short Ice Pulse sweep,
and a non-melodic three-layer completion chord. Board-hiss gain follows the same
measured rider speed shown in the HUD, and beacon tones start from the same
activation event that changes the shader uniform.

The audio graph is created or resumed only after a keyboard, canvas, or explicit
button gesture. The top-right control distinguishes never-enabled, playing, and
muted states, and the graph closes during component cleanup. This respects
browser autoplay policy while keeping deterministic `?demo` silent until a
reviewer explicitly enables sound.

The third activation also sets a dedicated completion age in the shared uniform.
Post-processing uses it for one expanding cold wave while the interface presents
a timed `Veil stabilized` title. Both are deliberately transient: the accepted
frame preserves terrain relief and crystal facets instead of replacing the
scene with an opaque win screen.
