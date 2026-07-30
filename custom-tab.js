import { loadSingleFont } from './fonts.js';
import { getGoogleFonts } from './google-fonts.js';

export const customState = {
  fonts: JSON.parse(localStorage.getItem('customFonts')) || [
    'Noto Sans', 'Noto Sans SC', 'Noto Sans TC',
    'Noto Sans HK', 'Noto Sans JP', 'Noto Sans KR'
  ]
};

function saveFonts() {
  localStorage.setItem('customFonts', JSON.stringify(customState.fonts));
}

function cssFamily(name) {
  return `'${name}'`;
}

function createColumnElement(fontName, index) {
  const col = document.createElement('div');
  col.className = 'column custom-column';
  col.dataset.customIndex = index;
  col.style.fontFamily = cssFamily(fontName);
  col.innerHTML = `
    <div class="column-header">
      <button class="remove-btn" title="Remove">&times;</button>
      <div class="font-select">
        <div class="font-select__trigger">
          <span class="font-select__current" style="font-family: ${cssFamily(fontName)}">${fontName}</span>
          <span class="font-select__arrow">&#x25BE;</span>
        </div>
        <div class="font-select__dropdown">
          <input class="font-select__search" type="text" placeholder="Search font..." autocomplete="off">
          <div class="font-select__list"></div>
        </div>
      </div>
    </div>
    <div class="glyph-display"></div>
  `;
  return col;
}

function getAddColumn() {
  const addCol = document.createElement('div');
  addCol.className = 'add-column';
  addCol.innerHTML = '<button class="add-btn">+ Add Font</button>';
  return addCol;
}

export function buildCustomColumns(grid) {
  grid.innerHTML = '';

  customState.fonts.forEach((fontName, i) => {
    const col = createColumnElement(fontName, i);
    grid.appendChild(col);
    loadSingleFont(fontName);
  });

  grid.appendChild(getAddColumn());
}

function addOneColumn(grid, render, syncState) {
  const fontName = 'Noto Sans';
  const i = customState.fonts.length;
  customState.fonts.push(fontName);
  saveFonts();

  const col = createColumnElement(fontName, i);
  const addCol = grid.querySelector('.add-column');
  grid.insertBefore(col, addCol);
  loadSingleFont(fontName);

  render();
  syncState();
}

function removeOneColumn(grid, removeBtn, render, syncState) {
  const col = removeBtn.closest('.custom-column');
  const i = parseInt(col.dataset.customIndex);
  customState.fonts.splice(i, 1);
  saveFonts();
  col.remove();

  grid.querySelectorAll('.custom-column').forEach((c, idx) => {
    c.dataset.customIndex = idx;
    const current = c.querySelector('.font-select__current');
    current.textContent = customState.fonts[idx];
    current.style.fontFamily = cssFamily(customState.fonts[idx]);
    c.style.fontFamily = cssFamily(customState.fonts[idx]);
  });

  render();
  syncState();
}

export function setupCustomEvents(grid, { render, syncState, input }) {
  async function buildFontDropdownItems(list, filter) {
    list.innerHTML = '<div class="font-select__empty">Loading fonts...</div>';
    let fonts;
    try {
      fonts = await getGoogleFonts();
    } catch {
      fonts = [];
    }
    list.innerHTML = '';
    let count = 0;

    fonts.forEach((name, idx) => {
      if (filter && !name.toLowerCase().includes(filter.toLowerCase())) return;
      const item = document.createElement('div');
      item.className = 'font-select__item';
      item.style.fontFamily = cssFamily(name);
      item.textContent = name;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        const sel = item.closest('.font-select');
        const col = sel.closest('.custom-column');
        const i = parseInt(col.dataset.customIndex);
        const oldName = customState.fonts[i];
        if (oldName === name) {
          sel.classList.remove('open');
          return;
        }
        customState.fonts[i] = name;
        saveFonts();
        sel.querySelector('.font-select__current').textContent = name;
        sel.querySelector('.font-select__current').style.fontFamily = cssFamily(name);
        col.style.fontFamily = cssFamily(name);
        loadSingleFont(name);
        sel.classList.remove('open');
        syncState();
        render();
      });
      list.appendChild(item);
      count++;
      if (filter || idx < 30) {
        loadSingleFont(name);
      }
    });

    if (!count) {
      list.innerHTML = '<div class="font-select__empty">No fonts found</div>';
    }
  }

  function toggleFontSelect(sel) {
    const opening = !sel.classList.contains('open');
    sel.classList.toggle('open');
    if (opening) {
      const search = sel.querySelector('.font-select__search');
      const list = sel.querySelector('.font-select__list');
      search.value = '';
      buildFontDropdownItems(list, '');
      search.focus();
    }
  }

  grid.addEventListener('click', e => {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) {
      removeOneColumn(grid, removeBtn, render, syncState);
      return;
    }

    const addBtn = e.target.closest('.add-btn');
    if (addBtn) {
      addOneColumn(grid, render, syncState);
      return;
    }

    const trigger = e.target.closest('.font-select__trigger');
    if (trigger) {
      const sel = trigger.closest('.font-select');
      document.querySelectorAll('.font-select.open').forEach(s => {
        if (s !== sel) s.classList.remove('open');
      });
      toggleFontSelect(sel);
      return;
    }

    const search = e.target.closest('.font-select__search');
    if (search) {
      e.stopPropagation();
      return;
    }
  });

  grid.addEventListener('input', e => {
    const search = e.target.closest('.font-select__search');
    if (!search) return;
    const sel = search.closest('.font-select');
    const list = sel.querySelector('.font-select__list');
    buildFontDropdownItems(list, search.value);
  });

  grid.addEventListener('keydown', e => {
    const sel = e.target.closest('.font-select');
    if (!sel || !sel.classList.contains('open')) return;
    const list = sel.querySelector('.font-select__list');
    const items = list.querySelectorAll('.font-select__item');
    if (!items.length) return;

    let idx = Array.from(items).findIndex(el => el.classList.contains('highlighted'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = idx < items.length - 1 ? idx + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = idx > 0 ? idx - 1 : items.length - 1;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (idx >= 0) items[idx].click();
      return;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      sel.classList.remove('open');
      return;
    } else {
      return;
    }

    items.forEach(el => el.classList.remove('highlighted'));
    items[idx].classList.add('highlighted');
    items[idx].scrollIntoView({ block: 'nearest' });
  });

  document.addEventListener('click', e => {
    document.querySelectorAll('.font-select.open').forEach(sel => {
      if (!sel.contains(e.target)) {
        sel.classList.remove('open');
      }
    });
  });
}
