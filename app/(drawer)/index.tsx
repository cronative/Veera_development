import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import ChatBubble, { ChatMessage } from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';
import Card from '../../components/ui/Card';
import { useChat } from '../../hooks/useChat';
import { useEmailSync } from '../../hooks/useEmailSync';

export default function ChatScreen() {
  const { messages, sendMessage, isTyping } = useChat();
  const { triggerSync } = useEmailSync();
  const flatListRef = useRef<FlatList>(null);
  
  // Trigger email sync when chat screen loads
  useEffect(() => {
    console.log('[ChatScreen] Component mounted, triggering email sync');
    triggerSync();
  }, [triggerSync]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Vera</Text>
        <Text style={styles.headerSubtitle}>Your supportive study companion</Text>
      </View>
      
      <View style={styles.messageListContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <Card 
              style={styles.infoCard} 
              elevation="low"
            >
              <Text style={styles.infoTitle}>
                Hey there! 👋
              </Text>
              <Text style={styles.infoText}>
                I'm Vera, your personal study buddy and mentor. Think of me as your supportive older sibling who's been through college and wants to help you succeed.
              </Text>
              <Text style={styles.infoExample}>
                You can ask me about:
              </Text>
              <Text style={styles.infoExampleItem}>
                • Study strategies and time management
              </Text>
              <Text style={styles.infoExampleItem}>
                • Career planning and internships
              </Text>
              <Text style={styles.infoExampleItem}>
                • Academic challenges and stress management
              </Text>
              <Text style={styles.infoExampleItem}>
                • Campus life and social balance
              </Text>
            </Card>
          )}
        />
      </View>
      
      <ChatInput onSend={sendMessage} isTyping={isTyping} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.pastelYellow,
    paddingTop: SIZES.spacing_48,
    paddingBottom: SIZES.spacing_16,
    paddingHorizontal: SIZES.spacing_20,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xxl,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    marginTop: 4,
  },
  messageListContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: SIZES.spacing_16,
    paddingTop: SIZES.spacing_16,
    paddingBottom: SIZES.spacing_32,
  },
  infoCard: {
    backgroundColor: COLORS.pastelBlue,
    marginBottom: SIZES.spacing_20,
  },
  infoTitle: {
    ...FONTS.medium,
    fontSize: SIZES.lg,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_8,
  },
  infoText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_12,
    lineHeight: 22,
  },
  infoExample: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_8,
  },
  infoExampleItem: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginBottom: 4,
    paddingLeft: SIZES.spacing_8,
  },
});