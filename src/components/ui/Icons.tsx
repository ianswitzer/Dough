import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Minimal line glyphs ported from the design's Icons set. Each takes a color
// (defaults to currentColor-ish via `color` prop) and optional size.
type IconProps = { color?: string; size?: number; opacity?: number };

const mk =
  (vb: number, draw: (stroke: string) => React.ReactNode, defaultSize: number) =>
  ({ color = '#000', size = defaultSize, opacity = 1 }: IconProps) => (
    <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} opacity={opacity}>
      {draw(color)}
    </Svg>
  );

export const Icons = {
  today: mk(
    22,
    (c) => (
      <>
        <Circle cx="11" cy="11" r="7.5" stroke={c} strokeWidth="1.6" fill="none" />
        <Circle cx="11" cy="11" r="2" fill={c} />
      </>
    ),
    22,
  ),
  list: mk(
    22,
    (c) => <Path d="M4 6h14M4 11h14M4 16h14" stroke={c} strokeWidth="1.6" strokeLinecap="round" />,
    22,
  ),
  plan: mk(
    22,
    (c) => (
      <>
        <Rect x="3.5" y="4" width="15" height="14" rx="3" stroke={c} strokeWidth="1.6" fill="none" />
        <Path d="M3.5 9h15" stroke={c} strokeWidth="1.6" />
        <Circle cx="7.5" cy="13" r="1" fill={c} />
        <Circle cx="11" cy="13" r="1" fill={c} />
      </>
    ),
    22,
  ),
  spark: mk(
    22,
    (c) => (
      <>
        <Path
          d="M3 14l4-5 3.5 3L18 5"
          stroke={c}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="18" cy="5" r="1.4" fill={c} />
      </>
    ),
    22,
  ),
  gear: mk(
    22,
    (c) => (
      <>
        <Circle cx="11" cy="11" r="3" stroke={c} strokeWidth="1.6" fill="none" />
        <Path
          d="M11 2v3M11 17v3M2 11h3M17 11h3M4.5 4.5l2 2M15.5 15.5l2 2M17.5 4.5l-2 2M6.5 15.5l-2 2"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    22,
  ),
  chev: mk(
    14,
    (c) => (
      <Path d="M5 3l4 4-4 4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    14,
  ),
  back: mk(
    20,
    (c) => (
      <Path d="M12 4l-6 6 6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    20,
  ),
  plus: mk(16, (c) => <Path d="M8 3v10M3 8h10" stroke={c} strokeWidth="1.8" strokeLinecap="round" />, 16),
  search: mk(
    16,
    (c) => (
      <>
        <Circle cx="7" cy="7" r="4.5" stroke={c} strokeWidth="1.5" fill="none" />
        <Path d="M11 11l3 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    16,
  ),
  filter: mk(16, (c) => <Path d="M2 4h12M4 8h8M6 12h4" stroke={c} strokeWidth="1.6" strokeLinecap="round" />, 16),
  bell: mk(
    18,
    (c) => (
      <Path
        d="M4 13V8a5 5 0 0110 0v5l1 2H3l1-2zM7 16a2 2 0 004 0"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    18,
  ),
  recurring: mk(
    14,
    (c) => (
      <>
        <Path d="M2.5 7a4.5 4.5 0 018-2.8M11.5 7a4.5 4.5 0 01-8 2.8" stroke={c} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <Path d="M9 1.5L11 4l-2.5.5M5 12.5L3 10l2.5-.5" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    14,
  ),
  up: mk(12, (c) => <Path d="M3 7l3-3 3 3" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />, 12),
  down: mk(12, (c) => <Path d="M3 5l3 3 3-3" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />, 12),
  flat: mk(12, (c) => <Path d="M3 6h6" stroke={c} strokeWidth="1.6" strokeLinecap="round" />, 12),
  check: mk(14, (c) => <Path d="M3 7.5L6 10.5 11.5 4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />, 14),
  close: mk(14, (c) => <Path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke={c} strokeWidth="1.6" strokeLinecap="round" />, 14),
};

export type IconName = keyof typeof Icons;
