import { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { Send } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

interface ChatInputProps {
  onSend: (message: string) => void;
  isTyping?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ChatInput({ onSend, isTyping }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const sendButtonScale = useSharedValue(1);
  
  const handleSend = () => {
    if (message.trim() === '') return;
    
    onSend(message.trim());
    setMessage('');
  };
  
  const handlePressIn = () => {
    sendButtonScale.value = withSpring(0.9, { damping: 10, stiffness: 200 });
  };
  
  const handlePressOut = () => {
    sendButtonScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };
  
  const animatedSendButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: sendButtonScale.value }],
    };
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={isTyping ? "Vera is typing..." : "Ask anything..."}
          placeholderTextColor={COLORS.textLight}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          blurOnSubmit={Platform.OS === 'ios' ? false : true}
          editable={!isTyping}
        />
        
        <AnimatedTouchable
          style={[styles.sendButton, animatedSendButtonStyle]}
          onPress={handleSend}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={message.trim() === '' || isTyping}
        >
          {isTyping ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Send 
              size={20} 
              color={message.trim() === '' ? COLORS.textLight : COLORS.white} 
            />
          )}
        </AnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.spacing_16,
    paddingTop: SIZES.spacing_12,
    paddingBottom: Platform.OS === 'ios' ? SIZES.spacing_32 : SIZES.spacing_16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius_20,
    paddingHorizontal: SIZES.spacing_16,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  input: {
    ...FONTS.regular,
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    color: COLORS.textDark,
    fontSize: SIZES.md,
    paddingTop: SIZES.spacing_12,
  },
  sendButton: {
    backgroundColor: COLORS.pastelGreenDark,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.spacing_8,
  },
});