import { t, type Language } from '../utils/i18n';

/**
 * User-facing notes on where verse-layer text comes from.
 * Policy: aim to ship only corpora we can redistribute in App Store / Play builds without
 * copyleft surprises. Hindi from The Gita Initiative may be Unlicense if imported from that
 * repo; English verse/purport JSON is a separate diligence item (see src/data/SOURCE_AUDIT.md).
 * GPL datasets (e.g. vedicscriptures) are research-only — not bundled here.
 *
 * References:
 * - The Gita Initiative: https://github.com/gita/gita (Unlicense)
 * - vedicscriptures/bhagavad-gita-data (GPL-3.0) — https://github.com/vedicscriptures/bhagavad-gita-data
 */

const PROVENANCE_EN = [
  'How text is chosen',
  '• Licensing: We aim to bundle only text we can redistribute in store builds (Unlicense / MIT / public-domain–cleared, or permission on file). We do not embed GPL commentary databases (e.g. vedicscriptures/bhagavad-gita-data) in the app — research-only unless you run a separate compliance pipeline.',
  '• Hindi (documented path): The 701-verse Hindi pack attributed to Swami Ramsukhdas may come from The Gita Initiative (github.com/gita/gita, Unlicense). That license applies only to text you actually exported from that repo — verify your bytes and keep their LICENSE with your import notes (see src/data/SOURCE_AUDIT.md).',
  '• English verse layer (high diligence): Fields such as translation_english and word_meanings in bhagavad-gita.json are not automatically Unlicense or public domain just because Hindi elsewhere is. Modern English renderings and glosses are often copyright. Before launch, replace with a documented PD edition, obtain publisher permission, or use original commissioned text.',
  '• Word-by-word: Whatever license covers the English gloss in bhagavad-gita.json applies here; same diligence as the verse translation.',
  '• Extended purport: This strict-launch build does not bundle extended purport packs. If you add them later, trace every block to a redistributable source or your own writing before shipping.',
  '• Other UI languages: Often fall back to English until a separately vetted pack exists.',
  '',
  'Same “book” in many human languages usually means different published editions, not one machine-aligned file. Open repos rarely give all of MR/TA/TE/BN/GU/KN in one schema; the practical pattern is one JSON (or SQLite) per language, same keys (chapter_verse), plus attribution.',
].join('\n');

const PROVENANCE_HI = [
  'पाठ कैसे चुना जाता है',
  '• लाइसेंस नीति: हम स्टोर बिल्ड में केवल वही पाठ बंडल करने का लक्ष्य रखते हैं जिसका अधिकार दस्तावेज़ में हो (Unlicense / MIT / सार्वजनिक-डोमेन-स्पष्ट, या लिखित अनुमति)। GPL बहु-टिप्पणी डेटासेट (जैसे vedicscriptures/bhagavad-gita-data) ऐप में नहीं — शोध हेतु अलग रणनीति।',
  '• हिंदी (दस्तावेज़ित मार्ग): 701 श्लोक वाला हिंदी पैक The Gita Initiative (github.com/gita/gita, Unlicense) से हो सकता है — Unlicense केवल उसी टेक्स्ट पर लागू है जो आपने वास्तव में उस रिपो से निर्यात किया हो; src/data/SOURCE_AUDIT.md देखें।',
  '• अंग्रेज़ी श्लोक परत (उच्च सावधानी): bhagavad-gita.json में translation_english व शब्दार्थ अपने आप Unlicense नहीं होते। आधुनिक अंग्रेज़ी अनुवाद अक्सर कॉपीराइट होते हैं — लॉन्च से पहले PD संस्करण, प्रकाशक की अनुमति, या मौलिक लेखन।',
  '• शब्दार्थ: अंग्रेज़ी ग्लॉस पर वही अधिकार लागू जो अनुवाद पर — अलग से पुष्टि करें।',
  '• विस्तृत टिप्पणी: इस strict-launch बिल्ड में विस्तृत टिप्पणी पैक बंडल नहीं हैं। भविष्य में जोड़ें तो हर ब्लॉक का स्रोत/अधिकार पहले प्रमाणित करें।',
  '',
  'एक ही ग्रंथ के कई भाषाई संस्करण आमतौर पर अलग-अलग प्रकाशन होते हैं; एक ही JSON में सब कुछ दुर्लभ है। व्यावहारिक तरीका: प्रत्येक भाषा के लिए chapter_verse कुंजी वाला JSON + स्रोत/लाइसेंस उल्लेख।',
].join('\n');

const PROVENANCE_TE = [
  'పాఠం ఎలా ఎంచుకుంటాము',
  '• లైసెన్సింగ్: స్టోర్ బిల్డ్‌లో పంచుకోగల Unlicense / MIT / స్పష్ట పబ్లిక్ డొమైన్ లేదా అనుమతి ఉన్న పాఠాలను మాత్రమే లక్ష్యంగా బండిల్ చేస్తాము. GPL వ్యాఖ్యాన డేటాసెట్‌లు (ఉదా. vedicscriptures/bhagavad-gita-data) యాప్‌లో లేవు.',
  '• హిందీ (దస్తావేజీ మార్గం): 701 శ్లోకాల The Gita Initiative (github.com/gita/gita, Unlicense) నుండి వచ్చినట్లయితే, ఆ లైసెన్స్ మీరు నిజంగా ఎగుమతి చేసిన టెక్స్ట్‌కే వర్తిస్తుంది — src/data/SOURCE_AUDIT.md చూడండి.',
  '• ఆంగ్ల శ్లోక పొర (అధిక జాగ్రత్త): bhagavad-gita.json లో translation_english, word_meanings స్వయంచాలకంగా Unlicense కావు. ఆధునిక ఆంగ్ల అనువాదాలు తరచూ కాపీరైట్ — PD సంస్కరణ, ప్రచురక అనుమతి లేదా స్వంత రచన.',
  '• పదం పదం అర్థం: ఆంగ్ల గ్లోస్‌కు అదే హక్కుల ధృవీకరణ అవసరం.',
  '• విస్తృత వ్యాఖ్యానం: ఈ strict-launch బిల్డ్‌లో విస్తృత వ్యాఖ్యాన ప్యాక్స్ బండిల్ చేయలేదు. తరువాత చేర్చితే మూలాలు/హక్కులు ముందుగా ధృవీకరించండి.',
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
