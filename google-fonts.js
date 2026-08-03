let cache = null;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  return JSON.parse(text.replace(/^\)\]\}'\n/, ''));
}

function extractFamilies(json) {
  if (Array.isArray(json)) {
    return json
      .filter(f => f && (!f.type || f.type === 'google'))
      .map(f => f.family)
      .filter(Boolean);
  }
  const list = json.familyMetadataList || json.items || [];
  return list.map(f => f.family).filter(Boolean);
}

export async function getGoogleFonts() {
  if (cache) return cache;
  const sources = [
    'https://api.fontsource.org/v1/fonts',
    'https://fonts.google.com/metadata/fonts'
  ];
  for (const url of sources) {
    try {
      const families = extractFamilies(await fetchJson(url));
      if (families.length) {
        cache = [...new Set(families)].sort();
        return cache;
      }
    } catch {
      // try the next source
    }
  }
  cache = (await import('./google-fonts-fallback.js')).FALLBACK;
  return cache;
}
