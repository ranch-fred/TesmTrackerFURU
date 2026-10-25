export const themeTemplate = {
  name: 'My Team Theme',
  mode: 'dark',
  colors: {
    background: '#0B0F14',
    surface: '#151D26',
    surfaceRaised: '#202B38',
    text: '#F4F7FA',
    muted: '#AAB8C5',
    accent: '#48C0FF',
    border: '#344456',
  },
};

export const presets = {
  forge: {
    name: 'Forge',
    mode: 'dark',
    colors: {
      background: '#0B0B0B',
      surface: '#151515',
      surfaceRaised: '#1A1A1A',
      text: '#F0F0EF',
      muted: '#AAAAAA',
      accent: '#FF6B00',
      border: '#303030',
    },
  },
  ocean: {
    name: 'Ocean',
    mode: 'dark',
    colors: {
      background: '#081219',
      surface: '#10212B',
      surfaceRaised: '#18323E',
      text: '#EDF8FC',
      muted: '#A6C0CC',
      accent: '#41C4E8',
      border: '#2D4B59',
    },
  },
  forest: {
    name: 'Forest',
    mode: 'dark',
    colors: {
      background: '#0D1510',
      surface: '#18231B',
      surfaceRaised: '#233428',
      text: '#F0F8EF',
      muted: '#AFC4AE',
      accent: '#A4DF64',
      border: '#3A503D',
    },
  },
  violet: {
    name: 'Violet',
    mode: 'dark',
    colors: {
      background: '#120F1C',
      surface: '#201A2D',
      surfaceRaised: '#2B243B',
      text: '#F8F2FF',
      muted: '#C1B4D3',
      accent: '#C095FF',
      border: '#493A59',
    },
  },
  paper: {
    name: 'Paper',
    mode: 'light',
    colors: {
      background: '#F5F3EE',
      surface: '#FFFFFF',
      surfaceRaised: '#EBE8E1',
      text: '#1D2529',
      muted: '#515E62',
      accent: '#A34212',
      border: '#C3C9C6',
    },
  },
};

const keys = Object.keys(themeTemplate.colors);
const hex = /^#[0-9a-fA-F]{6}$/;
function luminance(value) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
export function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function parseCustomTheme(source) {
  if (typeof source !== 'string' || new TextEncoder().encode(source).length > 16384)
    throw Error('Theme file must be 16 KB or smaller.');
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    throw Error('Choose a valid JSON theme file.');
  }
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 40 ||
    !['dark', 'light'].includes(value.mode) ||
    !value.colors ||
    typeof value.colors !== 'object' ||
    Array.isArray(value.colors)
  )
    throw Error('Theme needs a name, a dark or light mode, and a colors object.');
  if (
    Object.keys(value).some((k) => !['name', 'mode', 'colors'].includes(k)) ||
    Object.keys(value.colors).length !== keys.length ||
    keys.some((k) => !hex.test(value.colors[k]))
  )
    throw Error('Use only the seven required colors, each in #RRGGBB format.');
  if (
    contrast(value.colors.text, value.colors.background) < 4.5 ||
    contrast(value.colors.text, value.colors.surface) < 4.5 ||
    contrast(value.colors.muted, value.colors.surface) < 4.5
  )
    throw Error(
      'Text and muted colors need at least 4.5:1 contrast against the background and panels.',
    );
  return {
    name: value.name.trim(),
    mode: value.mode,
    colors: Object.fromEntries(keys.map((k) => [k, value.colors[k].toUpperCase()])),
  };
}
const storageKey = 'cnp-appearance-v1';
export function readTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved?.preset && presets[saved.preset]) return { preset: saved.preset };
    if (saved?.custom) return { custom: parseCustomTheme(JSON.stringify(saved.custom)) };
  } catch {
    /* fall back to Forge */
  }
  return { preset: 'forge' };
}
export function applyTheme(selection) {
  const theme = selection.custom || presets[selection.preset] || presets.forge;
  const root = document.documentElement;
  root.dataset.themeMode = theme.mode;
  for (const [name, value] of Object.entries(theme.colors))
    root.style.setProperty(`--theme-${name}`, value);
  root.style.setProperty('--orange', theme.colors.accent);
  root.style.setProperty('--panel', theme.colors.surface);
  root.style.setProperty('--line', theme.colors.border);
  root.style.setProperty('--muted', theme.colors.muted);
  return theme;
}
export function saveTheme(selection) {
  localStorage.setItem(storageKey, JSON.stringify(selection));
  applyTheme(selection);
}
