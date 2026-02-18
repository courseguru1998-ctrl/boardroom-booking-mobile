import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAIChat } from '../../hooks/useAIChat';
import { Card, Header } from '../../components/common';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [inputText, setInputText] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  } = useAIChat();

  // Check if API key is configured
  useEffect(() => {
    const checkApiKey = async () => {
      const key = await SecureStore.getItemAsync('claude_api_key');
      setApiKeyConfigured(!!key);
    };
    checkApiKey();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const message = inputText.trim();
    setInputText('');

    await sendMessage(message);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? colors.primary : colors.surfaceSecondary,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#fff' : colors.text },
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={[styles.welcomeIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="chatbubbles" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.welcomeTitle, { color: colors.text }]}>
        AI Booking Assistant
      </Text>
      <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
        I can help you book meeting rooms. Just tell me what you need!
      </Text>

      <View style={styles.examplesContainer}>
        <Text style={[styles.examplesTitle, { color: colors.textSecondary }]}>
          Try saying:
        </Text>
        {[
          'Book a room for 5 people tomorrow at 2pm',
          'What rooms are available on Friday?',
          'Book a room with projector for 10 people',
        ].map((example, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.exampleChip, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => setInputText(example)}
          >
            <Text style={[styles.exampleText, { color: colors.text }]}>{example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNoApiKey = () => (
    <View style={styles.welcomeContainer}>
      <View style={[styles.welcomeIcon, { backgroundColor: colors.errorLight || '#ffebee' }]}>
        <Ionicons name="key-outline" size={40} color={colors.error} />
      </View>
      <Text style={[styles.welcomeTitle, { color: colors.text }]}>
        API Key Required
      </Text>
      <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
        Please add your Claude API key in Settings to use the AI assistant.
      </Text>
      <TouchableOpacity
        style={[styles.settingsButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.settingsButtonText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="AI Assistant"
        showProfile={true}
        onProfilePress={() => navigation.navigate('Settings')}
        rightAction={
          messages.length > 0
            ? {
                icon: 'trash-outline',
                onPress: clearChat,
              }
            : undefined
        }
      />

      {apiKeyConfigured === false ? (
        renderNoApiKey()
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? renderWelcome() : messages.map(renderMessage)}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Thinking...
                </Text>
              </View>
            )}

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.errorLight || '#ffebee' }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
              placeholder="Ask me to book a room..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.surfaceSecondary,
                },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? '#fff' : colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  examplesContainer: {
    width: '100%',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  exampleChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    textAlign: 'center',
  },
  settingsButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
