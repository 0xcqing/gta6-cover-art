// Vice Horizon, a GTA 6 style cover art maker: three photo collage panels,
// sunset scenery, neon lettering and offline PNG export, all as static files
// in app/. This script packages app/ and screenshots/ for the judge and writes
// dossier.json with the vendored make.fun dossier builder.
//
// Local run (the container uses /output by default):
//   mkdir out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Preview the app itself with `node serve.ts` and open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

mkdirSync(join(here, 'screenshots'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Mirrors the scorer's reference/gate.json caps. The vendored builder reads
// these limits, verifies the packaged tree, and serializes the dossier in a
// stable order so two runs produce identical bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
