/**
 * Static mapping for sloka illustrations.
 * In React Native, require() must have static strings, so we map them manually here.
 */
const CHAPTER_1_IMAGES: Record<string, any> = {
  '1:1': require('../../assets/images/slokas/chapter_1/verse_1.webp'),
  '1:2': require('../../assets/images/slokas/chapter_1/verse_2.webp'),
  '1:3': require('../../assets/images/slokas/chapter_1/verse_3.webp'),
  '1:4': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:5': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:6': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:7': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:8': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:9': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:10': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:11': require('../../assets/images/slokas/chapter_1/verses_4_11.webp'),
  '1:12': require('../../assets/images/slokas/chapter_1/verse_12.webp'),
  '1:13': require('../../assets/images/slokas/chapter_1/verse_13.webp'),
  '1:14': require('../../assets/images/slokas/chapter_1/verse_14.webp'),
  '1:15': require('../../assets/images/slokas/chapter_1/verses_15_19.webp'),
  '1:16': require('../../assets/images/slokas/chapter_1/verses_15_19.webp'),
  '1:17': require('../../assets/images/slokas/chapter_1/verses_15_19.webp'),
  '1:18': require('../../assets/images/slokas/chapter_1/verses_15_19.webp'),
  '1:19': require('../../assets/images/slokas/chapter_1/verses_15_19.webp'),
  '1:20': require('../../assets/images/slokas/chapter_1/verses_20_23.webp'),
  '1:21': require('../../assets/images/slokas/chapter_1/verses_20_23.webp'),
  '1:22': require('../../assets/images/slokas/chapter_1/verses_20_23.webp'),
  '1:23': require('../../assets/images/slokas/chapter_1/verses_20_23.webp'),
  '1:24': require('../../assets/images/slokas/chapter_1/verses_24_25.webp'),
  '1:25': require('../../assets/images/slokas/chapter_1/verses_24_25.webp'),
  '1:26': require('../../assets/images/slokas/chapter_1/verses_26_27.webp'),
  '1:27': require('../../assets/images/slokas/chapter_1/verses_26_27.webp'),
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

export const SLOKA_IMAGES: Record<string, any> = {
  ...CHAPTER_1_IMAGES,
};

/**
 * Get sloka illustration by chapter and verse.
 * @returns require() handle or null if no image exists.
 */
export const getSlokaImage = (chapter: number, verse: number) => {
  return SLOKA_IMAGES[`${chapter}:${verse}`] || null;
};
