import type { Palette } from '../../theme/colors';

export type TintKey = 'accent' | 'sage' | 'rose' | 'sky' | 'plum' | 'muted';

// Resolve a tint key to its { background, foreground } pair from the active
// palette. Category rows, chips, and badges all share this so light/dark stay
// consistent.
export function tint(c: Palette, key: string): { bg: string; fg: string } {
  switch (key as TintKey) {
    case 'accent':
      return { bg: c.accentSoft, fg: c.accentInk };
    case 'sage':
      return { bg: c.sageSoft, fg: c.sageInk };
    case 'rose':
      return { bg: c.roseSoft, fg: c.roseInk };
    case 'sky':
      return { bg: c.skySoft, fg: c.skyInk };
    case 'plum':
      return { bg: c.plumSoft, fg: c.plumInk };
    default:
      return { bg: c.mutedSoft, fg: c.ink2 };
  }
}
