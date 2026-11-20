// Poster layout and canvas rendering for Vice Horizon. Everything is laid out
// in proportion to the poster size, so the preview and every export share the
// same composition.

import {
  PALETTE,
  drawBackdrop,
  drawForegroundPalms,
  drawGrain,
  drawVignette,
} from './scene.js';

export const SIZES = {
  landscape: { w: 1920, h: 1080, name: 'Landscape', label: '1920 × 1080' },
  square: { w: 1080, h: 1080, name: 'Square', label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, name: 'Portrait', label: '1080 × 1350' },
};

export const PREVIEW_SIZES = {
  landscape: { w: 1280, h: 720 },
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
};

const PANEL_NAMES = {
  landscape: ['Hero panel', 'Second panel', 'Third panel'],
  square: ['Hero left', 'Upper right', 'Lower right'],
  portrait: ['Top hero', 'Lower left', 'Lower right'],
};

export function panelNames(aspect) {
  return PANEL_NAMES[aspect] ?? PANEL_NAMES.landscape;
}

export function layoutFor(aspect, w, h) {
  if (aspect === 'portrait') {
    const margin = w * 0.045;
    const panelTop = h * 0.245;
    const heroBottom = h * 0.545;
    const lowerTop = h * 0.565;
    const lowerBottom = h * 0.745;
    const usable = w - margin * 2;
    const gap = usable * 0.03;
    const lowerWidth = (usable - gap) / 2;
    return {
      margin,
      panelTop,
      panelBottom: lowerBottom,
      captionTop: h * 0.775,
      panels: [
        { x: margin, y: panelTop, w: usable, h: heroBottom - panelTop },
        { x: margin, y: lowerTop, w: lowerWidth, h: lowerBottom - lowerTop },
        {
          x: margin + lowerWidth + gap,
          y: lowerTop,
          w: lowerWidth,
          h: lowerBottom - lowerTop,
        },
      ],
    };
  }

  if (aspect === 'square') {
    const margin = w * 0.04;
    const panelTop = h * 0.23;
    const panelBottom = h * 0.73;
    const usable = w - margin * 2;
    const gap = usable * 0.025;
    const heroWidth = usable * 0.6;
    const sideWidth = usable - heroWidth - gap;
    const sideHeight = (panelBottom - panelTop - gap) / 2;
    return {
      margin,
      panelTop,
      panelBottom,
      captionTop: h * 0.765,
      panels: [
        { x: margin, y: panelTop, w: heroWidth, h: panelBottom - panelTop },
        { x: margin + heroWidth + gap, y: panelTop, w: sideWidth, h: sideHeight },
        {
          x: margin + heroWidth + gap,
          y: panelTop + sideHeight + gap,
          w: sideWidth,
          h: sideHeight,
        },
      ],
    };
  }

  const margin = w * 0.038;
  const panelTop = h * 0.235;
  const panelBottom = h * 0.735;
  const usable = w - margin * 2;
  const gap = usable * 0.02;
  const heroWidth = usable * 0.57;
  const otherWidth = (usable - heroWidth - gap * 2) / 2;
  return {
    margin,
    panelTop,
    panelBottom,
    captionTop: h * 0.765,
    panels: [
      { x: margin, y: panelTop, w: heroWidth, h: panelBottom - panelTop },
      {
        x: margin + heroWidth + gap,
        y: panelTop,
        w: otherWidth,
        h: panelBottom - panelTop,
      },
      {
        x: margin + heroWidth + gap * 2 + otherWidth,
        y: panelTop,
        w: otherWidth,
        h: panelBottom - panelTop,
      },
    ],
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function panelGeometry(panel, rect, img) {
  const nw = img ? img.naturalWidth || img.width : 1;
  const nh = img ? img.naturalHeight || img.height : 1;
  const base = panel.mode === 'fit'
    ? Math.min(rect.w / nw, rect.h / nh)
    : Math.max(rect.w / nw, rect.h / nh);
  const scale = base * clamp(panel.zoom || 1, 1, 3.5);
  const dw = nw * scale;
  const dh = nh * scale;
  const slackX = Math.abs(dw - rect.w) / 2 / rect.w;
  const slackY = Math.abs(dh - rect.h) / 2 / rect.h;
  const offX = clamp(panel.offX || 0, -slackX, slackX);
  const offY = clamp(panel.offY || 0, -slackY, slackY);
  return {
    dw,
    dh,
    x: rect.x + (rect.w - dw) / 2 + offX * rect.w,
    y: rect.y + (rect.h - dh) / 2 + offY * rect.h,
  };
}

export function clampPanel(panel, rect, img) {
  if (!img) return;
  const g = panelGeometry(panel, rect, img);
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const base = panel.mode === 'fit'
    ? Math.min(rect.w / nw, rect.h / nh)
    : Math.max(rect.w / nw, rect.h / nh);
  const scale = base * clamp(panel.zoom || 1, 1, 3.5);
  const slackX = Math.abs(nw * scale - rect.w) / 2 / rect.w;
  const slackY = Math.abs(nh * scale - rect.h) / 2 / rect.h;
  panel.offX = clamp(panel.offX || 0, -slackX, slackX);
  panel.offY = clamp(panel.offY || 0, -slackY, slackY);
  return g;
}

function drawPhotoPanel(ctx, rect, panel, img) {
  const g = panelGeometry(panel, rect, img);
  ctx.drawImage(img, g.x, g.y, g.dw, g.dh);

  const grade = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  grade.addColorStop(0, 'rgba(255, 64, 158, 0.46)');
  grade.addColorStop(0.52, 'rgba(255, 140, 70, 0.34)');
  grade.addColorStop(1, 'rgba(12, 10, 48, 0.6)');
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  const lift = ctx.createLinearGradient(0, rect.y + rect.h * 0.45, 0, rect.y + rect.h);
  lift.addColorStop(0, 'rgba(8, 3, 24, 0)');
  lift.addColorStop(1, 'rgba(8, 3, 24, 0.42)');
  ctx.fillStyle = lift;
  ctx.fillRect(rect.x, rect.y + rect.h * 0.45, rect.w, rect.h * 0.55);
}

function drawPlaceholder(ctx, rect, w) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#2b1147');
  g.addColorStop(0.55, '#48145c');
  g.addColorStop(1, '#150a2e');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 190, 120, 0.28)';
  ctx.lineWidth = Math.max(1, w * 0.0016);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2 - w * 0.01;
  const r = Math.min(rect.w, rect.h) * 0.16;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r * 1.25, cy + Math.sin(angle) * r * 1.25);
    ctx.lineTo(cx + Math.cos(angle) * r * 1.7, cy + Math.sin(angle) * r * 1.7);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(232, 196, 106, 0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.max(9, Math.min(rect.w, rect.h) * 0.055)}px "Segoe UI", system-ui, sans-serif`;
  ctx.letterSpacing = '0.26em';
  ctx.fillText('ADD A PHOTO', cx, cy + r * 2.1);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

function drawPanel(ctx, rect, panel, photos, state, index, showSelection, w) {
  const img = panel.photoId ? photos.get(panel.photoId)?.img : null;
  const offset = Math.max(2, w * 0.0028);

  ctx.save();
  ctx.fillStyle = 'rgba(3, 0, 12, 0.62)';
  ctx.fillRect(rect.x + offset, rect.y + offset, rect.w, rect.h);
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = '#170a2e';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (img) drawPhotoPanel(ctx, rect, panel, img);
  else drawPlaceholder(ctx, rect, w);
  ctx.restore();

  const selected = showSelection && state.selected === index;
  const line = Math.max(1.4, w * 0.0016);
  ctx.save();
  if (selected) {
    ctx.shadowColor = 'rgba(255, 220, 130, 0.6)';
    ctx.shadowBlur = w * 0.008;
  }
  ctx.strokeStyle = selected ? PALETTE.goldBright : 'rgba(232, 196, 106, 0.82)';
  ctx.lineWidth = selected ? line * 2 : line;
  ctx.strokeRect(rect.x + line / 2, rect.y + line / 2, rect.w - line, rect.h - line);
  ctx.restore();

  if (selected) {
    const tick = Math.max(10, w * 0.014);
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = Math.max(2, w * 0.0022);
    const corners = [
      [rect.x, rect.y, 1, 1],
      [rect.x + rect.w, rect.y, -1, 1],
      [rect.x, rect.y + rect.h, 1, -1],
      [rect.x + rect.w, rect.y + rect.h, -1, -1],
    ];
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + sx * tick, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * tick);
      ctx.stroke();
    }
  }
}

function fitFont(ctx, text, maxWidth, startSize, minSize) {
  let lo = minSize;
  let hi = Math.max(minSize, startSize);
  for (let i = 0; i < 18; i += 1) {
    const mid = (lo + hi) / 2;
    ctx.font = `400 ${mid}px Anton, Impact, "Arial Narrow", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) lo = mid;
    else hi = mid;
  }
  return lo;
}

function drawCaptionBand(ctx, w, h, layout, state) {
  const top = layout.captionTop;
  const bandH = h - top;
  const margin = layout.margin;

  const band = ctx.createLinearGradient(0, top, 0, h);
  band.addColorStop(0, PALETTE.navyTop);
  band.addColorStop(0.45, '#0c1130');
  band.addColorStop(1, PALETTE.navyBottom);
  ctx.fillStyle = band;
  ctx.fillRect(0, top, w, bandH);

  const neon = ctx.createLinearGradient(0, top, w, top);
  neon.addColorStop(0, 'rgba(255, 61, 147, 0)');
  neon.addColorStop(0.5, 'rgba(255, 61, 147, 0.5)');
  neon.addColorStop(1, 'rgba(255, 138, 61, 0)');
  ctx.fillStyle = neon;
  ctx.fillRect(0, top, w, Math.max(1.5, h * 0.003));

  const ruleY = top + bandH * 0.082;
  const ruleThickness = Math.max(1.4, h * 0.0018);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(margin, ruleY, w - margin * 2, ruleThickness);
  const diamond = Math.max(4, h * 0.006);
  for (const dx of [margin, w / 2, w - margin]) {
    ctx.save();
    ctx.translate(dx, ruleY + ruleThickness / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-diamond / 2, -diamond / 2, diamond, diamond);
    ctx.restore();
  }

  const caption = (state.caption || '').trim().toUpperCase() || 'YOUR TITLE';
  const maxWidth = w - margin * 2.6;
  const capSize = fitFont(ctx, caption, maxWidth, bandH * 0.62, bandH * 0.12);
  const capBaseline = top + bandH * 0.4 + capSize * 0.34;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${capSize}px Anton, Impact, "Arial Narrow", sans-serif`;
  ctx.letterSpacing = '0.005em';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillText(caption, w / 2 + w * 0.0022, capBaseline + h * 0.0045);
  ctx.fillStyle = PALETTE.white;
  ctx.fillText(caption, w / 2, capBaseline);
  ctx.letterSpacing = '0px';

  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (subtitle) {
    const subSize = Math.max(10, bandH * 0.07);
    ctx.font = `600 ${subSize}px "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
    ctx.letterSpacing = '0.24em';
    ctx.fillStyle = 'rgba(246, 226, 178, 0.9)';
    ctx.fillText(subtitle, w / 2, top + bandH * 0.72);
    ctx.letterSpacing = '0px';
  }

  const rowY = top + bandH * 0.9;
  const studioSize = Math.max(8, bandH * 0.055);
  ctx.textAlign = 'left';
  ctx.font = `600 ${studioSize}px "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
  ctx.letterSpacing = '0.2em';
  ctx.fillStyle = 'rgba(232, 219, 196, 0.78)';
  ctx.fillText('PALM COAST PICTURES', margin, rowY + studioSize * 0.35);
  ctx.letterSpacing = '0px';

  const box = bandH * 0.16;
  const boxX = w - margin - box;
  const boxY = rowY - box * 0.5;
  ctx.fillStyle = 'rgba(4, 6, 22, 0.85)';
  ctx.fillRect(boxX, boxY, box, box);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = Math.max(1.2, h * 0.0016);
  ctx.strokeRect(boxX + 1, boxY + 1, box - 2, box - 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${box * 0.72}px Anton, Impact, "Arial Narrow", sans-serif`;
  ctx.fillStyle = PALETTE.white;
  ctx.fillText('M', boxX + box / 2, boxY + box / 2 + box * 0.04);
  ctx.textBaseline = 'alphabetic';
}

export function renderTo(ctx, w, h, state, photos, options = {}) {
  const showSelection = options.selection !== false && !state.clean;
  const layout = layoutFor(state.aspect, w, h);

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  drawBackdrop(ctx, w, h, layout);

  layout.panels.forEach((rect, index) => {
    drawPanel(ctx, rect, state.panels[index], photos, state, index, showSelection, w);
  });

  drawForegroundPalms(ctx, w, h, layout);
  drawCaptionBand(ctx, w, h, layout, state);
  drawVignette(ctx, w, h);

  const frame = Math.max(1, w * 0.0012);
  ctx.strokeStyle = 'rgba(232, 196, 106, 0.32)';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);

  drawGrain(ctx, w, h);
  ctx.restore();
}

export function renderPoster(canvas, state, photos, options = {}) {
  const dims = PREVIEW_SIZES[state.aspect] ?? PREVIEW_SIZES.landscape;
  if (canvas.width !== dims.w || canvas.height !== dims.h) {
    canvas.width = dims.w;
    canvas.height = dims.h;
  }
  renderTo(canvas.getContext('2d'), dims.w, dims.h, state, photos, options);
}

export function renderForExport(canvas, state, photos) {
  const dims = SIZES[state.aspect] ?? SIZES.landscape;
  canvas.width = dims.w;
  canvas.height = dims.h;
  renderTo(canvas.getContext('2d'), dims.w, dims.h, state, photos, { selection: false });
  return dims;
}
