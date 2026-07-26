import { PRESETS } from './presets/index.js';
import { REGIONS } from './regions.js';
import { loadFont } from './fonts.js';

const grid = document.getElementById('grid');
const input = document.getElementById('glyph-input');
const presetBar = document.getElementById('preset-bar');
const copyBtn = document.getElementById('copy-btn');

let activePreset = 'sans';

REGIONS.forEach(r => {
  grid.insertAdjacentHTML('beforeend', `
    <div class="column" data-region="${r.key}" lang="${r.lang}">
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
  }
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

readHash();
applyPreset('sans');
