let cache = null;

export async function getGoogleFonts() {
  if (cache) return cache;
  try {
    const res = await fetch('https://fonts.google.com/metadata/fonts');
    const text = await res.text();
    const json = JSON.parse(text.replace(/^\)\]\}'\n/, ''));
    cache = json.items.map(f => f.family);
  } catch {
    cache = (await import('./google-fonts-fallback.js')).FALLBACK;
  }
  return cache;
}
