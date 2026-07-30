import { PRESETS } from './presets/index.js';
import { REGIONS } from './regions.js';
import { loadFont } from './fonts.js';
import { buildCustomColumns, setupCustomEvents, customState } from './custom-tab.js';

const grid = document.getElementById('grid');
const input = document.getElementById('glyph-input');
const copyBtn = document.getElementById('copy-btn');
const themeToggle = document.getElementById('theme-toggle');
const sizeInput = document.getElementById('size-input');
const presetBar = document.getElementById('preset-bar');

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

function syncState() {
  const text = input.value;
  const params = new URLSearchParams();
  params.set('p', activePreset);
  if (activePreset === 'custom') {
    params.set('f', customState.fonts.join('|'));
  }
  let url = location.pathname;
  const qs = params.toString();
  if (qs) url += '?' + qs;
  if (text) url += '#' + encodeURIComponent(text);
  history.replaceState(null, '', url);
}

function readHash() {
  if (location.hash) {
    input.value = decodeURIComponent(location.hash.slice(1));
    return true;
  }
  return false;
}

function readState() {
  const params = new URLSearchParams(location.search);
  const fontsStr = params.get('f');
  if (fontsStr) {
    customState.fonts = fontsStr.split('|');
    localStorage.setItem('customFonts', JSON.stringify(customState.fonts));
  }
  return params.get('p') || null;
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

function applySize(px) {
  document.querySelectorAll('.glyph-display').forEach(el => {
    el.style.fontSize = px + 'px';
  });
}

const savedSize = localStorage.getItem('size') || 24;
sizeInput.value = savedSize;
applySize(savedSize);

window.addEventListener('hashchange', () => {
  readHash();
  render();
});

function cssFamily(name) {
  return `'${name}'`;
}

function buildRegionColumns() {
  grid.innerHTML = '';
  REGIONS.forEach(r => {
    grid.insertAdjacentHTML('beforeend', `
      <div class="column" data-region="${r.key}">
        <div class="column-header">
          <div class="region">${r.name}</div>
          <div class="font-name"></div>
        </div>
        <div class="glyph-display"></div>
      </div>
    `);
  });
  const preset = PRESETS[activePreset];
  grid.querySelectorAll('.column').forEach(col => {
    const region = col.dataset.region;
    const fontName = preset.fonts[region];
    col.style.fontFamily = cssFamily(fontName);
    col.querySelector('.font-name').textContent = fontName;
  });
}

function applyPreset(presetKey) {
  activePreset = presetKey;

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });

  if (presetKey === 'custom') {
    buildCustomColumns(grid);
  } else {
    buildRegionColumns();
  }

  applySize(parseInt(sizeInput.value) || 24);
  render();
  syncState();
}

function render() {
  const text = input.value;
  grid.querySelectorAll('.glyph-display').forEach(display => {
    if (!text) {
      display.innerHTML = '<div class="empty-state">Enter characters above</div>';
    } else {
      display.textContent = text;
    }
  });
}

Object.keys(PRESETS).forEach(key => {
  const btn = document.createElement('button');
  btn.className = 'preset-btn' + (key === activePreset ? ' active' : '');
  btn.dataset.preset = key;
  btn.textContent = PRESETS[key].label;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    if (key !== 'custom') {
      await loadFont(key, PRESETS[key]);
    }
    btn.disabled = false;
    applyPreset(key);
  });
  presetBar.appendChild(btn);
});

input.addEventListener('input', () => {
  syncState();
  render();
});

sizeInput.addEventListener('input', () => {
  const v = parseInt(sizeInput.value) || 24;
  applySize(v);
  localStorage.setItem('size', v);
});

const DEFAULT_CHARS = '直骨神平';

async function init() {
  const presetKey = readState();
  readHash() || (input.value = DEFAULT_CHARS);
  if (presetKey && presetKey !== 'sans') {
    if (presetKey !== 'custom') {
      await loadFont(presetKey, PRESETS[presetKey]);
    }
    applyPreset(presetKey);
  } else {
    applyPreset('sans');
  }
}

setupCustomEvents(grid, { render, syncState, input });

init();
