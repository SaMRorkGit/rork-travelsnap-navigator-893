import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Mic, MapPin, Navigation } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSettings } from "@/context/SettingsContext";

const STATION_IMAGE = "https://r2-pub.rork.com/generated-images/44596df0-3e16-4f16-89d2-a3c1be48f8fb.png";
const MAP_IMAGE = "https://r2-pub.rork.com/generated-images/0326e162-2cbc-4a24-b9e9-6d7de413d1b6.png";

const STEPS = {
  LISTENING: 0,
  RECOGNIZED: 1,
  ROUTE: 2,
};

export default function VoiceNavigationDemo() {
  const { t } = useSettings();
  const [step, setStep] = useState(STEPS.LISTENING);
  
  // Animations
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const routeProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      if (!isMounted) return;

      // --- STEP 1: LISTENING ---
      setStep(STEPS.LISTENING);
      
      // Reset animations
      micScaleAnim.setValue(1);
      rippleAnim.setValue(0);
      slideUpAnim.setValue(50);
      fadeAnim.setValue(0);
      routeProgressAnim.setValue(0);

      // Pulse Microphone
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(micScaleAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
            Animated.timing(micScaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rippleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(rippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ])
      ).start();

      await delay(2500); // Simulate listening time
      if (!isMounted) return;
      micScaleAnim.stopAnimation();
      rippleAnim.stopAnimation();

      // --- STEP 2: RECOGNIZED ---
      setStep(STEPS.RECOGNIZED);
      
      // Animate Card In
      Animated.parallel([
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      await delay(2500); // Show recognized result
      if (!isMounted) return;

      // --- STEP 3: ROUTE ---
      setStep(STEPS.ROUTE);
      
      // Reset for map transition
      fadeAnim.setValue(0);
      
      // Fade in Map
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Animate Route Line (simulated by width or reveal)
      Animated.timing(routeProgressAnim, {
        toValue: 1,
        duration: 1500,
        delay: 300,
        useNativeDriver: false, // width doesn't support native driver
      }).start();

      await delay(4000); // Show map route
      if (!isMounted) return;

      // Loop
      runSequence();
    };

    runSequence();

    return () => {
      isMounted = false;
    };
  }, [fadeAnim, micScaleAnim, rippleAnim, routeProgressAnim, slideUpAnim]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <View style={styles.container}>
      <View style={styles.phoneFrame}>
        {step === STEPS.LISTENING && (
          <ListeningView micScale={micScaleAnim} ripple={rippleAnim} t={t} />
        )}
        {step === STEPS.RECOGNIZED && (
          <RecognizedView slideAnim={slideUpAnim} fadeAnim={fadeAnim} t={t} />
        )}
        {step === STEPS.ROUTE && (
          <RouteView fadeAnim={fadeAnim} routeProgress={routeProgressAnim} t={t} />
        )}
      </View>
    </View>
  );
}

function ListeningView({ micScale, ripple, t }: { micScale: Animated.Value, ripple: Animated.Value, t: any }) {
  return (
    <View style={styles.centerContent}>
      <View style={styles.rippleContainer}>
        <Animated.View 
          style={[
            styles.rippleRing, 
            { 
              transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
              opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
            }
          ]} 
        />
        <Animated.View style={[styles.micCircle, { transform: [{ scale: micScale }] }]}>
          <Mic size={40} color="white" />
        </Animated.View>
      </View>
      <Text style={styles.listeningText}>{t('voice', 'listening')}</Text>
      <Text style={styles.spokenText}>&quot;Go to Central Station&quot;</Text>
    </View>
  );
}

function RecognizedView({ slideAnim, fadeAnim, t }: { slideAnim: Animated.Value, fadeAnim: Animated.Value, t: any }) {
  return (
    <View style={styles.fullSize}>
      <Image source={{ uri: STATION_IMAGE }} style={styles.backgroundImage} contentFit="cover" />
      <View style={styles.overlay} />
      
      <Animated.View 
        style={[
          styles.resultCard, 
          { 
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim 
          }
        ]}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultLabel}>{t('demo', 'destinationFound')}</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>100% {t('demo', 'match')}</Text>
          </View>
        </View>
        
        <Text style={styles.destinationName}>Central Station</Text>
        <Text style={styles.destinationAddress}>12 Railway Avenue, City Center</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Navigation size={16} color={Colors.primary} />
            <Text style={styles.metaText}>1.2 km</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>•</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>15 min walk</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function RouteView({ fadeAnim, routeProgress, t }: { fadeAnim: Animated.Value, routeProgress: Animated.Value, t: any }) {
  const routeWidth = routeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <Animated.View style={[styles.fullSize, { opacity: fadeAnim }]}>
      <Image source={{ uri: MAP_IMAGE }} style={styles.backgroundImage} contentFit="cover" />
      
      {/* Start Point Marker */}
      <View style={[styles.mapMarker, { top: '70%', left: '20%' }]}>
         <View style={styles.userDot} />
      </View>

      {/* Destination Marker */}
      <View style={[styles.mapMarker, { top: '30%', left: '70%' }]}>
         <MapPin size={28} color={Colors.primary} fill="white" />
      </View>

      {/* Animated Route Line (Simulated) */}
      <View style={styles.routeContainer}>
         {/* This is a simplified straight line simulation for the demo */}
         {/* In a real map we'd use SVG Path, but View rotation works for simple demo */}
         <View style={styles.routeLineWrapper}>
            <Animated.View style={[styles.routeLineFill, { width: routeWidth }]} />
         </View>
      </View>

      {/* Navigation Card */}
      <View style={styles.bottomCard}>
         <View style={styles.navInfo}>
           <Text style={styles.navTitle}>{t('demo', 'routeTo')} Central Station</Text>
           <Text style={styles.navSubtitle}>{t('demo', 'fastestRoute')} • 15 min</Text>
         </View>
         <View style={styles.startBtn}>
            <Navigation size={18} color="white" />
            <Text style={styles.startBtnText}>{t('demo', 'start')}</Text>
         </View>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA', // Light background
    overflow: 'hidden',
    position: 'relative',
  },
  fullSize: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  // Listening Styles
  rippleContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary, // Use primary for voice
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  rippleRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    zIndex: 1,
  },
  listeningText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  spokenText: {
    fontSize: 22,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Recognized Styles
  resultCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '700',
  },
  destinationName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  // Route Styles
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: 'white',
  },
  routeContainer: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '50%', // Approximate distance between markers
    height: 160, // Approximate vertical distance
    // This is a hacky way to draw a diagonal line using a rotated view container
    // Ideally we use SVG, but this works for a simple visual demo without extra deps
  },
  routeLineWrapper: {
    position: 'absolute',
    top: 70, // Start from near User (70% top)
    left: 10,
    width: 200,
    height: 4,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderRadius: 2,
    transform: [{ rotate: '-35deg' }], // Angle up towards destination
    transformOrigin: 'left center', // This property might not work in RN, relying on positioning
    overflow: 'hidden',
  },
  routeLineFill: {
    height: '100%',
    backgroundColor: '#4285F4',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 100, // Pill shape
    padding: 8,
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  navInfo: {
    flex: 1,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  navSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  startBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
