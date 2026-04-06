/**
 * Static mapping for sloka illustrations.
 * In React Native, require() must have static strings, so we map them manually here.
 */
const CHAPTER_1_IMAGES: Record<string, any> = {
  '1:1': require('../../assets/images/slokas/chapter_1/c1_v1.webp'),
  '1:2': require('../../assets/images/slokas/chapter_1/c1_v2_3.webp'),
  '1:3': require('../../assets/images/slokas/chapter_1/c1_v2_3.webp'),
  '1:4': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:5': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:6': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:7': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:8': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:9': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:10': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:11': require('../../assets/images/slokas/chapter_1/c1_v4_11.webp'),
  '1:12': require('../../assets/images/slokas/chapter_1/c1_v12.webp'),
  '1:13': require('../../assets/images/slokas/chapter_1/c1_v13.webp'),
  '1:14': require('../../assets/images/slokas/chapter_1/c1_v14.webp'),
  '1:15': require('../../assets/images/slokas/chapter_1/c1_v15.webp'),
  '1:16': require('../../assets/images/slokas/chapter_1/c1_v16_19.webp'),
  '1:17': require('../../assets/images/slokas/chapter_1/c1_v16_19.webp'),
  '1:18': require('../../assets/images/slokas/chapter_1/c1_v16_19.webp'),
  '1:19': require('../../assets/images/slokas/chapter_1/c1_v16_19.webp'),
  '1:20': require('../../assets/images/slokas/chapter_1/c1_v20.webp'),
  '1:21': require('../../assets/images/slokas/chapter_1/c1_v21_23.webp'),
  '1:22': require('../../assets/images/slokas/chapter_1/c1_v21_23.webp'),
  '1:23': require('../../assets/images/slokas/chapter_1/c1_v21_23.webp'),
  '1:24': require('../../assets/images/slokas/chapter_1/c1_v24_25.webp'),
  '1:25': require('../../assets/images/slokas/chapter_1/c1_v24_25.webp'),
  '1:26': require('../../assets/images/slokas/chapter_1/c1_v26_27.webp'),
  '1:27': require('../../assets/images/slokas/chapter_1/c1_v26_27.webp'),
  // Remainder kept as original since quota ran out
  '1:28': require('../../assets/images/slokas/chapter_1/verses_28_30.webp'),
  '1:29': require('../../assets/images/slokas/chapter_1/verses_28_30.webp'),
  '1:30': require('../../assets/images/slokas/chapter_1/verses_28_30.webp'),
  '1:31': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:32': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:33': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:34': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:35': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:36': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:37': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:38': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:39': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:40': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:41': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:42': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:43': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:44': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:45': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:46': require('../../assets/images/slokas/chapter_1/verses_31_46.webp'),
  '1:47': require('../../assets/images/slokas/chapter_1/verse_47.webp'),
};

const FALLBACK_IMAGES = [
  require('../../assets/images/contextual/battlefield.webp'),
  require('../../assets/images/contextual/meditation.webp'),
  require('../../assets/images/contextual/cosmic.webp'),
  require('../../assets/images/contextual/duty.webp'),
  require('../../assets/images/contextual/peace.webp'),
  require('../../assets/images/contextual/soul.png'),
  require('../../assets/images/contextual/karma.png'),
  require('../../assets/images/contextual/cosmic2.png'),
];

export const SLOKA_IMAGES: Record<string, any> = {
  ...CHAPTER_1_IMAGES,
};

/**
 * Get sloka illustration by chapter and verse.
 * If no specific image exists, it returns a deterministic random fallback contextual image.
 * @returns require() handle
 */
export const getSlokaImage = (chapter: number, verse: number) => {
  const specificImage = SLOKA_IMAGES[`${chapter}:${verse}`];
  if (specificImage) {
    return specificImage;
  }
  
  // Deterministic fallback based on chapter and verse
  const seed = chapter * 1000 + verse;
  const index = seed % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
};
