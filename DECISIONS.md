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

At this checkpoint, Space cast the original Ice Pulse interaction at a point
ahead and to the rider's right. The later snowboard-causality pass moved Ice
Pulse to E and reserved Space for jumping. The compute pass presses a shallow centre into the snow and lifts
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

The `?demo` query provides a deterministic curved ride for repeatable
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

Manual E input and deterministic `?demo` both call the same Ice Pulse cast
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

## 2026-08-14 — Near-field shadows spend work before the fog

The original terrain fragment path ray-marched ten self-shadow samples out to
38 metres for every lit pixel within 34 metres of the camera. At fixed 1440p,
that repeated the full procedural terrain-height stack across most visible snow
and held the idle review at 17–18 FPS.

The retained path traces six samples, stops at 28 metres, evaluates only within
24 camera metres, and smoothly returns to unshadowed snow from 19 to 24 metres.
This aligns the expensive shadow range with the existing atmospheric transition
instead of calculating detail that fog will immediately remove. The same fixed
idle frame reaches 26 FPS and the full rite reaches 22 FPS.

A four-step shadow experiment reached 27 FPS but increased the proportion of
pixel channels differing by more than eight levels, so the two-frame-per-second
gain did not justify the reduced safety margin and was rejected. Reducing the
HDR resolve from eight bloom taps to four also returned only 24 FPS and was
fully reverted. The accepted before/after images differ by 0.241% mean absolute
8-bit channel value, including independently timed snow particles and grain.

## 2026-08-14 — Release audit keeps the active architecture

Unused starter database, authentication, D1 example, Drizzle, Tailwind, and
PostCSS files were removed after repository-wide search confirmed they were not
part of Snowveil and `.openai/hosting.json` declared no D1 or R2 binding. React,
Cloudflare, Vite, Wrangler, and React Server Components were upgraded to current
compatible patch releases, then the project was rebuilt and server-render tested.

The production-only npm audit is clean. The full development audit retains two
reports from one `vinext` transitive dependency: `image-size` can loop on crafted
ICNS, JXL, or HEIF input. Snowveil has no image upload or untrusted image parsing
path, and the npm forced fix would downgrade vinext to an incompatible pre-1.0
line. The build therefore retains the active version, records the bounded threat
surface in `THIRD_PARTY_NOTICES.md`, and will adopt the first compatible patched
dependency rather than breaking the hosting architecture for an irrelevant
input path.

The social card is deliberately separate from runtime evidence. It was generated
once from a Snowveil-owned screenshot with the built-in image generator, checked
for exact title/subtitle text and unwanted third-party marks, and is never used
as a texture or proof of in-engine quality.

## 2026-08-14 — Board direction and snow contact follow one physical state

User review exposed a basic motion contradiction: the blade's long axis remained
perpendicular to velocity during every glide, the player-model yaw used the
opposite horizontal sign from the CPU travel vector, and the deformation compute
stamped an oversized fixed rectangle. Animation could not hide those errors.

The retained controller separates travel heading from board yaw. During a glide,
one end of the board leads along the trajectory; steering adds a small edge angle.
Holding S rotates the board progressively across the trajectory, raises edge
pressure, and applies strong drag. The upper coat and head turn separately toward
the travel direction rather than being welded to the board. This follows the
broad stopping and turning principles described by the Japan Professional Ski
Instructors Association and U.S. Ski & Snowboard; their pages were observation
references only and no footage, imagery, geometry, or animation was copied.

The snow compute and the terrain contact shadow now consume that exact board yaw.
Their footprint is a pointed 1.64-by-0.36-metre ellipse when flat, narrows and
shifts toward the engaged edge while carving or braking, and disappears while
airborne. Space therefore becomes a real ballistic jump with takeoff/landing
sound and a gap in persistent snow history; Ice Pulse moves to E.

The first browser capture after this correction exposed a presentation problem:
the physically correct sideways snowboard stance collapsed into a beacon-like
silhouette when the chase camera sat exactly on the travel axis. The retained
0.45-radian three-quarter chase angle does not change movement physics; it makes
the board axis, lower-body stance, and upper-body counter-rotation readable in
one default view while preserving manual orbit control.

## 2026-08-14 — Snow grade drives one shared ride state

The motion-causality review still left one contradiction: the board changed
speed identically uphill and downhill, and the procedural rider remained level
while the visible snow inclined beneath it. Before adding gravity, the CPU
terrain sampler was corrected to use the exact same finite mountain-band rise
and fade as the WGSL terrain. This prevents slope physics from amplifying a
pre-existing contact-height mismatch near the route boundary.

The CPU now samples a smoothed central-difference gradient at the rider. Its
projection onto travel direction feeds a bounded gravity component and a small
downhill speed allowance. Uphill grade resists drive; downhill grade adds speed;
airborne drive and drag are reduced so a jump preserves horizontal momentum.
The same smoothed x/z grade travels in the frame uniform and tilts the rider and
blade to the rendered snow normal. Takeoff grade is frozen during flight, then
blended back to the local surface after landing so terrain underneath a jump
cannot rotate the rider in mid-air.

The first airborne capture was rejected because the glove stayed at the lower-
leg transform while its arm and focus turned with the torso. Both had shared one
part number. The retained geometry assigns gloves their own transform part so
hands, cuffs, focus, and arms remain connected without making the lower legs
leave the board. All geometry, physics, and tests remain project-authored code.

## 2026-08-14 — Swept snow contact and vertex-evaluated terrain shadows

Reducing the 768² deformation history to 15 or 30 updates per second lowered
compute cost, but fast curves exposed separate oval stamps as scalloped track
edges. That version is rejected. The retained scheduler skips the compute pass
before the first snow interaction, updates every rendered frame while the board
or Ice Pulse is active, and drops to 30 Hz only while untouched history decays.

Each active board stamp now covers the segment between the previous and current
contact centres instead of pressing only at the latest frame position. The
segment is still evaluated through the same pointed, edge-loaded ellipse, so it
closes sampling gaps without widening contact into a rectangular trench. While
airborne the previous centre follows the rider without stamping; landing cannot
draw a false groove across the jump gap.

Native 1440p profiling also showed that the retained six-sample terrain shadow
was still repeated for every near-field fragment. The exact six-sample function
now runs on the dense 352² terrain vertices and its scalar result is perspective-
interpolated for the fragment material. The shadow radius, fog fade, HDR resolve,
terrain geometry, and material response are unchanged. The fixed-camera image
difference is 0.163% mean absolute 8-bit channel value, including independently
timed particles and grain, while the same-session idle result rises from 21 FPS
to a 28 FPS steady capture. No third-party asset or code was introduced.

## 2026-08-14 — Jump animation carries vertical cause into landing response

The ballistic controller already separated the board from the snow, but the
rider shader used only jump height. The same crouch and fixed air rotation were
therefore applied through ascent, apex, descent, and touchdown. The retained
motion uniform adds signed vertical velocity and a short landing-compression
envelope without changing the trajectory itself.

Upward velocity now gives the body and board a restrained takeoff attitude;
downward velocity blends toward a landing-ready stance. Downward impact velocity
drives knee and torso compression, then decays exponentially without overshoot.
A deterministic 24-particle screen-space snow burst shares that envelope, so it
appears only at contact and does not create an airborne trail. Board geometry,
cloth, particle code, and timing remain project-authored.

Two performance experiments were rejected before this animation pass. A packed
`rg11b10ufloat` HDR target matched `rgba16float` at 44 FPS in a back-to-back
2560×1440 run and added a feature-negotiation path, so the renderer keeps the
more widely supported 16-bit target. Reconstructing the terrain normal from
fragment derivatives measured 42 FPS against a 43 FPS vertex-normal baseline;
the original dense-mesh normal path is retained.

## 2026-08-14 — Touch controls feed the same causal input state

A responsive canvas was not enough for release because narrow and touch-first
devices could see Snowveil but could not move the rider. The retained interface
adds six semantic buttons for ride, left/right carve, brake, jump, and Ice Pulse.
Pointer-down enters the existing pressed-key set, pointer-up/cancel/lost-capture
removes it, and each pointer is tracked separately. Acceleration and steering can
therefore be held simultaneously without creating a parallel physics controller.

Jump and Pulse reuse the exact keyboard one-shot path, including takeoff slope,
audio unlock, collision test, persistent deformation, and ritual activation.
The controls exist in server-rendered HTML for accessibility but remain hidden
and unfocusable until WebGPU is ready. They appear only for coarse pointers or
viewports at or below 720 CSS pixels. Safe-area insets, 46-pixel minimum targets,
pressed-state feedback, and restrained translucent styling keep them operable
without covering the rider or main horizon.

No icon, font, UI library, image, or external asset was added. The glyphs, markup,
CSS, input routing, and captured evidence are project-authored.

## 2026-08-14 — Board-readable snowboard causality replaces input magic

A second user review correctly rejected the first causality pass as visually
ambiguous. Although its long axis was numerically aligned to velocity, the
symmetrical blade gave no nose cue, the camera orbit used world space after a
turn, the upper-body cue was too weak, and braking drag was applied directly by
the S key before the visible board had completed its skid. A value being correct
inside a uniform is not an acceptable substitute for a readable result.

The retained controller now derives both board yaw and braking resistance from
one clamped skid state. Normal riding aligns the board's long axis with velocity;
S rotates it through 90 degrees and its squared visible skid amount produces the
additional drag. The default orbit follows travel heading with the correct sign,
so a three-quarter chase view remains three-quarter after steering. The upper
coat rotates toward travel, with a smaller additional head/visor look. An
asymmetric longer, wider, higher nose and a subtle procedural nose inlay make the
leading end distinguishable without applying a logo or external texture.

The snow shadow and persistent compute stamp use the same explicit ellipse:
1.64 by 0.36 metres flat, narrowing to a 0.104-metre edge strip while retaining
its length. Both disappear in the airborne state. Space still enters the shared
ballistic path and produces a tested snow-history gap. The implementation was
calibrated against the broad movement principles in the official AASI guide,
Burton's edge-control tutorial, and JSBA's emphasis on positioning, grip, and
speed control. Only written technique observations were used; no video frame,
image, mesh, animation, logo, or protected design was copied.

## 2026-08-14 — Regional contact writes replace full per-frame history compute

The 768² deformation texture was still being evaluated in full on every active
board or spell frame. A 30 Hz and then 15 Hz full-surface cadence preserved the
algorithm but recovered only about 2 FPS in native active review, so neither was
worth retaining.

The accepted path first copies the previous ping-pong texture, then dispatches a
64² region centred on the active board, spell impact, or their midpoint. That
region spans about 10.67 metres in world space, covering the complete contact
segment and the nearby spell footprint while invoking about 0.69% as many
compute threads as a full sweep. A clamped CPU helper keeps the region inside
texture bounds and is covered by focused tests.

Global decay still needs to reach untouched history. A full 768² sweep therefore
runs once per second. The elapsed phase is passed to terrain shading so board
deformation and spell residue fade continuously between sweeps; a new spell
stamp applies the inverse phase factor at write time so it appears at full
strength regardless of when within the interval it lands. This preserves the
same exponential decay law without creating visible one-second brightness steps.

The retained fixed-canvas active capture improves from 47 to 60 FPS. Its
completion capture remains 46 FPS, so the decision closes a dominant active
compute cost but does not support a universal visible-native 1440p 60 FPS claim.
No external code, image, model, texture, animation, sound, or other asset is
added.

## 2026-08-14 — Visible viewport evidence and disclosed adaptive resolution

A 2560×1440 canvas attribute and PNG do not prove that Chromium is presenting a
2560×1440 visible viewport. Repeating the test with `innerWidth`, `innerHeight`,
CSS size, canvas size, and DPR all recorded exposed a 44 FPS full-display idle
baseline. Earlier fixed-canvas results remain useful A/B evidence, but are no
longer described as complete visible-native measurements.

Profiling identified five full-screen procedural snowfall layers as the idle
limit. The retained shader uses two atmospheric layers and one stronger
foreground layer. Near/far size separation, motion, rider spray, landing burst,
and Ice Pulse remain separate code paths. The exact visible-native idle reading
rises from 44 to 51 FPS without removing snowfall from the frame.

The terrain grid moves from 352² to 288². Its existing player-centred warp keeps
near-contact spacing at about 7.2 centimetres, still less than half of one
16.7-centimetre snow-history texel. A 224², more strongly concentrated candidate
did not improve the route further and was rejected. The retained 1182×749 track
shows no scalloped or detached contact edge.

Full-native completion remains 47 FPS. Normal play therefore uses a tested
84–100% dynamic canvas scale: below 54 FPS it steps down by four points, and only
raises scale when FPS exceeds 59 and P95 is below 18.2 ms. The HUD exposes the
active percentage. A fixed `renderScale` query is retained for deterministic QA,
while `?evidence` without it remains 100%. The automatic 2560×1440 CSS route
settles at a 2150×1209 canvas and 60 FPS; this is an explicit adaptive-resolution
release path, not a universal native-1440p claim.

Four-neighbour bloom, bounded ritual marks, vertex-carried material fields,
hashed micro-normal candidates, and suppressed snow-history compute were all
measured and reverted because their gains were insufficient or zero. No external
asset or third-party code is introduced by the retained pass.

## 2026-08-14 — Articulated part hierarchy and calibrated capture path

The retained rider had separate visible parts but most limbs inherited one
torso deformation. Both arms shared one part id, boots were fused to the lower
legs, the rounded hood remained oversized, and a full head-pivot condition also
rotated belt and cape-trim vertices because they shared the same material id.
This was enough for direction cues but not convincing weight transfer.

The geometry now assigns distinct upper-arm, forearm, cuff, boot, and knee-guard
groups. Upper and lower legs bend about complementary hip and ankle pivots;
front and rear loads differ with the signed edge input. Forearms inherit an
elbow balance before the whole arm inherits shoulder counterbalance. A narrower
vented hem exposes the stance, while a smaller hood keeps the character stylized
without the earlier chibi proportion. Material ids remain independent from
animation conditions so the belt and cape trim no longer rotate around the
head. A geometry test verifies finite indexed data and the presence of all seven
articulated groups.

During this review, exact 2560×1440 clipped PNGs were found to cover only the
top-left half of the emulated page: the app browser exports full pages at two
host pixels per CSS pixel even though the page reports DPR 1. The old files are
retained only as HUD telemetry records. A new `?capture` path uses a 1280×720 CSS
page and an explicitly doubled 2560×1440 WebGPU target, producing a complete
16:9 2560×1440 frame without changing camera, terrain, material, gameplay, or
draw topology. `?evidence` remains the 2560×1440 CSS performance path. No model,
skeleton, animation clip, image, texture, video frame, or third-party code is
introduced.

## 2026-08-14 — Authored pose envelopes preserve physical causality

The articulated geometry still read as one continuous procedural deformation:
speed, skid, jump height, and impact all contributed at once, but there was no
explicit transition contract between idle, riding, braking, airborne, and
landing poses. Adding animation states directly to velocity or snow contact was
rejected because it would recreate the earlier input-magic problem.

The retained controller selects one pose target with strict physical priority:
airborne height, then grounded landing compression, then visible skid, then
speed, then idle. Four non-idle weights approach that one-hot target with the
same exponential rate, so their sum cannot overshoot during a transition. Air
enters fastest at 14 s⁻¹, followed by land at 12, brake at 9, ride at 5.5, and
idle recovery at 4.5. Tests assert state priority, bounded interpolation, and
negative-delta stability.

The additional 16-byte uniform drives only the existing part hierarchy. Ride
settles into edge-loaded flex; brake deepens both knees and stabilizes the arms;
air tucks the legs and opens the shoulders; land adds a short absorption pose;
idle restores restrained breathing. Velocity, heading, board yaw, ballistic
height, gravity, deformation, and contact activation still come exclusively
from their existing physical paths. No pass, texture, draw call, model,
skeleton, animation clip, motion sample, image, or third-party code is added.

## 2026-08-14 — Casting is an action, not the default snowboard stance

The previous base mesh encoded the right forearm in a raised casting position.
Even after state transitions were added, every ordinary ride therefore read as
if the rider were permanently waving or casting. The same review also showed
that the first ride envelope preserved too much of the upright base stance.

The retained vertex hierarchy now separates intent without adding a new
gameplay state. The live procedural spell pulse supplies a short casting blend;
outside that pulse the right forearm relaxes at idle and opens to a lower
balance angle during ride, brake, air, or land. The opposite forearm moves to an
asymmetric counterbalance only in athletic states. Knee loading is strengthened
independently for ride, brake, air, and land while continuing to inherit the
existing physical pose weights.

This is a visual correction, not an animation shortcut. Spell timing, velocity,
board yaw, jump height, landing impact, and snow-contact stamping remain
unchanged. The implementation is original WGSL over the project-owned part
mesh, with no imported animation, pose reference, or third-party asset.
