// Local photo loading. Files stay on this machine: an object URL feeds an
// Image element and nothing is ever uploaded.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

export function prettyName(name) {
  const base = name.replace(/\.[^./\\]+$/, '').replace(/[_-]+/g, ' ').trim();
  return (base || 'Photo').slice(0, 28);
}

export async function photoFromFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Not an image');
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return { img, url, name: prettyName(file.name) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
