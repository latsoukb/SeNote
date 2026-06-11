/** Palettes d'accent (échelle Tailwind, valeurs HSL sans hsl()). */
const PALETTES = {
  blue: {
    50: '214 100% 97%',
    100: '214 95% 93%',
    200: '213 96% 87%',
    300: '212 96% 78%',
    400: '213 94% 68%',
    500: '217 91% 60%',
    600: '221 83% 53%',
    700: '224 76% 48%',
    800: '226 71% 40%',
    900: '224 64% 33%',
    950: '226 57% 21%',
  },
  rose: {
    50: '355 100% 97%',
    100: '356 100% 95%',
    200: '352 96% 90%',
    300: '352 95% 81%',
    400: '351 90% 68%',
    500: '349 89% 60%',
    600: '347 77% 50%',
    700: '345 83% 41%',
    800: '343 80% 35%',
    900: '340 82% 30%',
    950: '343 88% 16%',
  },
  green: {
    50: '152 81% 96%',
    100: '149 80% 90%',
    200: '152 76% 80%',
    300: '156 72% 67%',
    400: '158 64% 52%',
    500: '160 84% 39%',
    600: '161 94% 30%',
    700: '163 94% 24%',
    800: '164 86% 20%',
    900: '166 78% 17%',
    950: '165 91% 9%',
  },
  brown: {
    50: '48 100% 96%',
    100: '48 96% 89%',
    200: '45 93% 78%',
    300: '43 96% 64%',
    400: '38 92% 50%',
    500: '32 95% 44%',
    600: '28 90% 37%',
    700: '26 83% 31%',
    800: '23 75% 26%',
    900: '22 78% 21%',
    950: '21 91% 14%',
  },
  violet: {
    50: '258 100% 98%',
    100: '257 96% 95%',
    200: '258 96% 91%',
    300: '258 94% 85%',
    400: '259 91% 76%',
    500: '259 90% 67%',
    600: '262 83% 58%',
    700: '263 70% 50%',
    800: '264 67% 42%',
    900: '266 65% 35%',
    950: '265 73% 20%',
  },
  orange: {
    50: '33 100% 96%',
    100: '34 100% 92%',
    200: '32 98% 83%',
    300: '31 97% 72%',
    400: '27 96% 61%',
    500: '25 95% 53%',
    600: '21 90% 48%',
    700: '17 88% 40%',
    800: '15 79% 34%',
    900: '15 75% 28%',
    950: '13 81% 15%',
  },
};

export const ACCENT_OPTIONS = [
  { id: 'blue', label: 'Bleu', swatch: 'hsl(221, 83%, 53%)' },
  { id: 'rose', label: 'Rose', swatch: 'hsl(347, 77%, 50%)' },
  { id: 'green', label: 'Vert', swatch: 'hsl(161, 94%, 30%)' },
  { id: 'brown', label: 'Marron', swatch: 'hsl(28, 90%, 37%)' },
  { id: 'violet', label: 'Violet', swatch: 'hsl(262, 83%, 58%)' },
  { id: 'orange', label: 'Orange', swatch: 'hsl(21, 90%, 48%)' },
];

export const DEFAULT_ACCENT = 'blue';

export function isValidAccent(id) {
  return id in PALETTES;
}

const DARK_SURFACE_VARS = [
  '--background',
  '--card',
  '--popover',
  '--secondary',
  '--muted',
  '--border',
  '--input',
];

export function applyAccentTheme(accentId, isDark = false) {
  const palette = PALETTES[accentId] || PALETTES[DEFAULT_ACCENT];
  const root = document.documentElement;
  root.dataset.accent = accentId in PALETTES ? accentId : DEFAULT_ACCENT;
  Object.entries(palette).forEach(([shade, value]) => {
    root.style.setProperty(`--brand-${shade}`, value);
  });

  if (isDark) {
    root.style.setProperty('--background', palette[950]);
    root.style.setProperty('--card', palette[900]);
    root.style.setProperty('--popover', palette[900]);
    root.style.setProperty('--secondary', palette[900]);
    root.style.setProperty('--muted', palette[900]);
    root.style.setProperty('--border', palette[800]);
    root.style.setProperty('--input', palette[800]);
  } else {
    DARK_SURFACE_VARS.forEach((name) => root.style.removeProperty(name));
  }
}
