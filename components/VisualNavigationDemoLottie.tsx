import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import Colors from '@/constants/colors';

interface VisualNavigationDemoLottieProps {
  /**
   * Source for the Lottie animation JSON file
   * Can be a require() statement or a URL
   * Example: require('@/assets/lottie/onboarding-visual.json')
   */
  source?: any;
  /**
   * Whether to auto-play the animation
   * @default true
   */
  autoPlay?: boolean;
  /**
   * Whether to loop the animation
   * @default true
   */
  loop?: boolean;
}

const defaultLottieSource = require('../assets/lottie/onboarding-visual.json');

/**
 * Lottie-based Visual Navigation Demo for Onboarding Screen 2
 * 
 * This component displays a Lottie animation demonstrating the TravelSnap workflow:
 * 1. Camera interface opening
 * 2. Taking a photo
 * 3. Location detection
 * 4. Stations list reveal
 * 5. Maps transition
 * 
 * To use this component:
 * 1. Create the Lottie animation using the prompt in LOTTIE_PROMPT.md
 * 2. Save the JSON file to assets/lottie/onboarding-visual.json
 * 3. Replace VisualNavigationDemo with this component in onboarding.tsx
 */
export default function VisualNavigationDemoLottie({
  source,
  autoPlay = true,
  loop = true,
}: VisualNavigationDemoLottieProps) {
  // Use the provided source or the default one
  const lottieSource = source || defaultLottieSource;

  // If no Lottie file is available, show a placeholder
  if (!lottieSource) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          Lottie animation will appear here{'\n'}
          <Text style={styles.placeholderSubtext}>
            Add onboarding-visual.json to assets/lottie/
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LottieView
        source={lottieSource}
        autoPlay={autoPlay}
        loop={loop}
        style={styles.animation}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
