# Release-candidate acceptance

This record defines what is actually accepted in the current Snowveil build.
It separates verified product scope from comparisons that would imply an
unbuilt AAA production or offline physical simulation.

## Acceptance matrix

| Requirement | Shipped implementation | Authoritative evidence | Decision |
| --- | --- | --- | --- |
| Snow-world visual quality | Procedural dunes, wind response, low sun, HDR resolve, atmospheric depth, glints, terrain shadow, and world-space spindrift | `QUALITY.md`; release desktop and calibrated-target captures | accepted |
| Persistent snow interaction | 1536² GPU history, swept tapered board contact, bounded load, edge ridge, jump gap, spell crater, and decay | snow-track and Ice Pulse evidence; automated source contracts | accepted |
| Credible snowboard causality | Nose-first travel, board/velocity separation during carve, transverse braking, torso/head travel look, slope response, and physical Space jump | causality, terrain-coupled, brake, jump, and release mobile-action captures | accepted |
| Course-edge wayfinding and recovery | Terrain-coupled rope, poles, reflectors, and pennants identify the playable perimeter; outward approach warns early and transitions into tested tangential/inward recovery | slope-boundary evidence; controller and geometry tests | accepted |
| Reusable downhill race | Data-defined 62-metre Downline course, groomed fall line, checker start, marked sides, flagged goal, live timing, delayed result, retry, hub return, and hub entry reuse the established scene systems | Downline start, descent, and result captures; course and browser-flow tests | accepted |
| Original playable loop | Three procedural frost sigils, directional hand-to-impact Ice Pulse, persistent ritual marks, completion state, procedural audio | completed production route; `ORIGINALITY.md` | accepted |
| Character and weather grounding | Articulated state poses, relative-airflow cloth, powder response, terrain-coupled spindrift, and analytic low-sun actor shadows | dated quality checkpoints and release production route | accepted |
| Desktop, touch, and accessibility | Keyboard/pointer controls, six held touch actions, semantic labels, mobile-safe HUD, gesture-gated audio | 480×659 idle/action captures; rendered-HTML tests | accepted |
| Capability failure | Exact unsupported-WebGPU branch with a readable message and no counterfeit fallback render | release fallback capture | accepted |
| Performance honesty | 60 FPS production route at 1280×720; fixed true 2560×1440 target measured separately at 44 FPS | `PERF.md`; release route and target captures | accepted with documented high-resolution limit |
| Originality and licences | No imported art, model, animation, image, HDRI, sample, scan, or footage; procedural project output and dependency notices | `ASSETS.md`, `ORIGINALITY.md`, `THIRD_PARTY_NOTICES.md` | accepted |
| Security and reproducibility | Exact audited build-tool pins; full and production npm audits at zero; production build and 35 tests pass | lockfile, audit output, test suite | accepted |
| Publishability | Production server completes the same three-sigil route; Sites hosting descriptor is present | production browser audit; `.openai/hosting.json` | accepted, not deployed |

## Release decision

Snowveil is release-ready as a polished playable WebGPU vertical slice. The
current acceptance does not claim a full commercial content set, native-1440p
60 FPS on the audited machine, granular snow fracture, volumetric fluid snow,
or a production skeletal-animation pipeline. Those are different scopes, not
hidden completion claims.

The GitHub repository remains private. No hosted deployment is performed by
this audit because publishing to an external host requires explicit user
authorization.
