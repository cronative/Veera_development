import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  const timestamp = new Date(message.timestamp);
  const formattedTime = timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
  });
  
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.botContainer
    ]}>
      <View style={[
        styles.bubble, 
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.botMessageText
        ]}>
          {message.text}
        </Text>
      </View>
      <Text style={styles.timestamp}>{formattedTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginBottom: SIZES.spacing_16,
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: SIZES.radius_16,
    paddingHorizontal: SIZES.spacing_16,
    paddingVertical: SIZES.spacing_12,
    marginBottom: SIZES.spacing_4,
  },
  userBubble: {
    backgroundColor: COLORS.pastelGreenDark,
    borderTopRightRadius: SIZES.radius_4,
  },
  botBubble: {
    backgroundColor: COLORS.pastelYellow,
    borderTopLeftRadius: SIZES.radius_4,
  },
  messageText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.white,
  },
  botMessageText: {
    color: COLORS.textDark,
  },
  timestamp: {
    ...FONTS.regular,
    fontSize: SIZES.xxs,
    color: COLORS.textLight,
    alignSelf: 'flex-end',
  },
});