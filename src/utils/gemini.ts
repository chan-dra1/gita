/**
 * Gemini AI Utility — Mood-Based Sloka Recommendation
 *
 * Sends the user's mood text to Gemini with a strict system prompt.
 * Gemini returns ONLY { chapter: number, verse: number }.
 * We then pull the full sloka from local storage — saving on token costs.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Config } from '../constants/config';
import type { Sloka, SlokaRecommendation } from '../types';
import { getSloka } from './sloka';

// ─── Curated Fallbacks ──────────────────────────────────────────
// If the API fails, we have sensible defaults for common moods

const MOOD_FALLBACKS: Record<string, SlokaRecommendation> = {
    anxious: { chapter: 2, verse: 14 },
    stressed: { chapter: 6, verse: 35 },
    lost: { chapter: 2, verse: 7 },
    angry: { chapter: 2, verse: 62 },
    sad: { chapter: 2, verse: 22 },
    confused: { chapter: 4, verse: 18 },
    fearful: { chapter: 18, verse: 66 },
    grateful: { chapter: 9, verse: 27 },
    peaceful: { chapter: 12, verse: 13 },
    motivated: { chapter: 3, verse: 19 },
    focused: { chapter: 6, verse: 5 },
    curious: { chapter: 4, verse: 7 },
    overwhelmed: { chapter: 2, verse: 47 },
    hopeless: { chapter: 4, verse: 8 },
    lonely: { chapter: 9, verse: 22 },
    default: { chapter: 2, verse: 47 }, // The most iconic verse
};

// ─── System Prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Bhagavad Gita scholar and spiritual guide. 
Given the user's current emotional state or life situation, recommend the single most relevant sloka (verse) from the Bhagavad Gita.

CRITICAL RULES:
1. Return ONLY a valid JSON object with exactly two fields: { "chapter": <number>, "verse": <number> }
2. Do NOT include any other text, explanation, markdown formatting, or code blocks.
3. The chapter must be between 1 and 18.
4. The verse must be a valid verse number for that chapter.
5. Choose the verse that most directly addresses the user's emotional need.

Examples of valid responses:
{"chapter": 2, "verse": 47}
{"chapter": 6, "verse": 5}
{"chapter": 18, "verse": 66}`;

// ─── Main Function ──────────────────────────────────────────────

/**
 * Get a Gita sloka recommendation based on the user's mood.
 *
 * Flow:
 * 1. Send mood to Gemini → get { chapter, verse }
 * 2. Use chapter/verse to pull full text from local JSON
 * 3. Falls back to curated mapping if API fails
 *
 * @param userMood - Free-text description of mood (e.g., "I feel lost")
 * @returns        - Full sloka data with chapter info
 */
export async function getSlokaRecommendation(
    userMood: string
): Promise<(Sloka & { chapter: number; chapterName: string; chapterNameSanskrit: string }) | null> {
    let recommendation: SlokaRecommendation;

    try {
        recommendation = await fetchRecommendationFromGemini(userMood);
    } catch (error) {
        console.warn('⚠️ Gemini API failed, using fallback:', error);
        recommendation = getFallbackRecommendation(userMood);
    }

    // Pull full sloka from local storage
    const sloka = getSloka(recommendation.chapter, recommendation.verse);

    if (!sloka) {
        // If the AI suggested a verse we don't have, use default
        console.warn(`⚠️ Sloka ${recommendation.chapter}:${recommendation.verse} not found, using default`);
        const defaultRec = MOOD_FALLBACKS.default;
        const defaultSloka = getSloka(defaultRec.chapter, defaultRec.verse);
        return defaultSloka
            ? { ...defaultSloka, chapter: defaultRec.chapter }
            : null;
    }

    return { ...sloka, chapter: recommendation.chapter };
}

// ─── Private Helpers ────────────────────────────────────────────

async function fetchRecommendationFromGemini(
    userMood: string
): Promise<SlokaRecommendation> {
    if (Config.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(Config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: Config.GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userMood);
    const responseText = result.response.text().trim();

    // Parse the JSON response — handle potential markdown wrapping
    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(cleanJson);

    if (
        typeof parsed.chapter !== 'number' ||
        typeof parsed.verse !== 'number' ||
        parsed.chapter < 1 ||
        parsed.chapter > 18
    ) {
        throw new Error(`Invalid response format: ${responseText}`);
    }

    console.log(`🧠 Gemini recommended: ${parsed.chapter}:${parsed.verse}`);
    return { chapter: parsed.chapter, verse: parsed.verse };
}

function getFallbackRecommendation(userMood: string): SlokaRecommendation {
    const mood = userMood.toLowerCase();

    for (const [keyword, rec] of Object.entries(MOOD_FALLBACKS)) {
        if (mood.includes(keyword)) {
            return rec;
        }
    }

    return MOOD_FALLBACKS.default;
}

// ─── Deep Dive AI Scholar ───────────────────────────────────────

/**
 * System prompt for the Gita Scholar AI.
 * - Strict boundary: ONLY answers about the provided sloka / Bhagavad Gita
 * - Refuses general knowledge questions politely
 * - Explains philosophy, context, and practical application
 */
const DEEP_DIVE_SYSTEM_PROMPT = `You are a wise and compassionate Bhagavad Gita scholar. You ONLY discuss the Bhagavad Gita and its teachings.

STRICT RULES:
1. You may ONLY answer questions related to the specific verse provided to you, or the Bhagavad Gita in general.
2. If the user asks about anything NOT related to the Bhagavad Gita (e.g., weather, stock market, coding, politics), politely decline: "🙏 I am a Gita scholar and can only discuss the wisdom of the Bhagavad Gita. Please ask me about this verse or any teaching from the Gita."
3. Keep responses concise but insightful (2-4 paragraphs max).
4. Reference the specific verse when answering.
5. Connect ancient wisdom to modern, practical life when relevant.
6. Use a warm, respectful, spiritual tone. You may use Sanskrit terms with brief explanations.
7. Never invent or fabricate verses. Only reference what is provided or well-established Gita teachings.

You are currently helping the user understand a specific verse. The verse details will be provided in the first user message.`;

interface SlokaContext {
    chapter: number;
    verse: number;
    sanskrit: string;
    transliteration: string;
    translation_english: string;
    chapterName: string;
}

/**
 * Get an AI deep-dive response about a specific sloka.
 *
 * Token-efficient: Only the current verse is sent as context.
 * Conversation history is capped at 5 messages by the hook.
 *
 * @param sloka       - The verse the user is looking at
 * @param question    - The user's question
 * @param history     - Recent conversation messages (max 5)
 * @returns           - AI response text
 */
export async function getDeepDiveResponse(
    sloka: SlokaContext,
    question: string,
    history: { role: string; content: string }[] = []
): Promise<string> {
    if (Config.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        // Return a useful offline response when API key isn't configured
        return getOfflineDeepDiveResponse(sloka, question);
    }

    const genAI = new GoogleGenerativeAI(Config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: Config.GEMINI_MODEL,
        systemInstruction: DEEP_DIVE_SYSTEM_PROMPT,
    });

    // Build the context message with the sloka details
    const slokaContext = `I am reading Bhagavad Gita Chapter ${sloka.chapter}, Verse ${sloka.verse} (${sloka.chapterName}).

Sanskrit:
${sloka.sanskrit}

Transliteration:
${sloka.transliteration}

Translation:
${sloka.translation_english}`;

    // Build chat history for multi-turn conversation
    const chatHistory = [
        { role: 'user' as const, parts: [{ text: slokaContext }] },
        {
            role: 'model' as const,
            parts: [
                {
                    text: `🙏 Namaste! I see you are reading Chapter ${sloka.chapter}, Verse ${sloka.verse} from ${sloka.chapterName}. This is a beautiful and profound verse. How may I help you understand its deeper meaning?`,
                },
            ],
        },
    ];

    // Add conversation history (skip the first context exchange)
    for (const msg of history.slice(0, -1)) {
        chatHistory.push({
            role: msg.role === 'user' ? ('user' as const) : ('model' as const),
            parts: [{ text: msg.content }],
        });
    }

    try {
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(question);
        const response = result.response.text().trim();

        console.log(
            `🧠 Deep dive response for ${sloka.chapter}:${sloka.verse} (${response.length} chars)`
        );
        return response;
    } catch (error) {
        console.error('❌ Deep dive API error:', error);
        // Fallback to offline response
        return getOfflineDeepDiveResponse(sloka, question);
    }
}

/**
 * Offline fallback: Provide a meaningful response without API.
 * Uses the local sloka data to give a basic explanation.
 */
function getOfflineDeepDiveResponse(sloka: SlokaContext, question: string): string {
    const q = question.toLowerCase();

    if (q.includes('meaning') || q.includes('explain') || q.includes('simple')) {
        return `🙏 **Chapter ${sloka.chapter}, Verse ${sloka.verse}** — ${sloka.chapterName}\n\nThis verse teaches us:\n\n"${sloka.translation_english}"\n\nThe essence of this teaching is about surrendering attachment to outcomes while dedicating yourself fully to righteous action. In daily life, this means doing your best work without being consumed by anxiety about results.\n\n_Note: For deeper AI-powered insights, please configure your Gemini API key in the app settings._`;
    }

    if (q.includes('apply') || q.includes('daily') || q.includes('life') || q.includes('practical')) {
        return `🙏 **Applying Chapter ${sloka.chapter}, Verse ${sloka.verse} Today**\n\n"${sloka.translation_english}"\n\nTo apply this verse in modern life:\n\n• **At work**: Focus on the quality of your effort, not just the promotion or reward.\n• **In relationships**: Give love without keeping score.\n• **In challenges**: Face difficulties with equanimity, knowing that struggle itself is meaningful.\n\nThe Gita reminds us that our duty (dharma) is the path itself, not just the destination.\n\n_Note: For deeper AI-powered insights, please configure your Gemini API key._`;
    }

    if (q.includes('context') || q.includes('krishna') || q.includes('arjuna') || q.includes('when')) {
        return `🙏 **Context of Chapter ${sloka.chapter}, Verse ${sloka.verse}**\n\n"${sloka.translation_english}"\n\nThis verse comes from **${sloka.chapterName}** of the Bhagavad Gita. The Gita is a conversation between Lord Krishna and the warrior Arjuna on the battlefield of Kurukshetra. Arjuna, overwhelmed by doubt and sorrow, seeks guidance — and Krishna reveals the deepest truths of existence, duty, and devotion.\n\n_Note: For deeper AI-powered insights, please configure your Gemini API key._`;
    }

    return `🙏 **Chapter ${sloka.chapter}, Verse ${sloka.verse}** — ${sloka.chapterName}\n\n"${sloka.translation_english}"\n\nThis is a beautiful verse from the Bhagavad Gita. Feel free to ask me about its deeper meaning, practical application, or historical context.\n\n_Note: For AI-powered deep dive, please configure your Gemini API key in settings._`;
}
