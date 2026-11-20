// Editor wiring for Vice Horizon: local photos go into three collage panels,
// the canvas is the live poster, and PNG export re-renders at full size.

import {
  PREVIEW_SIZES,
  SIZES,
  layoutFor,
  panelNames,
  clampPanel,
  renderPoster,
  renderForExport,
} from './poster.js';
import { loadImage, photoFromFile } from './photos.js';
import { SAMPLE_PHOTOS, SHOT_PRESETS, nextPaint, waitForFonts } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('poster');
const els = {
  file: $('file'),
  add: $('addBtn'),
  photos: $('photos'),
  photoCount: $('photoCount'),
  panels: $('panels'),
  cropHint: $('cropHint'),
  modeFill: $('modeFill'),
  modeFit: $('modeFit'),
  zoom: $('zoom'),
  caption: $('caption'),
  subtitle: $('subtitle'),
  presets: $('presets'),
  size: $('size'),
  export: $('export'),
  status: $('status'),
  stageLabel: $('stageLabel'),
  dropVeil: $('dropVeil'),
};

const PRESETS = [
  {
    caption: 'LAST EXIT TO PARADISE',
    subtitle: 'A PALM COAST PICTURES PRODUCTION',
  },
  {
    caption: 'VICE CITY NIGHTS',
    subtitle: 'THE SUN NEVER SETS ON THE STRIP',
  },
  {
    caption: 'NEON COAST',
    subtitle: 'SOMEWHERE PAST THE PALMS',
  },
  {
    caption: 'GOLDEN HOUR',
    subtitle: 'THREE FRIENDS. ONE SUMMER.',
  },
];

const state = {
  aspect: 'landscape',
  selected: 0,
  caption: els.caption.value,
  subtitle: els.subtitle.value,
  clean: false,
  panels: [
    { photoId: null, zoom: 1, offX: 0, offY: 0, mode: 'fill' },
    { photoId: null, zoom: 1, offX: 0, offY: 0, mode: 'fill' },
    { photoId: null, zoom: 1, offX: 0, offY: 0, mode: 'fill' },
  ],
};

const photos = [];
const photoById = new Map();
let photoSeq = 0;
let frame = 0;
let drag = null;

function registerPhoto({ name, img, url }) {
  photoSeq += 1;
  const photo = { id: `photo-${photoSeq}`, name, img, url };
  photos.push(photo);
  photoById.set(photo.id, photo);
  return photo;
}

function renderNow() {
  frame = 0;
  renderPoster(canvas, state, photoById);
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(renderNow);
}

function buildPhotos() {
  els.photos.replaceChildren();
  els.photoCount.textContent = String(photos.length);
  if (!photos.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Add your own photos, or drop them anywhere.';
    els.photos.append(empty);
    return;
  }
  const current = state.panels[state.selected];
  for (const photo of photos) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo';
    button.dataset.id = photo.id;
    button.title = `Use ${photo.name} in the selected panel`;
    if (current.photoId === photo.id) button.classList.add('active');
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.name;
    const label = document.createElement('span');
    label.textContent = photo.name;
    button.append(img, label);
    button.addEventListener('click', () => assignPhoto(photo.id));
    els.photos.append(button);
  }
}

function buildPanels() {
  els.panels.replaceChildren();
  const names = panelNames(state.aspect);
  state.panels.forEach((panel, index) => {
    const photo = panel.photoId ? photoById.get(panel.photoId) : null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'panel-btn';
    if (index === state.selected) button.classList.add('active');
    button.title = `Edit ${names[index]}`;

    const mini = document.createElement('span');
    mini.className = 'mini';
    if (photo) mini.style.backgroundImage = `url("${photo.url}")`;
    else mini.classList.add('empty');

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(index + 1);

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = names[index];

    button.append(mini, num, name);
    button.addEventListener('click', () => selectPanel(index));
    els.panels.append(button);
  });
}

function updatePhotoSelection() {
  const current = state.panels[state.selected];
  for (const button of els.photos.querySelectorAll('.photo')) {
    button.classList.toggle('active', button.dataset.id === current.photoId);
  }
}

function updateCropControls() {
  const panel = state.panels[state.selected];
  const names = panelNames(state.aspect);
  els.cropHint.textContent = `Panel ${state.selected + 1} · ${names[state.selected]}`;
  els.zoom.value = String(panel.zoom);
  els.zoom.disabled = !panel.photoId;
  els.modeFill.classList.toggle('active', panel.mode !== 'fit');
  els.modeFit.classList.toggle('active', panel.mode === 'fit');
}

function selectPanel(index) {
  state.selected = index;
  document.querySelectorAll('.panel-btn').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
  updatePhotoSelection();
  updateCropControls();
  schedule();
}

function selectedRect() {
  const layout = layoutFor(state.aspect, canvas.width, canvas.height);
  return layout.panels[state.selected];
}

function assignPhoto(photoId) {
  const panel = state.panels[state.selected];
  panel.photoId = photoId;
  panel.zoom = 1;
  panel.offX = 0;
  panel.offY = 0;
  buildPanels();
  updatePhotoSelection();
  updateCropControls();
  schedule();
  const photo = photoById.get(photoId);
  els.status.textContent = photo ? `${photo.name} placed in panel ${state.selected + 1}.` : '';
}

async function addFiles(fileList) {
  const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
  if (!files.length) {
    els.status.textContent = 'Choose an image file to add.';
    return;
  }
  els.status.textContent = `Reading ${files.length} photo${files.length > 1 ? 's' : ''}…`;
  const added = [];
  for (const file of files) {
    try {
      const loaded = await photoFromFile(file);
      added.push(registerPhoto(loaded));
    } catch {
      // Skip anything the browser cannot decode as an image.
    }
  }
  if (!added.length) {
    els.status.textContent = 'Those files could not be read as images.';
    return;
  }

  for (const photo of added) {
    let index = -1;
    if (!state.panels[state.selected].photoId) index = state.selected;
    if (index === -1) index = state.panels.findIndex((panel) => !panel.photoId);
    if (index === -1) break;
    const panel = state.panels[index];
    panel.photoId = photo.id;
    panel.zoom = 1;
    panel.offX = 0;
    panel.offY = 0;
  }

  buildPhotos();
  buildPanels();
  updateCropControls();
  schedule();
  els.status.textContent = `${added.length} photo${added.length > 1 ? 's' : ''} ready. Click a panel, then a photo, to place it.`;
}

function applyCropLimits() {
  const panel = state.panels[state.selected];
  const photo = panel.photoId ? photoById.get(panel.photoId) : null;
  if (photo) clampPanel(panel, selectedRect(), photo.img);
}

function toPosterPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function hitPanel(point) {
  const layout = layoutFor(state.aspect, canvas.width, canvas.height);
  return layout.panels.findIndex(
    (panel) =>
      point.x >= panel.x &&
      point.x <= panel.x + panel.w &&
      point.y >= panel.y &&
      point.y <= panel.y + panel.h,
  );
}

canvas.addEventListener('pointerdown', (event) => {
  if (state.clean) return;
  const point = toPosterPoint(event);
  const index = hitPanel(point);
  if (index === -1) return;
  selectPanel(index);
  const panel = state.panels[index];
  if (!panel.photoId) return;
  drag = { index, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add('dragging');
  event.preventDefault();
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const dx = ((event.clientX - drag.x) / rect.width) * canvas.width;
  const dy = ((event.clientY - drag.y) / rect.height) * canvas.height;
  const layout = layoutFor(state.aspect, canvas.width, canvas.height);
  const panelRect = layout.panels[drag.index];
  const panel = state.panels[drag.index];
  panel.offX += dx / panelRect.w;
  panel.offY += dy / panelRect.h;
  const photo = panel.photoId ? photoById.get(panel.photoId) : null;
  if (photo) clampPanel(panel, panelRect, photo.img);
  drag.x = event.clientX;
  drag.y = event.clientY;
  schedule();
});

function endDrag() {
  if (!drag) return;
  drag = null;
  canvas.classList.remove('dragging');
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
window.addEventListener('pointerup', endDrag);

canvas.addEventListener(
  'wheel',
  (event) => {
    if (state.clean) return;
    const index = hitPanel(toPosterPoint(event));
    if (index === -1) return;
    event.preventDefault();
    if (index !== state.selected) selectPanel(index);
    const panel = state.panels[index];
    if (!panel.photoId) return;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * Math.exp(-event.deltaY * 0.0016)));
    applyCropLimits();
    updateCropControls();
    schedule();
  },
  { passive: false },
);

els.zoom.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  panel.zoom = Number(els.zoom.value);
  applyCropLimits();
  schedule();
});

for (const [button, mode] of [[els.modeFill, 'fill'], [els.modeFit, 'fit']]) {
  button.addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.mode = mode;
    panel.zoom = 1;
    panel.offX = 0;
    panel.offY = 0;
    updateCropControls();
    schedule();
  });
}

els.caption.addEventListener('input', () => {
  state.caption = els.caption.value;
  schedule();
});
els.subtitle.addEventListener('input', () => {
  state.subtitle = els.subtitle.value;
  schedule();
});

for (const preset of PRESETS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'preset';
  button.textContent = preset.caption;
  button.title = `${preset.caption} — ${preset.subtitle}`;
  button.addEventListener('click', () => {
    state.caption = preset.caption;
    state.subtitle = preset.subtitle;
    els.caption.value = preset.caption;
    els.subtitle.value = preset.subtitle;
    schedule();
  });
  els.presets.append(button);
}

function updateStageLabel() {
  const size = SIZES[state.aspect];
  els.stageLabel.textContent = `${size.name} · ${size.label}`;
}

els.size.addEventListener('change', () => {
  state.aspect = els.size.value;
  state.selected = Math.min(state.selected, 2);
  buildPanels();
  updatePhotoSelection();
  updateCropControls();
  updateStageLabel();
  renderNow();
});

els.add.addEventListener('click', () => els.file.click());
els.file.addEventListener('change', async () => {
  await addFiles(els.file.files);
  els.file.value = '';
});

let dragDepth = 0;
window.addEventListener('dragenter', (event) => {
  if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
  dragDepth += 1;
  document.body.classList.add('drop-active');
});
window.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) document.body.classList.remove('drop-active');
});
window.addEventListener('dragover', (event) => {
  if (Array.from(event.dataTransfer?.types ?? []).includes('Files')) event.preventDefault();
});
window.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('drop-active');
  if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
});

els.export.addEventListener('click', () => {
  const size = SIZES[state.aspect];
  const offscreen = document.createElement('canvas');
  renderForExport(offscreen, state, photoById);
  els.export.disabled = true;
  els.status.textContent = `Rendering ${size.label} PNG…`;
  offscreen.toBlob((blob) => {
    els.export.disabled = false;
    if (!blob) {
      els.status.textContent = 'The browser could not render that PNG.';
      return;
    }
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `vice-horizon-${size.w}x${size.h}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    els.status.textContent = `Saved vice-horizon-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KB).`;
  }, 'image/png');
});

async function applyShot(mode) {
  const config = SHOT_PRESETS[mode];
  state.aspect = config.aspect;
  state.caption = config.caption;
  state.subtitle = config.subtitle;
  state.clean = mode !== 'editor';
  state.selected = 0;
  els.caption.value = config.caption;
  els.subtitle.value = config.subtitle;
  els.size.value = config.aspect;

  const images = await Promise.all(SAMPLE_PHOTOS.map((sample) => loadImage(sample.src)));
  const loaded = SAMPLE_PHOTOS.map((sample, index) =>
    registerPhoto({ name: sample.name, img: images[index], url: sample.src }),
  );

  state.panels.forEach((panel, index) => {
    const crop = config.panels[index] ?? {};
    const photo = loaded[crop.src ?? 0];
    panel.photoId = photo.id;
    panel.zoom = crop.zoom ?? 1;
    panel.offX = crop.offX ?? 0;
    panel.offY = crop.offY ?? 0;
    panel.mode = crop.mode ?? 'fill';
  });

  if (mode !== 'editor') document.body.classList.add('poster-shot');
  buildPhotos();
  buildPanels();
  updateCropControls();
  updateStageLabel();
  renderNow();

  await waitForFonts();
  await nextPaint();
  window.__shotReady = true;
}

function boot() {
  buildPhotos();
  buildPanels();
  updateCropControls();
  updateStageLabel();
  renderNow();

  const shot = new URLSearchParams(location.search).get('shot');
  if (shot && SHOT_PRESETS[shot]) {
    applyShot(shot).catch((error) => {
      console.error(error);
      window.__shotReady = true;
    });
  } else {
    waitForFonts().then(schedule);
  }
}

boot();
