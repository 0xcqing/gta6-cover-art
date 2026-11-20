# Vice Horizon

A static, offline GTA 6 style cover art maker: drop in your own photos, crop them into a three-panel sunset collage, set a neon caption and export a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

Bounty: https://make.fun/bounty/gta6-cover-art-01

[![make.fun competition badge](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun rank badge](https://make.fun/badge/gta6-cover-art-01/0xcqing/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun reward badge](https://make.fun/badge/gta6-cover-art-01/0xcqing/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

## Run the app

The app is plain static files with no build step and no network use.

```sh
node serve.ts
```

Then open http://localhost:8080. Add photos with the Add photos button or by dropping image files on the page, click a panel, choose a photo, drag/scroll to crop, write the caption and subtitle, pick an export size and press Export PNG.

## Package an entry

```sh
mkdir out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`.

## Screenshots

`tools/shoot.mjs` starts the static server, drives headless Chrome through the DevTools protocol and writes the four files in `screenshots/`. Font: Anton (SIL Open Font License), stored with its OFL text in `app/fonts/`.
