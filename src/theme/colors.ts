// Color tokens. The design source uses OKLCH (see docs/DESIGN.md); React Native
// can't parse oklch(), so these are hand-tuned hex approximations. The light
// and dark sets are STRUCTURALLY IDENTICAL — same keys, so every component can
// read `c.<token>` regardless of mode. Keep them in lockstep when editing.

export type Palette = {
  // Surfaces
  paper: string; // screen background (warm cream)
  paper2: string; // sunken / inset background
  surface: string; // card background
  surface2: string; // raised inset within a card

  // Text
  ink: string; // primary
  ink2: string; // secondary
  muted: string; // tertiary / captions

  // Lines
  hairline: string; // 0.5px dividers
  hairline2: string; // stronger hairline / borders

  // Accent (caramel "dough")
  accent: string;
  accentInk: string;
  accentSoft: string;

  // Sage — positive, "on pace", income
  sage: string;
  sageSoft: string;
  sageInk: string;

  // Rose — attention, unusual, over budget
  rose: string;
  roseSoft: string;
  roseInk: string;

  // Sky + plum — extra category tints
  sky: string;
  skySoft: string;
  skyInk: string;
  plum: string;
  plumSoft: string;
  plumInk: string;

  // Neutral chip tint
  mutedSoft: string;

  // Progress-bar track
  track: string;

  // On-accent / on-ink text (for filled buttons)
  onInk: string;
};

export const lightPalette: Palette = {
  paper: '#f6f1e8',
  paper2: '#ece5d8',
  surface: '#fffdf8',
  surface2: '#fdf9f2',

  ink: '#2f2823',
  ink2: '#4d443c',
  muted: '#867c6f',

  hairline: '#e4ddd0',
  hairline2: '#d8d0bf',

  accent: '#d8915d',
  accentInk: '#7a4a2c',
  accentSoft: '#f0e0c8',

  sage: '#8eb39a',
  sageSoft: '#dde9de',
  sageInk: '#3d5444',

  rose: '#cc7a6b',
  roseSoft: '#f2dcd4',
  roseInk: '#7e4536',

  sky: '#8aa9c8',
  skySoft: '#dde6f0',
  skyInk: '#38506e',
  plum: '#8a6a8f',
  plumSoft: '#ece2ee',
  plumInk: '#614168',

  mutedSoft: '#e8e3d9',
  track: '#e7e1d3',

  onInk: '#f6f1e8',
};

export const darkPalette: Palette = {
  paper: '#1a1714',
  paper2: '#221e19',
  surface: '#262119',
  surface2: '#2c271d',

  ink: '#f0e9dd',
  ink2: '#c7bdac',
  muted: '#8f8576',

  hairline: '#332f29',
  hairline2: '#403a32',

  accent: '#e0a06d',
  accentInk: '#e8b888',
  accentSoft: '#3a2e22',

  sage: '#8fb39a',
  sageSoft: '#25342a',
  sageInk: '#a6cbb0',

  rose: '#cc7a6b',
  roseSoft: '#3a2823',
  roseInk: '#e0a094',

  sky: '#8aa9c8',
  skySoft: '#233140',
  skyInk: '#9bb6d4',
  plum: '#a98bae',
  plumSoft: '#2f2433',
  plumInk: '#c2a3c8',

  mutedSoft: '#2b2720',
  track: '#33302a',

  onInk: '#1a1714',
};
