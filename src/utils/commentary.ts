import commentaryData from '../data/commentary.json';
import type { Commentary } from '../types';

export type { Commentary };

const COMMENTARIES: Record<string, Commentary> = commentaryData.commentaries;

/**
 * Get commentary for a specific verse
 * @param chapter - Chapter number
 * @param verse - Verse number
 * @returns Commentary object or null if not found
 */
export function getCommentary(chapter: number, verse: number): Commentary | null {
  const key = `${chapter}.${verse}`;
  return COMMENTARIES[key] || null;
}

/**
 * Check if commentary exists for a verse
 * @param chapter - Chapter number
 * @param verse - Verse number
 * @returns boolean
 */
export function hasCommentary(chapter: number, verse: number): boolean {
  const key = `${chapter}.${verse}`;
  return key in COMMENTARIES;
}

/**
 * Get a meaningful excerpt for verses without specific commentary
 * This provides spiritual context based on chapter themes
 */
export function getGenericCommentary(chapter: number, verse: number): Commentary {
  const chapterThemes: Record<number, { title: string; theme: string }> = {
    1: { title: "Arjuna's Dilemma", theme: "The battlefield of Kurukshetra represents the moral dilemmas we face in life. Arjuna's confusion is universal—when duty conflicts with emotion." },
    2: { title: "Sankhya Yoga", theme: "The path of knowledge and the immortality of the soul. This chapter establishes the foundation of spiritual understanding." },
    3: { title: "Karma Yoga", theme: "The yoga of selfless action. We must perform our duties without attachment to results, offering all actions as service." },
    4: { title: "Jnana Yoga", theme: "The yoga of knowledge and the science of incarnation. Divine wisdom is revealed through surrender and inquiry." },
    5: { title: "Karma Vairagya Yoga", theme: "The balance between action and renunciation. True renunciation is in the mind, not just external acts." },
    6: { title: "Dhyana Yoga", theme: "The yoga of meditation and mind control. A disciplined mind is the greatest ally; an uncontrolled mind, the greatest enemy." },
    7: { title: "Jnana Vijnana Yoga", theme: "Knowledge of the Absolute. Krishna reveals His divine nature and how to know Him through bhakti." },
    8: { title: "Aksara-Parabrahman Yoga", theme: "The imperishable Brahman and the process of departure from this world. What we remember at death determines our next destination." },
    9: { title: "Raja-Vidya-Guhya Yoga", theme: "The most confidential knowledge—the path of pure devotion. Surrender to the Divine brings complete protection." },
    10: { title: "Vibhuti Yoga", theme: "The opulence of the Absolute. Krishna reveals His manifestations throughout creation." },
    11: { title: "Visvarupa-Darsana Yoga", theme: "The universal form. Arjuna sees the cosmic form of the Divine, revealing the infinite nature of God." },
    12: { title: "Bhakti Yoga", theme: "The yoga of devotion. The qualities that make a devotar dear to the Lord—non-enviousness, kindness, equanimity." },
    13: { title: "Ksetra-Ksetrajna Vibhaga Yoga", theme: "The distinction between the field (body) and the knower of the field (soul). Understanding our true nature." },
    14: { title: "Gunatraya-Vibhaga Yoga", theme: "The three modes of material nature. Understanding sattva, rajas, and tamas helps transcend their influence." },
    15: { title: "Purusottama Yoga", theme: "The Supreme Person. Krishna is the source of everything, seated in the hearts of all beings." },
    16: { title: "Daivasura-Sampad-Vibhaga Yoga", theme: "The divine and demoniac natures. Understanding qualities that lead to liberation versus bondage." },
    17: { title: "Sraddhatraya-Vibhaga Yoga", theme: "The divisions of faith. Faith according to one's nature—sattvic, rajasic, or tamasic." },
    18: { title: "Moksha-Sanyasa Yoga", theme: "Liberation through renunciation. The conclusion of the Gita—surrender unto the Supreme." },
  };

  const theme = chapterThemes[chapter];
  const chapterInfo = theme || { title: "The Bhagavad Gita", theme: "The timeless wisdom of the Gita guides us toward self-realization and liberation." };

  return {
    sankara: `${chapterInfo.title} - ${chapterInfo.theme}`,
    meaning: `This verse from Chapter ${chapter} contributes to the understanding of ${chapterInfo.title.toLowerCase()}. The Bhagavad Gita presents a comprehensive spiritual teaching that addresses all aspects of human life—duty, knowledge, devotion, and liberation.`,
    application: `Reflect on how the teachings of Chapter ${chapter} apply to your current life situation. Every verse in the Gita offers practical wisdom for navigating life's challenges with grace and wisdom.`,
  };
}

/**
 * Get all verses that have detailed commentary available
 */
export function getVersesWithCommentary(): { chapter: number; verse: number; key: string }[] {
  return Object.keys(COMMENTARIES).map(key => {
    const [chapter, verse] = key.split('.').map(Number);
    return { chapter, verse, key };
  });
}
