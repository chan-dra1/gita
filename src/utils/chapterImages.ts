/**
 * Chapter-level images for the Bhagavad Gita.
 * Each chapter has a thematic illustration based on its core teaching.
 */

const CHAPTER_IMAGES: Record<number, any> = {
  1: require('../../assets/images/contextual/chapters/ch1_battlefield.png'),
  2: require('../../assets/images/contextual/chapters/ch2_knowledge.png'),
  3: require('../../assets/images/contextual/chapters/ch3_karma_yoga.png'),
  4: require('../../assets/images/contextual/chapters/ch4_divine_knowledge.png'),
  5: require('../../assets/images/contextual/chapters/ch5_renunciation.png'),
  6: require('../../assets/images/contextual/chapters/ch6_meditation.png'),
  7: require('../../assets/images/contextual/chapters/ch7_divine_cosmic.png'),
  8: require('../../assets/images/contextual/chapters/ch8_imperishable.png'),
  9: require('../../assets/images/contextual/chapters/ch9_royal_secret.png'),
  10: require('../../assets/images/contextual/chapters/ch10_divine_glories.png'),
  11: require('../../assets/images/contextual/chapters/ch11_universal_form.png'),
  12: require('../../assets/images/contextual/chapters/ch12_devotion.png'),
  13: require('../../assets/images/contextual/chapters/ch13_field_knower.png'),
  14: require('../../assets/images/contextual/chapters/ch14_three_gunas.png'),
  15: require('../../assets/images/contextual/chapters/ch15_supreme_person.png'),
  16: require('../../assets/images/contextual/chapters/ch16_divine_demonic.png'),
  // Chapters 17-18 reuse existing contextual images as fallback
  17: require('../../assets/images/contextual/meditation.webp'),
  18: require('../../assets/images/contextual/peace.webp'),
};

/**
 * Get the thematic illustration for a chapter.
 * @param chapter - Chapter number (1-18)
 * @returns require() handle for the image
 */
export function getChapterImage(chapter: number): any {
  return CHAPTER_IMAGES[chapter] || CHAPTER_IMAGES[1];
}
