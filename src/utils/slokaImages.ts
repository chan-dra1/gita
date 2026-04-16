/**
 * Static mapping for sloka illustrations.
 * In React Native, require() must have static strings, so we map them manually here.
 */
const CHAPTER_1_IMAGES: Record<string, any> = {
  // Omitted as chapter 1 verse images were removed to favor the new unified design.
  // The system will now automatically use the high-quality chapter-level fallbacks.
};

const FALLBACK_IMAGES = [
  require('../../assets/images/contextual/chapters/ch1_battlefield.png'),
  require('../../assets/images/contextual/chapters/ch2_knowledge.png'),
  require('../../assets/images/contextual/chapters/ch3_karma_yoga.png'),
  require('../../assets/images/contextual/chapters/ch4_divine_knowledge.png'),
  require('../../assets/images/contextual/chapters/ch5_renunciation.png'),
  require('../../assets/images/contextual/chapters/ch6_meditation.png'),
  require('../../assets/images/contextual/chapters/ch7_divine_cosmic.png'),
  require('../../assets/images/contextual/chapters/ch8_imperishable.png'),
  require('../../assets/images/contextual/chapters/ch9_royal_secret.png'),
  require('../../assets/images/contextual/chapters/ch10_divine_glories.png'),
  require('../../assets/images/contextual/chapters/ch11_universal_form.png'),
  require('../../assets/images/contextual/chapters/ch12_devotion.png'),
  require('../../assets/images/contextual/chapters/ch13_field_knower.png'),
  require('../../assets/images/contextual/chapters/ch14_three_gunas.png'),
  require('../../assets/images/contextual/chapters/ch15_supreme_person.png'),
  require('../../assets/images/contextual/chapters/ch16_divine_demonic.png'),
  require('../../assets/images/contextual/chapters/ch17_faith.png'),
  require('../../assets/images/contextual/chapters/ch18_liberation.png'),
  require('../../assets/images/contextual/peace.webp'),
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
  
  // Use the chapter's own image as fallback (chapters 1-18 map to indices 0-17)
  const chapterIndex = Math.max(0, Math.min(chapter - 1, FALLBACK_IMAGES.length - 1));
  return FALLBACK_IMAGES[chapterIndex];
};
