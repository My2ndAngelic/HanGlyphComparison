const loadedFonts = new Set(['sans']);

const BASE = 'https://fonts.googleapis.com/css2';
const WEIGHTS = 'wght@400;700';

export function buildFontUrl(preset) {
  const families = [...new Set(Object.values(preset.fonts))]
    .map(name => `family=${name.replace(/ /g, '+')}:${WEIGHTS}`)
    .join('&');
  return `${BASE}?${families}&display=swap`;
}

export function loadFont(presetKey, preset) {
  return new Promise((resolve) => {
    if (loadedFonts.has(presetKey)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = buildFontUrl(preset);
    link.onload = () => {
      loadedFonts.add(presetKey);
      resolve();
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

export function loadSingleFont(fontName) {
  return new Promise((resolve) => {
    const key = fontName.toLowerCase();
    if (loadedFonts.has(key)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${BASE}?family=${fontName.replace(/ /g, '+')}:${WEIGHTS}&display=swap`;
    link.onload = () => { loadedFonts.add(key); resolve(); };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}
