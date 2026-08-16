# Third-party dependency record

Snowveil's scene, geometry, shaders, animation, interface, symbols, and sound
design are original project code. The packages below provide application or
build infrastructure; they do not supply art, audio, models, textures, or game
content.

This file is a practical licence and security record, not legal advice. Exact
resolved versions and package metadata remain authoritative in
`package-lock.json` and each installed package's licence file.

## Direct runtime dependencies

| Package | Version | Declared licence |
| --- | ---: | --- |
| `react` | 19.2.8 | MIT |
| `react-dom` | 19.2.8 | MIT |

## Direct development and build dependencies

| Package | Version | Declared licence |
| --- | ---: | --- |
| `@cloudflare/vite-plugin` | 1.52.1 | MIT |
| `@eslint/js` | 9.39.4 | MIT |
| `@next/eslint-plugin-next` | 16.2.6 | MIT |
| `@types/node` | 22.19.19 | MIT |
| `@types/react` | 19.2.14 | MIT |
| `@types/react-dom` | 19.2.3 | MIT |
| `@vitejs/plugin-react` | 6.0.2 | MIT |
| `@vitejs/plugin-rsc` | 0.5.34 | MIT |
| `@webgpu/types` | 0.1.71 | BSD-3-Clause |
| `eslint` | 9.39.4 | MIT |
| `eslint-plugin-jsx-a11y` | 6.10.2 | MIT |
| `eslint-plugin-react` | 7.37.5 | MIT |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT |
| `globals` | 16.4.0 | MIT |
| `react-server-dom-webpack` | 19.2.8 | MIT |
| `typescript` | 5.9.3 | Apache-2.0 |
| `typescript-eslint` | 8.59.3 | MIT |
| `vinext` | 1.0.0-beta.6 | MIT |
| `vite` | 8.2.1 | MIT |
| `wrangler` | 4.123.0 | MIT OR Apache-2.0 |

## Transitive licence families

The 2026-08-14 lockfile audit found declared licences for every resolved npm
package. Besides permissive MIT, Apache, BSD, ISC, 0BSD, CC0, and BlueOak terms,
the build graph includes MPL-2.0 tools, LGPL-3.0-or-later Sharp/libvips binaries,
one CC-BY-4.0 browser-compatibility dataset, and one Python-2.0 package. These
packages remain separately licensed; redistribution must retain their own
notices and comply with their terms.

Notable non-MIT build components include:

- `@img/sharp-libvips-*` under LGPL-3.0-or-later or combined declared terms;
- `@resvg/resvg-wasm`, `@vercel/og`, `axe-core`, `lightningcss`, and `satori`
  under MPL-2.0;
- `caniuse-lite` data under CC-BY-4.0.

## Security audit snapshot

On 2026-08-15, both `npm audit` and `npm audit --omit=dev` reported zero
vulnerabilities. `vinext 1.0.0-beta.6` removes the formerly vulnerable
`image-size 2.0.2` dependency. Its required peer update is pinned alongside it
as `@vitejs/plugin-rsc 0.5.34`; the upgraded graph passes the production build,
the full automated suite, and retained-browser release QA.
