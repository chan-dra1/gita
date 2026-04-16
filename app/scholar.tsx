/**
 * Ask the Scholar — General Spiritual AI Chat
 * Powered by Gemini Flash for low-cost, fast responses.
 * No sloka context: this is a general Gita/Dharma Q&A.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getDeepDiveResponse } from '../src/utils/gemini';
import { getProfileName } from '../src/utils/stats';
import { Config } from '../src/constants/config';
import { playDynamicAudio, stopAudio } from '../src/utils/audio';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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

export default function ScholarScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileName, setProfileName] = useState('Seeker');
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    getProfileName().then((name) => {
      setProfileName(name || 'Seeker');
    });
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const apiKey = Config.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      Alert.alert(
        '🧘 Scholar Setup Required',
        'Add your Gemini API key to src/constants/config.ts to enable the AI Scholar.',
        [{ text: 'Got it' }]
      );
      return;
    }

    setInputText('');
    const userMsg: Message = { role: 'user', content: trimmed, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

    try {
      const history = updated.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const response = await getDeepDiveResponse(SCHOLAR_CONTEXT, trimmed, history);
      const assistantMsg: Message = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (e: any) {
      const errorMsg: Message = {
        role: 'assistant',
        content: 'I am unable to respond right now. Please try again shortly.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

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
          <Text style={styles.headerSubtitle}>Powered by Gemini · Bhagavad Gita Wisdom</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={() => setMessages([])}
            style={styles.clearButton}
          >
            <Ionicons name="refresh" size={20} color="#E8751A" />
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
                    <Ionicons name="arrow-forward" size={14} color="#E8751A" />
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
                  <TouchableOpacity onPress={() => handlePlayAudio(msg.content, msg.timestamp)}>
                    <Ionicons 
                      name={playingMessageId === msg.timestamp ? "stop-circle" : "volume-medium"} 
                      size={20} 
                      color="#E8751A" 
                    />
                  </TouchableOpacity>
                </View>
              )}
              <Text style={[
                styles.bubbleText,
                msg.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
              ]}>
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Loading bubble */}
          {isLoading && (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <View style={styles.scholarBadge}>
                <Text style={styles.scholarBadgeText}>🧘 Scholar</Text>
              </View>
              <View style={styles.typingDots}>
                <ActivityIndicator size="small" color="#E8751A" />
                <Text style={styles.typingText}>Reflecting...</Text>
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
            placeholderTextColor="#B0A090"
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
    backgroundColor: 'rgba(232, 117, 26, 0.15)', alignItems: 'center', justifyContent: 'center',
  },

  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 32 },

  welcomeContainer: { alignItems: 'center', paddingVertical: 24 },
  omSymbol: { fontSize: 64, color: '#E8751A', marginBottom: 12 },
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
    backgroundColor: '#E8751A',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  scholarBadge: { marginBottom: 6 },
  scholarBadgeText: { fontSize: 12, fontWeight: '600', color: '#E8751A' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: '#FFF' },
  assistantBubbleText: { color: '#E0E0E0' },

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
    backgroundColor: '#E8751A', alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#333' },
});
