// The Vice Horizon backdrop: a magenta-to-orange sky, a slitted sun, a dark
// skyline and two palms, all built from gradients and canvas paths.

export const PALETTE = {
  ink: '#07030f',
  navyTop: '#0a0d22',
  navyBottom: '#161d45',
  gold: '#e8c46a',
  goldBright: '#ffe9a8',
  magenta: '#ff3d93',
  orange: '#ff8a3d',
  white: '#ffffff',
};

function seedRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skyGradient(ctx, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#160631');
  g.addColorStop(0.1, '#4a0e63');
  g.addColorStop(0.2, '#9c178d');
  g.addColorStop(0.33, '#e62a80');
  g.addColorStop(0.5, '#ff5a5f');
  g.addColorStop(0.68, '#ff963e');
  g.addColorStop(0.86, '#ffc46e');
  g.addColorStop(1, '#ffe0a0');
  return g;
}

function sunSprite(radius) {
  const size = Math.ceil(radius * 2);
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const c = sprite.getContext('2d');
  const cx = radius;
  const cy = radius;

  const disc = c.createLinearGradient(0, 0, 0, size);
  disc.addColorStop(0, '#fff3b8');
  disc.addColorStop(0.42, '#ffc15c');
  disc.addColorStop(0.78, '#ff703f');
  disc.addColorStop(1, '#ff3d86');
  c.fillStyle = disc;
  c.beginPath();
  c.arc(cx, cy, radius, 0, Math.PI * 2);
  c.fill();

  c.globalCompositeOperation = 'destination-out';
  const slits = 6;
  for (let i = 0; i < slits; i += 1) {
    const t = i / (slits - 1);
    const y = cy - radius * 0.1 + t * radius * 0.82;
    const h = radius * (0.032 + t * 0.05);
    c.fillRect(0, y, size, h);
  }
  c.globalCompositeOperation = 'source-over';
  return sprite;
}

function cloud(ctx, cx, cy, rx, ry, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.04)'));
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawClouds(ctx, w, h, layout) {
  const top = layout.panelTop;
  cloud(ctx, w * 0.19, top * 0.24, w * 0.2, top * 0.09, 'rgba(255, 92, 158, 0.14)');
  cloud(ctx, w * 0.79, top * 0.4, w * 0.24, top * 0.075, 'rgba(255, 146, 110, 0.13)');
  cloud(ctx, w * 0.55, top * 0.78, w * 0.3, top * 0.06, 'rgba(255, 190, 130, 0.12)');
}

function drawSun(ctx, w, h, layout) {
  const radius = Math.min(w, h) * 0.09;
  const cx = w * 0.5;
  const cy = layout.panelTop * 0.49;

  const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 3.4);
  glow.addColorStop(0, 'rgba(255, 208, 130, 0.55)');
  glow.addColorStop(0.32, 'rgba(255, 110, 150, 0.26)');
  glow.addColorStop(0.7, 'rgba(220, 40, 150, 0.1)');
  glow.addColorStop(1, 'rgba(220, 40, 150, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - radius * 3.4, cy - radius * 3.4, radius * 6.8, radius * 6.8);

  const sprite = sunSprite(radius);
  ctx.drawImage(sprite, cx - radius, cy - radius);

  const haze = ctx.createLinearGradient(0, layout.panelTop - h * 0.14, 0, layout.panelTop);
  haze.addColorStop(0, 'rgba(255, 140, 90, 0)');
  haze.addColorStop(1, 'rgba(255, 185, 110, 0.45)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, layout.panelTop - h * 0.14, w, h * 0.14);
}

function drawSkyline(ctx, w, h, layout) {
  const base = layout.panelTop + h * 0.004;

  ctx.fillStyle = '#2a1048';
  const far = seedRandom(90210);
  let x = -w * 0.01;
  while (x < w * 1.01) {
    const bw = w * (0.014 + far() * 0.03);
    const bh = h * (0.02 + far() * 0.072);
    ctx.fillRect(x, base - bh, bw, bh + h * 0.01);
    x += bw + w * 0.006;
  }

  ctx.fillStyle = '#140827';
  const near = seedRandom(411);
  x = -w * 0.02;
  while (x < w * 1.02) {
    const bw = w * (0.02 + near() * 0.052);
    const bh = h * (0.028 + near() * 0.122);
    const top = base - bh;
    ctx.fillRect(x, top, bw, bh + h * 0.01);

    if (near() > 0.78) {
      ctx.fillRect(x + bw * 0.48, top - h * 0.045, Math.max(1, w * 0.0016), h * 0.045);
    }

    const cols = Math.max(2, Math.floor(bw / (w * 0.008)));
    const rows = Math.max(3, Math.floor(bh / (h * 0.026)));
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        if (near() > 0.86) {
          const wx = x + (bw * (c + 0.5)) / cols;
          const wy = top + (bh * (r + 0.5)) / rows;
          ctx.fillStyle =
            near() > 0.7 ? 'rgba(255, 196, 110, 0.62)' : 'rgba(126, 222, 255, 0.42)';
          ctx.fillRect(wx, wy, Math.max(1, w * 0.0015), Math.max(1, h * 0.004));
        }
      }
    }
    ctx.fillStyle = '#140827';
    x += bw + w * 0.004;
  }
}

function frond(ctx, cx, cy, angle, length, width, droop) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const px = -dy;
  const py = dx;
  const tipX = cx + dx * length;
  const tipY = cy + dy * length + droop;
  const c1x = cx + dx * length * 0.46 + px * width;
  const c1y = cy + dy * length * 0.46 + py * width - length * 0.08;
  const c2x = cx + dx * length * 0.46 - px * width;
  const c2y = cy + dy * length * 0.46 - py * width - length * 0.08;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(c1x, c1y, tipX, tipY);
  ctx.quadraticCurveTo(c2x, c2y, cx, cy);
  ctx.fill();
}

function drawPalm(ctx, w, h, baseX, baseY, crownX, crownY, baseWidth) {
  const topWidth = Math.max(2, w * 0.0034);
  const midX = (baseX + crownX) / 2;

  ctx.fillStyle = '#100721';
  ctx.beginPath();
  ctx.moveTo(baseX - baseWidth * 0.5, baseY);
  ctx.bezierCurveTo(
    baseX - baseWidth * 0.35,
    baseY - (baseY - crownY) * 0.4,
    midX - topWidth * 0.4,
    crownY + (baseY - crownY) * 0.28,
    crownX - topWidth * 0.5,
    crownY,
  );
  ctx.lineTo(crownX + topWidth * 0.5, crownY);
  ctx.bezierCurveTo(
    midX + topWidth * 0.4,
    crownY + (baseY - crownY) * 0.28,
    baseX + baseWidth * 0.35,
    baseY - (baseY - crownY) * 0.4,
    baseX + baseWidth * 0.5,
    baseY,
  );
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 150, 170, 0.16)';
  ctx.lineWidth = Math.max(1, w * 0.0012);
  for (let i = 1; i < 7; i += 1) {
    const t = i / 7;
    const y = baseY + (crownY - baseY) * t;
    const x = baseX + (crownX - baseX) * t;
    const half = (baseWidth * 0.5) * (1 - t) + topWidth * 0.5 * t;
    ctx.beginPath();
    ctx.moveTo(x - half * 0.7, y);
    ctx.quadraticCurveTo(x, y + h * 0.006, x + half * 0.7, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#100721';
  const leaves = 9;
  for (let i = 0; i < leaves; i += 1) {
    const t = (i + 0.5) / leaves;
    const angle = -Math.PI * 0.5 + (t - 0.5) * Math.PI * 1.72;
    const length = (baseY - crownY) * (0.2 + 0.11 * Math.sin(Math.PI * t));
    const width = length * 0.12;
    const droop = length * (0.18 + 0.14 * Math.abs(Math.cos(t * Math.PI)));
    frond(ctx, crownX, crownY, angle, length, width, droop);
  }

  ctx.strokeStyle = 'rgba(255, 170, 140, 0.22)';
  ctx.lineWidth = Math.max(1, w * 0.0011);
  for (let i = 0; i < 3; i += 1) {
    const angle = -Math.PI * 0.5 + (i - 1) * 0.5;
    const length = (baseY - crownY) * 0.3;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(angle) * length * 0.5,
      crownY + Math.sin(angle) * length * 0.5 - length * 0.08,
      crownX + Math.cos(angle) * length,
      crownY + Math.sin(angle) * length + length * 0.18,
    );
    ctx.stroke();
  }
}

export function drawBackdrop(ctx, w, h, layout) {
  ctx.fillStyle = skyGradient(ctx, h);
  ctx.fillRect(0, 0, w, h);

  const stars = seedRandom(77);
  ctx.fillStyle = 'rgba(255, 238, 210, 0.55)';
  for (let i = 0; i < 32; i += 1) {
    const sx = stars() * w;
    const sy = stars() * layout.panelTop * 0.45;
    const r = Math.max(0.6, stars() * w * 0.0012);
    ctx.globalAlpha = 0.25 + stars() * 0.5;
    ctx.fillRect(sx, sy, r, r);
  }
  ctx.globalAlpha = 1;

  drawClouds(ctx, w, h, layout);
  drawSun(ctx, w, h, layout);
  drawSkyline(ctx, w, h, layout);
}

export function drawForegroundPalms(ctx, w, h, layout) {
  const baseY = layout.panelBottom + h * 0.015;
  const crownY = layout.panelTop - h * 0.11;
  const height = baseY - crownY;
  const trunk = w * 0.0115;

  drawPalm(ctx, w, h, w * 0.032, baseY, w * 0.065, crownY + height * 0.04, trunk);
  drawPalm(ctx, w, h, w * 0.968, baseY, w * 0.934, crownY, trunk * 0.92);
}

let grainTile = null;

function grainPattern() {
  if (grainTile) return grainTile;
  const size = 180;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d');
  const image = c.createImageData(size, size);
  const rand = seedRandom(2026);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = Math.floor(rand() * 60);
  }
  c.putImageData(image, 0, 0);
  grainTile = canvas;
  return grainTile;
}

export function drawGrain(ctx, w, h) {
  const pattern = ctx.createPattern(grainPattern(), 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawVignette(ctx, w, h) {
  const vignette = ctx.createRadialGradient(
    w * 0.5,
    h * 0.46,
    Math.min(w, h) * 0.22,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.72,
  );
  vignette.addColorStop(0, 'rgba(4, 0, 14, 0)');
  vignette.addColorStop(0.7, 'rgba(4, 0, 14, 0.16)');
  vignette.addColorStop(1, 'rgba(4, 0, 14, 0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}
