import Button from '@/components/ui/Button';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ImageSourcePropType,
} from 'react-native';

// Helper component for blobs
interface BackgroundBlobProps {
  source: ImageSourcePropType;
  style?: object;
}

const BackgroundBlob: React.FC<BackgroundBlobProps> = ({ source, style }) => (
  <Image source={source} style={style} resizeMode="contain" />
);

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GetStartedScreen: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenIntro', 'true');
    // router.push('/index'); // goes back to index to apply logic (e.g., login/signup redirect)
  };

  return (
    <View style={styles.container}>
      {/* Yellow Blob - Top Left */}
      <BackgroundBlob
        source={require('../assets/blobs/blob-yellow.png')}
        style={{
          position: 'absolute',
          width: SCREEN_WIDTH * 1.3, // 130% width for oversize effect
          height: SCREEN_HEIGHT * 0.4,
          top: 0,
          left: '-40%',
        }}
      />

      {/* Blue Blob - Bottom Right */}
      <BackgroundBlob
        source={require('../assets/blobs/blob-blue.png')}
        style={{
          position: 'absolute',
          width: SCREEN_WIDTH * 0.8,
          height: SCREEN_HEIGHT * 0.4,
          bottom: SCREEN_HEIGHT * 0.38,
          right: '-10%',
        }}
      />

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcome}>
          welcome to <Text style={styles.vera}>VERA</Text>
        </Text>

        <Text style={styles.subtitle}>
          practical insights and advice you didn’t know you needed to help thrive in college
        </Text>

        <Button
          title={'let’s get started'}
          // onPress={handleSignIn}
          disabled={false}
          style={styles.button}
        />
      </View>
    </View>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'flex-end',
    paddingBottom: SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.06 : SCREEN_HEIGHT * 0.11
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing_24,
    paddingBottom: SIZES.spacing_40,
  },
  welcome: {
    ...FONTS.darkerGrotesqueRegular,
    fontSize: SIZES.xxxxl,
    textAlign: 'center',
    color: COLORS.black,
    marginBottom: SIZES.spacing_4,
  },
  vera: {
    ...FONTS.calistoga,
    color: COLORS.veraColor,
  },
  subtitle: {
    ...FONTS.darkerGrotesqueMedium,
    fontSize: SIZES.xl,
    textAlign: 'center',
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: SIZES.spacing_40,
    maxWidth: SCREEN_WIDTH * 0.59,
  },
  button: {
    width: SCREEN_WIDTH * 0.55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.white,
  },
});
