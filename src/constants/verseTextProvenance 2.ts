import { t, type Language } from '../utils/i18n';

/**
 * User-facing notes on where verse-layer text comes from.
 * Section titles stay in the app UI language (i18n); bodies come from bundled JSON
 * or fall back when no open pack exists for that language yet.
 *
 * Open corpora worth evaluating for future *imports* (not all bundled here):
 * - The Gita Initiative: https://github.com/gita/gita (Unlicense) — verse IDs, Hindi + metadata.
 * - vedicscriptures/bhagavad-gita-data: https://github.com/vedicscriptures/bhagavad-gita-data (GPL-3.0)
 *   — many per-verse records with parallel English + Hindi fields across classical
 *   commentaries (tej/siva/rams/sankar…). Good for research / ETL; GPL has product
 *   implications vs Unlicense if you ship in a proprietary store build.
 */

const PROVENANCE_EN = [
  'How text is chosen',
  '• Translation: English from your main bhagavad-gita.json. Hindi uses the full 701-verse pack (Swami Ramsukhdas) from The Gita Initiative (github.com/gita/gita, Unlicense). Other UI languages use English until a vetted pack is added.',
  '• Word-by-word: English gloss packaged with each verse in bhagavad-gita.json. A future import can add mr/ta/te/… gloss files keyed the same way without renaming UI sections.',
  '• Spiritual meaning / In your life: generic chapter text uses open chapter summaries (en/hi) from the same Unlicense dataset; verse-specific JSON commentary stays English where no localized file exists.',
  '• Extended purport: English (purports.json) or Hindi (purports_hi.json). Other languages fall back to English with an on-screen note until a separate purport bundle is licensed and imported.',
  '',
  'Same “book” in many human languages usually means different published editions, not one machine-aligned file. Open repos rarely give all of MR/TA/TE/BN/GU/KN in one schema; the practical pattern is one JSON (or SQLite) per language, same keys (chapter_verse), plus attribution.',
].join('\n');

const PROVENANCE_HI = [
  'पाठ कैसे चुना जाता है',
  '• अनुवाद: अंग्रेज़ी मुख्य bhagavad-gita.json से। हिंदी के लिए 701 श्लोक (स्वामी रामसुखदास) The Gita Initiative (github.com/gita/gita, Unlicense) से। अन्य भाषाएँ तब तक अंग्रेज़ी दिखाती हैं जब तक अलग से जाँचा गया संकलन न जोड़ा जाए।',
  '• शब्दार्थ: प्रत्येक श्लोक के साथ अंग्रेज़ी शब्दार्थ। भविष्य में mr/ta/te… के लिए अलग JSON जोड़े जा सकते हैं।',
  '• आध्यात्मिक अर्थ / जीवन में: अध्याय-स्तर पर Unlicense डेटासेट के सार (अंग्रेज़ी/हिंदी)। श्लोक-विशिष्ट टिप्पणी जहाँ उपलब्ध नहीं, वहाँ अंग्रेज़ी।',
  '• विस्तृत टिप्पणी: purports.json (अंग्रेज़ी) या purports_hi.json (हिंदी)। अन्य भाषाओं में स्पष्ट नोट के साथ अंग्रेज़ी प्रदर्शन जब तक अलग संकलन न हो।',
  '',
  'एक ही ग्रंथ के कई भाषाई संस्करण आमतौर पर अलग-अलग प्रकाशन होते हैं; एक ही JSON में सब कुछ दुर्लभ है। व्यावहारिक तरीका: प्रत्येक भाषा के लिए chapter_verse कुंजी वाला JSON + स्रोत/लाइसेंस उल्लेख।',
].join('\n');

const PROVENANCE_TE = [
  'పాఠం ఎలా ఎంచుకుంటాము',
  '• అనువాదం: ఆంగ్లం మీ ప్రధాన bhagavad-gita.json నుండి. హిందీకి 701 శ్లోకాల పూర్తి కట్టు (స్వామి రామసుఖదాస్) The Gita Initiative (github.com/gita/gita, Unlicense) నుండి. ఇతర UI భాషలకు ఇంకా ధృవీకరించిన కట్టు చేర్చే వరకు ఆంగ్లం వాడుతాము.',
  '• పదం పదం అర్థం: ప్రతి శ్లోకంతో పాటు bhagavad-gita.json లోని ఆంగ్ల గ్లోస్. భవిష్యత్తులో mr/ta/te… కోసం అదే chapter_verse కీలతో కొత్త JSON చేర్చవచ్చు; UI విభాగాల పేర్లు మారవు.',
  '• ఆధ్యాత్మిక అర్థం / మీ జీవితంలో: అధ్యాయ స్థాయి వచనం అదే Unlicense డేటాసెట్‌లోని en/hi సారాల నుండి; శ్లోక-నిర్దిష్ట JSON వ్యాఖ్యానం లేనిచోట ఆంగ్లం.',
  '• విస్తృత వ్యాఖ్యానం: purports.json (ఆంగ్లం) లేదా purports_hi.json (హిందీ). ఇతర భాషలలో ప్రత్యేక కట్టు వచే వరకు స్పష్టమైన గమనికతో ఆంగ్లం.',
  '',
  'ఒకే గ్రంథం అనేక మానవ భాషలలో సాధారణంగా వేర్వేరు ప్రచురణలు; ఒకే JSONలో అన్నీ అరుదు. తెరిచిన రిపోలలో MR/TA/TE/BN/GU/KN అన్నీ ఒకే స్కీమాలో రావు; వ్యవహారిక మార్గం: భాషకు ఒక JSON (లేదా SQLite), అదే chapter_verse కీలు, మరియు మూలాల/లైసెన్స్ పేర్కొనడం.',
].join('\n');

/** Alert title — same copy as a11y label for the info control */
export function verseSourcesAlertTitle(lang: Language): string {
  return t('a11yTextSources', lang);
}

export function verseTextProvenanceBody(lang: Language): string {
  if (lang === 'hi') return PROVENANCE_HI;
  // @ts-ignore - Keeping for future use
  if (lang === 'te') return PROVENANCE_TE;
  return PROVENANCE_EN;
}
