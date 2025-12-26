import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Camera, Mic, Check, ChevronRight, ArrowRight, ChevronLeft, MapPin } from "lucide-react-native";
import VisualNavigationDemo from "@/components/VisualNavigationDemo";
import VoiceNavigationDemo from "@/components/VoiceNavigationDemo";
import Colors from "@/constants/colors";
import { useOnboarding } from "@/context/OnboardingContext";
import { useSettings } from "@/context/SettingsContext";


const STEPS = [
  {
    id: "welcome",
    title: "", // Custom handled
    subtitle: "", // Custom handled
  },
  {
    id: "visual",
    title: "Snap & Navigate",
    subtitle: "Snap a photo to instantly identify your location and discover nearby stations, hotels, food, and activities.",
  },
  {
    id: "voice",
    title: "Speak Your Destination",
    subtitle: "Simply say where you want to go and we'll generate the perfect route for you",
  },
  {
    id: "ready",
    title: "You're All Set!",
    subtitle: "Choose how you want to start exploring",
  },
];

const TypewriterText = ({ text, delay = 0, speed = 50, style, onComplete }: any) => {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          if (onCompleteRef.current) onCompleteRef.current();
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [text, delay, speed]);

  return <Text style={style}>{displayedText}</Text>;
};

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Step 0 specific animations
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const line1FadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  const { completeOnboarding } = useOnboarding();
  const { t } = useSettings();

  useEffect(() => {
    if (currentStep === 0) {
      Animated.sequence([
        Animated.timing(logoFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(line1FadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep, logoFadeAnim, line1FadeAnim]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      animateTransition(() => setCurrentStep(currentStep + 1));
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep(currentStep - 1));
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace("/auth");
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20, // Slide out slightly
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(20); // Reset to slide in position
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const renderContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <View style={styles.container}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" }}
                style={styles.backgroundImage}
                contentFit="cover"
                transition={1000}
              />
              <LinearGradient
                colors={['transparent', '#E0F2FE', '#E0F2FE']}
                locations={[0, 0.6, 1]}
                style={styles.gradientOverlay}
              >
                <SafeAreaView style={styles.safeArea}>
                  <View style={styles.welcomeContent}>
                    <View style={styles.heroContainer}>
                       {/* Floating Icons Visualization */}
                       <Animated.View style={[styles.iconComposition, { opacity: logoFadeAnim }]}>
                          <View style={[styles.iconCircle, { transform: [{ rotate: '-15deg' }, { translateY: 20 }] }]}>
                             <Camera size={32} color={Colors.primary} strokeWidth={2.5} />
                          </View>
                          <View style={[styles.iconCircle, styles.mainIconCircle, { zIndex: 10 }]}>
                             <MapPin size={48} color="#FFFFFF" fill="#EF4444" />
                          </View>
                          <View style={[styles.iconCircle, { transform: [{ rotate: '15deg' }, { translateY: 20 }] }]}>
                             <Mic size={32} color={Colors.primary} strokeWidth={2.5} />
                          </View>
                       </Animated.View>
                    </View>
                    
                    <View style={styles.textWrapper}>
                      <Animated.Text style={[styles.welcomeLine1, { opacity: line1FadeAnim, color: Colors.text }]}>
                        {t('onboarding', 'step1Title')}
                      </Animated.Text>
                      
                      <View style={styles.typewriterContainer}>
                        <TypewriterText 
                          text={t('onboarding', 'step1Subtitle')}
                          delay={1000}
                          speed={40}
                          style={[styles.welcomeLine2, { color: Colors.textSecondary }]}
                          onComplete={() => {
                            Animated.timing(buttonFadeAnim, {
                              toValue: 1,
                              duration: 500,
                              useNativeDriver: true,
                            }).start();
                          }}
                        />
                      </View>
                    </View>

                    <Animated.View style={{ opacity: buttonFadeAnim, width: '100%' }}>
                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleNext}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.continueButtonText}>{t('onboarding', 'getStarted')}</Text>
                        <ArrowRight color="white" size={20} />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </SafeAreaView>
              </LinearGradient>
          </View>
        );

      case 1: // Visual Demo
        return (
          <View style={styles.stepContainer}>
            <View style={styles.demoPreviewContainer}>
              <VisualNavigationDemo />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{t('onboarding', 'visualTitle')}</Text>
              <Text style={styles.subtitle}>{t('onboarding', 'visualSubtitle')}</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t('onboarding', 'next')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 2: // Voice Demo
        return (
          <View style={styles.stepContainer}>
            <View style={styles.demoPreviewContainer}>
              <VoiceNavigationDemo />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{t('onboarding', 'voiceTitle')}</Text>
              <Text style={styles.subtitle}>{t('onboarding', 'voiceSubtitle')}</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t('onboarding', 'next')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 3: // Ready
        return (
          <View style={styles.stepContainer}>
             <View style={styles.successIconContainer}>
               <Check color={Colors.primary} size={64} strokeWidth={3} />
             </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{t('onboarding', 'getStarted')}!</Text>
              <Text style={styles.subtitle}>{t('onboarding', 'visualSubtitle')}</Text>
            </View>

            <View style={styles.finalActions}>
               <TouchableOpacity 
                 style={styles.actionCard}
                 onPress={handleFinish}
                 activeOpacity={0.8}
               >
                 <View style={[styles.iconBox, { backgroundColor: Colors.primary + '20' }]}>
                    <Camera color={Colors.primary} size={28} />
                 </View>
                 <View style={{flex: 1}}>
                    <Text style={styles.actionCardTitle}>{t('onboarding', 'visualTitle')}</Text>
                    <Text style={styles.actionCardDesc}>{t('home', 'identifyLandmarks')}</Text>
                 </View>
                 <ChevronRight color={Colors.textSecondary} size={20} />
               </TouchableOpacity>

               <TouchableOpacity 
                 style={styles.actionCard}
                 onPress={handleFinish}
                 activeOpacity={0.8}
               >
                 <View style={[styles.iconBox, { backgroundColor: Colors.primary + '20' }]}>
                    <Mic color={Colors.primary} size={28} />
                 </View>
                 <View style={{flex: 1}}>
                    <Text style={styles.actionCardTitle}>{t('onboarding', 'voiceTitle')}</Text>
                    <Text style={styles.actionCardDesc}>{t('home', 'sayDestination')}</Text>
                 </View>
                 <ChevronRight color={Colors.textSecondary} size={20} />
               </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, styles.finalButton]}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t('onboarding', 'getStarted')}</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {currentStep > 0 && (
        <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ChevronLeft color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
        </SafeAreaView>
      )}
      
      {currentStep === 0 ? (
        renderContent()
      ) : (
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
             <Animated.View
                style={[
                styles.content,
                {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                },
                ]}
            >
                {renderContent()}
            </Animated.View>

             {/* Pagination Dots */}
            <View style={styles.pagination}>
                {STEPS.map((_, index) => (
                <View
                    key={index}
                    style={[
                    styles.dot,
                    index === currentStep ? styles.activeDot : styles.inactiveDot,
                    ]}
                />
                ))}
            </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  headerSafeArea: {
    zIndex: 10,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconComposition: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: -15,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  mainIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    transform: [{ translateY: -10 }],
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  spacer: {
      flex: 1,
  },
  textWrapper: {
    gap: 12,
    marginBottom: 40,
  },
  welcomeLine1: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  typewriterContainer: {
    minHeight: 50,
  },
  welcomeLine2: {
    fontSize: 18,
    color: Colors.textSecondary,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: "500",
  },
  continueButton: {
    backgroundColor: "#1E88E5",
    height: 52,
    borderRadius: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: "700",
  },
  demoPreviewContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  mockCamera: {
    flex: 1,
    backgroundColor: '#333',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  mockVoiceText: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  finalActions: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  finalButton: {
    marginTop: 'auto',
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: Colors.border,
  },
});
