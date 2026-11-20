// Fixed scenes for the screenshot helper. Each preset lists the two sample
// photos, the caption and the crop values used by tools/shoot.mjs.

export const SAMPLE_PHOTOS = [
  { key: 'boulevard', src: 'samples/boulevard.jpg', name: 'Boulevard' },
  { key: 'pier', src: 'samples/pier.jpg', name: 'Pier' },
];

export const SHOT_PRESETS = {
  landscape: {
    aspect: 'landscape',
    caption: 'LAST EXIT TO PARADISE',
    subtitle: 'A PALM COAST PICTURES PRODUCTION',
    panels: [
      { src: 0, zoom: 1.1, offX: 0, offY: 0.48 },
      { src: 1, zoom: 1, offX: 0, offY: 0 },
      { src: 0, zoom: 1.08, offX: 0, offY: 0.05 },
    ],
  },
  square: {
    aspect: 'square',
    caption: 'VICE CITY NIGHTS',
    subtitle: 'THE SUN NEVER SETS ON THE STRIP',
    panels: [
      { src: 0, zoom: 1.15, offX: 0, offY: 0.24 },
      { src: 1, zoom: 1, offX: 0, offY: 0.1 },
      { src: 0, zoom: 1.05, offX: 0, offY: 0.2 },
    ],
  },
  portrait: {
    aspect: 'portrait',
    caption: 'NEON COAST',
    subtitle: 'SOMEWHERE PAST THE PALMS',
    panels: [
      { src: 0, zoom: 1.1, offX: 0, offY: 0.72 },
      { src: 0, zoom: 1, offX: 0, offY: 0.5 },
      { src: 1, zoom: 1, offX: 0, offY: 0.28 },
    ],
  },
  editor: {
    aspect: 'landscape',
    caption: 'LAST EXIT TO PARADISE',
    subtitle: 'A PALM COAST PICTURES PRODUCTION',
    panels: [
      { src: 0, zoom: 1.1, offX: 0, offY: 0.48 },
      { src: 1, zoom: 1, offX: 0, offY: 0 },
      { src: 0, zoom: 1.08, offX: 0, offY: 0.05 },
    ],
  },
};

export function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

export async function waitForFonts() {
  if (!document.fonts) return;
  try {
    await document.fonts.load('400 100px Anton');
  } catch {
    // The system fallback still draws a usable poster.
  }
  await document.fonts.ready;
}
