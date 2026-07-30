import { PRESETS } from './presets/index.js';
import { REGIONS } from './regions.js';
import { loadFont } from './fonts.js';

const grid = document.getElementById('grid');
const input = document.getElementById('glyph-input');
const presetBar = document.getElementById('preset-bar');
const copyBtn = document.getElementById('copy-btn');
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(light) {
  document.body.classList.toggle('light', light);
  themeToggle.textContent = light ? '\u263E' : '\u2600';
  localStorage.setItem('theme', light ? 'light' : 'dark');
}

const saved = localStorage.getItem('theme');
const prefersLight = saved ? saved === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
applyTheme(prefersLight);

themeToggle.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('light'));
});

let activePreset = 'sans';

REGIONS.forEach(r => {
  grid.insertAdjacentHTML('beforeend', `
    <div class="column" data-region="${r.key}">
      <div class="column-header">
        <div class="label">Region</div>
        <div class="region">${r.name}</div>
        <div class="font-name"></div>
      </div>
      <div class="glyph-display"></div>
    </div>
  `);
});

const columns = grid.querySelectorAll('.column');

function syncHash() {
  const text = input.value;
  if (text) {
    history.replaceState(null, '', '#' + encodeURIComponent(text));
  } else {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function readHash() {
  if (location.hash) {
    input.value = decodeURIComponent(location.hash.slice(1));
    return true;
  }
  return false;
}

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(location.href).then(() => {
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy Link';
      copyBtn.classList.remove('copied');
    }, 1500);
  });
});

window.addEventListener('hashchange', () => {
  readHash();
  render();
});

function cssFamily(name) {
  return `'${name}'`;
}

function applyPreset(presetKey) {
  activePreset = presetKey;
  const preset = PRESETS[presetKey];

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });

  columns.forEach(col => {
    const region = col.dataset.region;
    const fontName = preset.fonts[region];
    col.style.fontFamily = cssFamily(fontName);
    col.querySelector('.font-name').textContent = fontName;
  });

  render();
}

function render() {
  const text = input.value;
  const preset = PRESETS[activePreset];
  columns.forEach(col => {
    const display = col.querySelector('.glyph-display');
    const fontName = preset.fonts[col.dataset.region];
    if (!text) {
      display.innerHTML = '<div class="empty-state">Enter characters above</div>';
      return;
    }
    display.textContent = text;
  });
}

Object.keys(PRESETS).forEach(key => {
  const btn = document.createElement('button');
  btn.className = 'preset-btn' + (key === activePreset ? ' active' : '');
  btn.dataset.preset = key;
  btn.textContent = PRESETS[key].label;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    await loadFont(key, PRESETS[key]);
    btn.disabled = false;
    applyPreset(key);
  });
  presetBar.appendChild(btn);
});

input.addEventListener('input', () => {
  syncHash();
  render();
});

const DEFAULT_CHARS = '直骨神平';

readHash() || (input.value = DEFAULT_CHARS);
applyPreset('sans');
