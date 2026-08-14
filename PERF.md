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
