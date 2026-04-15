/**
 * Ask the Scholar — Spiritual AI Chat with Precomputed Knowledge
 * Uses precomputed scholarly responses with live-typing simulation.
 * Falls back to Gemini Flash for truly novel questions.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getDeepDiveResponse } from '../src/utils/gemini';
import { getProfileName } from '../src/utils/stats';
import { Config } from '../src/constants/config';
import { playDynamicAudio, stopAudio } from '../src/utils/audio';
import scholarData from '../src/data/scholar_answers.json';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'What is the meaning of Dharma?',
  'How do I deal with grief and loss?',
  'What does Krishna say about fear?',
  'How can I find inner peace?',
  'What is karma and how does it work?',
  'How do I act without attachment to results?',
];

const SCHOLAR_CONTEXT = {
  chapter: 0,
  verse: 0,
  sanskrit: '',
  transliteration: '',
  translation_english: '',
  chapterName: 'General Dharmic Wisdom',
};

// Search precomputed answers for a matching response
function findPrecomputedAnswer(question: string): string | null {
  const q = question.toLowerCase().trim();
  const scholarDb = (scholarData as any)?.default || scholarData;
  
  // Search through all verse Q&As for a relevant match
  const keywords = q.split(/\s+/).filter(w => w.length > 3);
  let bestMatch: { answer: string; score: number } | null = null;
  
  for (const [_key, answers] of Object.entries(scholarDb)) {
    if (!Array.isArray(answers)) continue;
    for (const entry of answers as Array<{ question: string; answer: string }>) {
      const entryQ = entry.question.toLowerCase();
      const entryA = entry.answer.toLowerCase();
      
      // Score based on keyword overlap
      let score = 0;
      for (const kw of keywords) {
        if (entryQ.includes(kw)) score += 3;
        if (entryA.includes(kw)) score += 1;
      }
      
      // Direct question match boost
      if (entryQ.includes(q) || q.includes(entryQ)) score += 10;
      
      // Topic-specific boosts
      if (q.includes('dharma') && (entryQ.includes('dharma') || entryA.includes('dharma'))) score += 5;
      if (q.includes('karma') && (entryQ.includes('karma') || entryA.includes('karma'))) score += 5;
      if (q.includes('peace') && (entryQ.includes('peace') || entryA.includes('peace'))) score += 5;
      if (q.includes('fear') && (entryQ.includes('fear') || entryA.includes('fear'))) score += 5;
      if (q.includes('grief') && (entryQ.includes('grief') || entryA.includes('grief'))) score += 5;
      if (q.includes('soul') && (entryQ.includes('soul') || entryA.includes('soul') || entryA.includes('atman'))) score += 5;
      if (q.includes('meditation') && (entryQ.includes('meditation') || entryA.includes('meditation') || entryA.includes('dhyana'))) score += 5;
      if (q.includes('devotion') && (entryQ.includes('devotion') || entryA.includes('devotion') || entryA.includes('bhakti'))) score += 5;
      if (q.includes('action') && (entryQ.includes('action') || entryA.includes('action') || entryA.includes('karma yoga'))) score += 5;
      if (q.includes('death') && (entryQ.includes('death') || entryA.includes('death') || entryA.includes('departure'))) score += 5;
      if (q.includes('attachment') && (entryQ.includes('attachment') || entryA.includes('attachment'))) score += 5;
      
      if (score > (bestMatch?.score || 3)) {
        bestMatch = { answer: entry.answer, score };
      }
    }
  }
  
  return bestMatch ? bestMatch.answer : null;
}

export default function ScholarScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileName, setProfileName] = useState('Seeker');
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const streamingRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    getProfileName().then((name) => {
      setProfileName(name || 'Seeker');
    });
    return () => {
      if (streamingRef.current) clearInterval(streamingRef.current);
    };
  }, []);

  // Simulate typing effect - stream text word by word
  const streamResponse = useCallback((fullText: string, msgTimestamp: number) => {
    const words = fullText.split(' ');
    let currentIndex = 0;
    
    setStreamingText('');
    
    streamingRef.current = setInterval(() => {
      if (currentIndex >= words.length) {
        if (streamingRef.current) clearInterval(streamingRef.current);
        // Replace streaming message with final message
        setMessages(prev => prev.map(m => 
          m.timestamp === msgTimestamp 
            ? { ...m, content: fullText, isStreaming: false }
            : m
        ));
        setStreamingText('');
        setIsLoading(false);
        return;
      }
      
      currentIndex++;
      const partial = words.slice(0, currentIndex).join(' ');
      setStreamingText(partial);
      setMessages(prev => prev.map(m => 
        m.timestamp === msgTimestamp 
          ? { ...m, content: partial }
          : m
      ));
      
      // Auto-scroll during stream
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, 35 + Math.random() * 25); // 35-60ms per word for natural feel
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setInputText('');
    const userMsg: Message = { role: 'user', content: trimmed, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

    // Short delay before showing response (simulate "thinking")
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    // Try precomputed answer first
    const precomputed = findPrecomputedAnswer(trimmed);
    
    if (precomputed) {
      // Stream the precomputed answer with typing effect
      const msgTimestamp = Date.now();
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: '', 
        timestamp: msgTimestamp,
        isStreaming: true 
      };
      setMessages(prev => [...prev, assistantMsg]);
      streamResponse(precomputed, msgTimestamp);
    } else {
      // Fall back to Gemini API for truly novel questions
      try {
        const apiKey = Config.GEMINI_API_KEY;
        if (!apiKey) {
          const fallbackText = "I appreciate your question, dear seeker. This is a profound inquiry that requires deep contemplation. The Bhagavad Gita teaches us in Chapter 2, Verse 47 that we should focus on our actions without attachment to results. May I suggest exploring specific verses that relate to your question? Try asking about specific topics like dharma, karma, meditation, or the nature of the soul.";
          const msgTimestamp = Date.now();
          const assistantMsg: Message = { role: 'assistant', content: '', timestamp: msgTimestamp, isStreaming: true };
          setMessages(prev => [...prev, assistantMsg]);
          streamResponse(fallbackText, msgTimestamp);
          return;
        }
        
        const history = updated.slice(-8).map(m => ({ role: m.role, content: m.content }));
        const response = await getDeepDiveResponse(SCHOLAR_CONTEXT, trimmed, history);
        const msgTimestamp = Date.now();
        const assistantMsg: Message = { role: 'assistant', content: '', timestamp: msgTimestamp, isStreaming: true };
        setMessages(prev => [...prev, assistantMsg]);
        streamResponse(response, msgTimestamp);
      } catch (e: any) {
        const errorMsg: Message = {
          role: 'assistant',
          content: 'I am reflecting deeply on your question. Please try again in a moment, or ask about a specific Gita topic like dharma, karma, or meditation.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
        setIsLoading(false);
      }
    }
  }, [messages, isLoading, streamResponse]);

  const handlePlayAudio = async (text: string, msgId: number) => {
    if (playingMessageId === msgId) {
      await stopAudio();
      setPlayingMessageId(null);
      return;
    }
    
    await stopAudio();
    setPlayingMessageId(msgId);
    
    try {
      await playDynamicAudio(
        text,
        'english',
        () => setPlayingMessageId(null),
        () => setPlayingMessageId(null)
      );
    } catch (e) {
      setPlayingMessageId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Ask the Scholar</Text>
          <Text style={styles.headerSubtitle}>Bhagavad Gita Wisdom · AI Powered</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={() => { setMessages([]); if (streamingRef.current) clearInterval(streamingRef.current); }}
            style={styles.clearButton}
          >
            <Ionicons name="refresh" size={20} color="#D4A44C" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome message if no chat */}
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.omSymbol}>ॐ</Text>
              <Text style={styles.welcomeTitle}>Namaste, {profileName}</Text>
              <Text style={styles.welcomeText}>
                Ask me anything about the Bhagavad Gita, Dharma, life challenges, or spirituality. 
                I am here to offer wisdom with humility.
              </Text>
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>You might ask...</Text>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{q}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#D4A44C" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={styles.scholarBadge}>
                    <Text style={styles.scholarBadgeText}>🧘 Scholar</Text>
                  </View>
                  {!msg.isStreaming && (
                    <TouchableOpacity onPress={() => handlePlayAudio(msg.content, msg.timestamp)}>
                      <Ionicons 
                        name={playingMessageId === msg.timestamp ? "stop-circle" : "volume-medium"} 
                        size={20} 
                        color="#D4A44C" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Text style={[
                styles.bubbleText,
                msg.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
              ]}>
                {msg.content}
                {msg.isStreaming && <Text style={styles.cursor}>▊</Text>}
              </Text>
            </View>
          ))}

          {/* Loading indicator */}
          {isLoading && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <View style={styles.scholarBadge}>
                <Text style={styles.scholarBadgeText}>🧘 Scholar</Text>
              </View>
              <View style={styles.typingDots}>
                <Text style={styles.typingText}>Reflecting on the wisdom of the Gita...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about Dharma, Karma, life..."
            placeholderTextColor="#555"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0D0D0D',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 11, color: '#888', marginTop: 2 },
  clearButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(212, 164, 76, 0.15)', alignItems: 'center', justifyContent: 'center',
  },

  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 32 },

  welcomeContainer: { alignItems: 'center', paddingVertical: 24 },
  omSymbol: { fontSize: 64, color: '#D4A44C', marginBottom: 12 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  welcomeText: {
    fontSize: 15, color: '#AAA', textAlign: 'center',
    lineHeight: 22, paddingHorizontal: 20, marginBottom: 28,
  },

  suggestionsContainer: { width: '100%' },
  suggestionsTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 12, paddingHorizontal: 4 },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1A1A1A', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionText: { fontSize: 14, color: '#E0E0E0', flex: 1, marginRight: 8 },

  bubble: {
    maxWidth: '88%', marginBottom: 14, borderRadius: 18, padding: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#D4A44C',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  scholarBadge: { marginBottom: 6 },
  scholarBadgeText: { fontSize: 12, fontWeight: '600', color: '#D4A44C' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: '#0D0D0D' },
  assistantBubbleText: { color: '#E0E0E0' },
  cursor: { color: '#D4A44C', fontSize: 14 },

  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 14, color: '#888', fontStyle: 'italic' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0D0D0D',
  },
  textInput: {
    flex: 1, backgroundColor: '#1A1A1A',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#FFF', maxHeight: 120,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#D4A44C', alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#333' },
});
