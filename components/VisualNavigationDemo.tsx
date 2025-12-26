import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Navigation, Train, ArrowRight, Hotel, Utensils, Zap, Smartphone, Coffee } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSettings } from "@/context/SettingsContext";

const STREET_IMAGE = "https://images.unsplash.com/photo-1577086664693-8945534a7617?q=80&w=1000&auto=format&fit=crop"; // Modern city street
const MAP_IMAGE = "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop"; // Map abstract


const STEPS = {
  CAMERA: 0,
  PROCESSING: 1,
  STATIONS: 2,
  DETAILS: 3,
  MAP: 4,
};

export default function VisualNavigationDemo() {
  const { t } = useSettings();
  const [step, setStep] = useState(STEPS.CAMERA);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Flash animation
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      if (!isMounted) return;
      
      // Step 0: Camera (Start)
      setStep(STEPS.CAMERA);
      await delay(2500);
      if (!isMounted) return;

      // Snap Flash
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      
      await delay(300);
      if (!isMounted) return;

      // Step 1: Processing
      setStep(STEPS.PROCESSING);
      await delay(2000);
      if (!isMounted) return;

      // Step 2: Stations List
      setStep(STEPS.STATIONS);
      slideAnim.setValue(100);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
      }).start();
      await delay(2000);
      if (!isMounted) return;

      // Step 3: Station Details
      setStep(STEPS.DETAILS);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      await delay(2000);
      if (!isMounted) return;

      // Step 4: Map
      setStep(STEPS.MAP);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      await delay(3000);
      if (!isMounted) return;

      // Loop back
      runSequence();
    };

    runSequence();

    return () => {
      isMounted = false;
    };
  }, [fadeAnim, flashAnim, slideAnim]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <View style={styles.container}>
      <View style={styles.phoneFrame}>
        {/* Dynamic Content */}
        {step === STEPS.CAMERA && <CameraView t={t} />}
        {step === STEPS.PROCESSING && <ProcessingView t={t} />}
        {step === STEPS.STATIONS && <StationsView anim={slideAnim} t={t} />}
        {step === STEPS.DETAILS && <DetailsView anim={fadeAnim} t={t} />}
        {step === STEPS.MAP && <MapView anim={fadeAnim} t={t} />}

        {/* Flash Overlay */}
        <Animated.View 
          style={[
            styles.flash, 
            { opacity: flashAnim }
          ]} 
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

// Sub-components for cleaner code

function CameraView({ t }: { t: any }) {
  return (
    <View style={styles.fullSize}>
      <Image source={{ uri: STREET_IMAGE }} style={styles.image} contentFit="cover" />
      <View style={styles.cameraOverlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('demo', 'scanLocation')}</Text>
        </View>
        <View style={styles.reticle} />
        <View style={styles.cameraControls}>
          <View style={styles.captureButtonOuter}>
            <View style={styles.captureButtonInner} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ProcessingView({ t }: { t: any }) {
  return (
    <View style={styles.fullSize}>
      <Image source={{ uri: STREET_IMAGE }} style={[styles.image, { opacity: 0.6 }]} contentFit="cover" />
      <View style={styles.centerContent}>
        <View style={styles.scannerRing}>
           <MapPin size={32} color={Colors.primary} />
        </View>
        <View style={styles.processingBadge}>
           <Text style={styles.processingText}>{t('demo', 'identifyingLocation')}</Text>
        </View>
      </View>
    </View>
  );
}

// Icons
// import { MapPin, Navigation, Train, ArrowRight, Hotel, Utensils, Zap, Smartphone, Coffee } from 'lucide-react-native';

// ... existing code ...

function StationsView({ anim, t }: { anim: Animated.Value, t: any }) {
  return (
    <View style={styles.fullSize}>
       <Image source={{ uri: STREET_IMAGE }} style={[styles.image, { opacity: 0.3 }]} contentFit="cover" />
       
       <View style={styles.locationCard}>
          <MapPin size={16} color={Colors.primary} />
          <Text style={styles.locationText}>Market St, San Francisco</Text>
       </View>

       <Animated.View style={[styles.stationsList, { transform: [{ translateY: anim }] }]}>
          <Text style={styles.sectionTitle}>{t('demo', 'exploreNearby')}</Text>
          
          <View style={styles.scrollContent}>
            <ListItem icon={Train} color="#1976D2" bg="#E3F2FD" title={t('demo', 'nearestStations')} subtitle="Central Station • 2 min" />
            <ListItem icon={Hotel} color="#F57C00" bg="#FFF3E0" title={t('demo', 'nearbyHotels')} subtitle="3 hotels within 500m" />
            <ListItem icon={Utensils} color="#D32F2F" bg="#FFEBEE" title={t('demo', 'foodDelivery')} subtitle="UberEats, DoorDash" />
            <ListItem icon={Zap} color="#FBC02D" bg="#FFFDE7" title={t('demo', 'thingsToDo')} subtitle="Museums, Parks" />
            <ListItem icon={Navigation} color="#0097A7" bg="#E0F7FA" title={t('demo', 'bookRide')} subtitle="Uber, Lyft available" />
            <ListItem icon={Smartphone} color="#7B1FA2" bg="#F3E5F5" title={t('demo', 'esim')} subtitle="Data plans for USA" />
            <ListItem icon={Coffee} color="#795548" bg="#EFEBE9" title={t('demo', 'restaurants')} subtitle="Starbucks, Local cafes" />
          </View>
       </Animated.View>
    </View>
  );
}

function ListItem({ icon: Icon, color, bg, title, subtitle }: any) {
  return (
    <View style={styles.stationItem}>
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.stationInfo}>
        <Text style={styles.stationName}>{title}</Text>
        <Text style={styles.stationMeta}>{subtitle}</Text>
      </View>
      <ArrowRight size={16} color={Colors.textSecondary} />
    </View>
  );
}

function DetailsView({ anim, t }: { anim: Animated.Value, t: any }) {
  return (
    <Animated.View style={[styles.fullSize, { opacity: anim, backgroundColor: 'white' }]}>
       <View style={styles.detailsHeader}>
         <Image source={{ uri: STREET_IMAGE }} style={styles.detailsImage} contentFit="cover" />
         <View style={styles.detailsOverlay}>
            <Text style={styles.detailsTitle}>Central Station</Text>
            <View style={styles.detailsRating}>
               <Text style={styles.ratingText}>4.8 ★ (120 reviews)</Text>
            </View>
         </View>
       </View>
       <View style={styles.detailsContent}>
          <View style={styles.detailsRow}>
             <View style={styles.detailIcon}><Train size={20} color={Colors.primary}/></View>
             <Text style={styles.detailText}>Trains every 5 mins</Text>
          </View>
          <View style={styles.detailsRow}>
             <View style={styles.detailIcon}><MapPin size={20} color={Colors.primary}/></View>
             <Text style={styles.detailText}>0.2 miles away</Text>
          </View>
          <View style={styles.openMapBtn}>
             <Text style={styles.openMapText}>{t('demo', 'openingMaps')}</Text>
          </View>
       </View>
    </Animated.View>
  );
}

function MapView({ anim, t }: { anim: Animated.Value, t: any }) {
  return (
    <Animated.View style={[styles.fullSize, { opacity: anim }]}>
      <Image source={{ uri: MAP_IMAGE }} style={styles.image} contentFit="cover" />
      
      {/* Route Line Simulation */}
      <View style={styles.mapOverlay}>
        <View style={styles.routeCard}>
           <View style={styles.routeHeader}>
             <Text style={styles.routeTitle}>{t('demo', 'walkingTo')} Central Station</Text>
             <Text style={styles.routeTime}>2 min (150m)</Text>
           </View>
           <View style={styles.startNavigationBtn}>
              <Navigation size={16} color="white" />
              <Text style={styles.btnText}>{t('demo', 'start')}</Text>
           </View>
        </View>
        
        {/* Map Markers */}
        <View style={styles.mapMarkerUser}>
           <View style={styles.markerDot} />
        </View>
        <View style={styles.mapMarkerDest}>
           <MapPin size={24} color={Colors.primary} fill="white" />
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
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  fullSize: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  reticle: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignSelf: 'center',
    borderRadius: 20,
  },
  cameraControls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButtonOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scannerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  processingBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  processingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  locationCard: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  stationsList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  stationName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  stationMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  routeCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  routeHeader: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  routeTime: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  startNavigationBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  mapMarkerUser: {
    position: 'absolute',
    top: '60%',
    left: '40%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    elevation: 4,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  mapMarkerDest: {
    position: 'absolute',
    top: '30%',
    left: '60%',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    elevation: 4,
  },
  scrollContent: {
    gap: 12,
  },
  detailsHeader: {
    height: '50%',
    width: '100%',
    position: 'relative',
  },
  detailsImage: {
    width: '100%',
    height: '100%',
  },
  detailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  detailsRating: {
    backgroundColor: '#FFC107',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'black',
  },
  detailsContent: {
    padding: 24,
    flex: 1,
    gap: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: Colors.text,
  },
  openMapBtn: {
    marginTop: 'auto',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  openMapText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
