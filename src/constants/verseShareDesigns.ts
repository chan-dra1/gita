/**
 * Social share postcard templates for verse image capture (native).
 * Same chapter+verse always maps to the same design so shares feel consistent.
 */

export const VERSE_SHARE_DESIGN_COUNT = 5;

/** Deterministic pick — elegant variety without random flicker on re-share. */
export function pickVerseShareDesign(chapter: number, verse: number): number {
  const n = Math.abs(chapter) * 1009 + Math.abs(verse) * 647;
  return n % VERSE_SHARE_DESIGN_COUNT;
}

export type VerseSharePalette = {
  /** Main darkening gradient over mandala (3 stops). */
  overlay: [string, string, string];
  sanskritColor: string;
  translationColor: string;
  accent: string;
  labelMuted: string;
  /** Optional thin inner frame */
  frameColor: string;
  /** Subtitle under Om */
  moodLine: string;
};

export const VERSE_SHARE_PALETTES: VerseSharePalette[] = [
  {
    overlay: ['rgba(10,10,14,0.78)', 'rgba(8,8,12,0.9)', 'rgba(5,5,8,0.96)'],
    sanskritColor: '#E8CF8A',
    translationColor: '#F5F0E6',
    accent: '#D4A44C',
    labelMuted: 'rgba(212, 164, 76, 0.75)',
    frameColor: 'rgba(212, 164, 76, 0.35)',
    moodLine: 'Sacred verse',
  },
  {
    overlay: ['rgba(55, 32, 18, 0.85)', 'rgba(28, 18, 12, 0.92)', 'rgba(12, 8, 6, 0.97)'],
    sanskritColor: '#FFD9A8',
    translationColor: '#FFF3E4',
    accent: '#E8A04C',
    labelMuted: 'rgba(232, 160, 76, 0.8)',
    frameColor: 'rgba(232, 160, 76, 0.38)',
    moodLine: 'Saffron dusk',
  },
  {
    overlay: ['rgba(12, 22, 42, 0.82)', 'rgba(8, 14, 28, 0.92)', 'rgba(4, 8, 18, 0.97)'],
    sanskritColor: '#C9E4FF',
    translationColor: '#E8F0FF',
    accent: '#8CB4E8',
    labelMuted: 'rgba(140, 180, 232, 0.75)',
    frameColor: 'rgba(140, 180, 232, 0.35)',
    moodLine: 'Moonlit stillness',
  },
  {
    overlay: ['rgba(10, 28, 18, 0.84)', 'rgba(6, 18, 12, 0.92)', 'rgba(4, 12, 8, 0.97)'],
    sanskritColor: '#C8E6C9',
    translationColor: '#E8F5E9',
    accent: '#81C784',
    labelMuted: 'rgba(129, 199, 132, 0.78)',
    frameColor: 'rgba(129, 199, 132, 0.32)',
    moodLine: 'Forest ashram',
  },
  {
    overlay: ['rgba(38, 18, 28, 0.84)', 'rgba(22, 10, 18, 0.92)', 'rgba(12, 6, 10, 0.97)'],
    sanskritColor: '#F0C8D8',
    translationColor: '#FFF0F5',
    accent: '#D4A0B8',
    labelMuted: 'rgba(212, 160, 184, 0.78)',
    frameColor: 'rgba(212, 160, 184, 0.35)',
    moodLine: 'Lotus dawn',
  },
];
