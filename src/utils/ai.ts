import { Config } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a deeply knowledgeable, respectful, and wise scholar of the Bhagavad Gita and Vedic philosophy.
Your sole purpose is to explain and discuss the Bhagavad Gita, Lord Krishna, Arjuna, dharma, karma, and Hindu spiritual concepts.

Rules:
1. You MUST ONLY answer questions related to the Bhagavad Gita, Lord Krishna, Vedic texts, and Hindu philosophy. 
2. If the user asks about ANYTHING else (e.g., coding, modern politics, weather, recipes, general non-spiritual advice), you must politely decline and guide them back to the Gita.
3. Keep your answers concise, profound, and easy to understand.
4. When relevant, quote or reference specific chapter and verse numbers.`;

export async function askScholar(
  messages: ChatMessage[],
  contextSloka?: { chapter: number; verse: number; sanskrit: string; english: string },
  systemOverride?: string
): Promise<string> {
  // Check for User's Claude API Key
  const userKey = await AsyncStorage.getItem('claude_api_key');
  if (!userKey) {
    throw new Error('MISSING_API_KEY');
  }

  // Build the message payload
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  let finalSystemPrompt = systemOverride || SYSTEM_PROMPT;
  
  if (contextSloka) {
    finalSystemPrompt += `\n\nContext for this conversation:\nThe user is currently reading Chapter ${contextSloka.chapter}, Verse ${contextSloka.verse}:\nSanskrit: ${contextSloka.sanskrit}\nMeaning: ${contextSloka.english}`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': userKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerously-allow-browser': 'true' // Required if hitting from web or certain mobile fetches
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Very fast, extremely cheap, perfect for chat
        max_tokens: 600,
        system: finalSystemPrompt,
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      if (response.status === 401 || errorResponse?.error?.type === 'authentication_error') {
        throw new Error('INVALID_API_KEY');
      }
      throw new Error(errorResponse?.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (err: any) {
    console.error('Claude API Error:', err);
    throw err;
  }
}
