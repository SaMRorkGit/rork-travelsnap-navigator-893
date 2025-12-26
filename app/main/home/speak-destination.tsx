import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Navigation,
  MapPin,
  Clock,
  Route,
  Volume2,
  VolumeX,
  ExternalLink,
  Footprints,
  Car,
  Train,
  Bus,
  ChevronRight,
  RotateCcw,
  Check,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { RouteData, RouteStep, OmioBookingLink } from '@/types';
import {
  geocodeAddress,
  getMultiModalDirections,
  reverseGeocode,
  isPublicTransportStep,
  generateOmioBookingLink,
  formatDistance,
  formatDuration,
} from '@/lib/speakDestinationApi';
import {
  DeepgramVoiceAgentService,
  createVoiceAgentSession,
  verifyDeepgramConfiguration,
} from '@/lib/services/DeepgramVoiceAgentService';

function verifyMapboxConfiguration(): { isValid: boolean; error?: string } {
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  
  console.log('[MapboxConfig] ========================================');
  console.log('[MapboxConfig] Verifying Mapbox configuration');
  console.log('[MapboxConfig] ========================================');
  console.log('[MapboxConfig] EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN present:', !!mapboxToken);
  console.log('[MapboxConfig] Token length:', mapboxToken.length);
  
  if (mapboxToken.length > 0) {
    console.log('[MapboxConfig] Token prefix:', mapboxToken.substring(0, 10) + '...');
  }
  
  if (!mapboxToken) {
    console.error('[MapboxConfig] ✗ Mapbox token is missing!');
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN is not set. Please configure this environment variable.'
    };
  }
  
  if (mapboxToken.length < 20) {
    console.error('[MapboxConfig] ✗ Mapbox token appears to be invalid (too short)');
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN appears to be invalid (too short).'
    };
  }
  
  console.log('[MapboxConfig] ✓ Configuration is valid');
  return { isValid: true };
}

type FlowState = 
  | 'idle'
  | 'listening'
  | 'processing'
  | 'confirming'
  | 'geocoding'
  | 'locating'
  | 'routing'
  | 'ready'
  | 'error';

export default function SpeakDestinationScreen() {
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [recognizedText, setRecognizedText] = useState('');
  const [extractedDestination, setExtractedDestination] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [bookingLinks, setBookingLinks] = useState<Map<string, OmioBookingLink>>(new Map());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  
  const deepgramServiceRef = useRef<DeepgramVoiceAgentService | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (flowState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [flowState, pulseAnim]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (deepgramServiceRef.current) {
        deepgramServiceRef.current.disconnect();
      }
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [isSpeaking]);

  const requestPermissions = useCallback(async () => {
    console.log('[SpeakDestination] Requesting permissions');
    
    const audioPermission = await Audio.requestPermissionsAsync();
    if (audioPermission.status !== 'granted') {
      throw new Error('Microphone permission is required');
    }

    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (locationPermission.status !== 'granted') {
      throw new Error('Location permission is required');
    }
    
    console.log('[SpeakDestination] Permissions granted');
  }, []);

  const startListening = useCallback(async () => {
    console.log('[SpeakDestination] ========================================');
    console.log('[SpeakDestination] Starting Speak Destination flow');
    console.log('[SpeakDestination] ========================================');
    
    const deepgramConfig = verifyDeepgramConfiguration();
    if (!deepgramConfig.isValid) {
      console.error('[SpeakDestination] ✗ Deepgram verification failed:', deepgramConfig.error);
      setFlowState('error');
      setErrorMessage(deepgramConfig.error || 'Deepgram configuration error');
      return;
    }
    
    const mapboxConfig = verifyMapboxConfiguration();
    if (!mapboxConfig.isValid) {
      console.error('[SpeakDestination] ✗ Mapbox verification failed:', mapboxConfig.error);
      setFlowState('error');
      setErrorMessage(mapboxConfig.error || 'Mapbox configuration error');
      return;
    }
    
    console.log('[SpeakDestination] ✓ All configurations verified');
    
    setErrorMessage('');
    setRecognizedText('');
    setExtractedDestination(null);
    
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.disconnect();
      deepgramServiceRef.current = null;
    }
    
    try {
      await requestPermissions();
      setFlowState('listening');
      
      console.log('[SpeakDestination] Creating Deepgram Voice Agent session...');
      const service = await createVoiceAgentSession({
        onConnected: () => {
          console.log('[SpeakDestination] ✓ Deepgram WebSocket connected successfully');
        },
        onSettingsApplied: () => {
          console.log('[SpeakDestination] ✓ Deepgram settings applied - ready to receive audio');
        },
        onTranscript: (text, role) => {
          console.log('[SpeakDestination] ========================================');
          console.log('[SpeakDestination] ✓ TRANSCRIPT RECEIVED FROM DEEPGRAM');
          console.log('[SpeakDestination] ========================================');
          console.log('[SpeakDestination]   Role:', role);
          console.log('[SpeakDestination]   Text:', text);
          console.log('[SpeakDestination]   Component mounted:', isMountedRef.current);
          
          if (isMountedRef.current) {
            if (role === 'user') {
              console.log('[SpeakDestination] ✓ Setting recognized text to UI');
              setRecognizedText(text);
            }
          }
        },
        onFunctionCall: (functionName, args, callId) => {
          console.log('[SpeakDestination] ========================================');
          console.log('[SpeakDestination] ✓ FUNCTION CALL RECEIVED');
          console.log('[SpeakDestination] ========================================');
          console.log('[SpeakDestination]   Function:', functionName);
          console.log('[SpeakDestination]   Arguments:', JSON.stringify(args));
          console.log('[SpeakDestination]   Call ID:', callId);
          
          if (functionName === 'start_navigation' && args.destination) {
            console.log('[SpeakDestination] ✓ Destination extracted:', args.destination);
            if (isMountedRef.current) {
              setExtractedDestination(args.destination);
              setRecognizedText(args.destination);
              setFlowState('confirming');
              console.log('[SpeakDestination] ✓ UI updated - showing confirmation screen');
            }
          }
        },
        onAgentSpeaking: (speaking) => {
          if (isMountedRef.current) {
            setIsAgentSpeaking(speaking);
          }
        },
        onError: (error) => {
          console.error('[SpeakDestination] ========================================');
          console.error('[SpeakDestination] ✗ DEEPGRAM ERROR');
          console.error('[SpeakDestination] ========================================');
          console.error('[SpeakDestination] Error message:', error.message);
          console.error('[SpeakDestination] Error details:', error);
          
          if (isMountedRef.current) {
            setFlowState('error');
            const errorMsg = error.message || 'Voice agent error occurred. Please try again.';
            setErrorMessage(errorMsg);
            console.error('[SpeakDestination] ✗ UI updated with error state');
          }
        },
        onDisconnected: () => {
          console.log('[SpeakDestination] Deepgram disconnected');
        },
      });
      
      deepgramServiceRef.current = service;
      
      console.log('[SpeakDestination] Starting audio recording and streaming...');
      await service.startListening();
      console.log('[SpeakDestination] ✓ Audio recording started - speak your destination');
      
    } catch (error) {
      console.error('[SpeakDestination] ========================================');
      console.error('[SpeakDestination] ✗ ERROR STARTING VOICE SESSION');
      console.error('[SpeakDestination] ========================================');
      console.error('[SpeakDestination] Error:', error);
      
      if (isMountedRef.current) {
        setFlowState('error');
        const errorMsg = error instanceof Error ? error.message : 'Failed to start voice session. Please check your configuration.';
        setErrorMessage(errorMsg);
        console.error('[SpeakDestination] ✗ Error displayed to user:', errorMsg);
      }
    }
  }, [requestPermissions]);

  const stopListening = useCallback(async () => {
    console.log('[SpeakDestination] Stopping voice recording');
    
    if (!deepgramServiceRef.current) {
      console.log('[SpeakDestination] No service to stop');
      return;
    }
    
    if (isMountedRef.current) {
      setFlowState('processing');
    }
    
    try {
      await deepgramServiceRef.current.stopListening();
      
      if (!isMountedRef.current) {
        return;
      }
      
      // Wait a bit for final results if needed, but results come via callbacks
      setTimeout(() => {
        if (isMountedRef.current && flowState === 'processing' && !extractedDestination) {
          if (recognizedText && recognizedText.trim() !== '') {
            setFlowState('confirming');
          } else {
             // Don't error out immediately, maybe still waiting for transcript
             // But if too long, then error
             // actually we can rely on the check inside the service or callbacks
          }
        }
      }, 5000);
      
    } catch (error) {
      console.error('[SpeakDestination] Error processing audio:', error);
      if (isMountedRef.current) {
        setFlowState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to process audio');
        setRecognizedText('');
      }
    }
  }, [flowState, extractedDestination, recognizedText]);

  const confirmDestination = useCallback(async () => {
    const destinationToUse = extractedDestination || recognizedText;
    console.log('[SpeakDestination] ========================================');
    console.log('[SpeakDestination] Confirming destination');
    console.log('[SpeakDestination] ========================================');
    console.log('[SpeakDestination] Destination:', destinationToUse);
    
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.disconnect();
      deepgramServiceRef.current = null;
    }
    
    try {
      setFlowState('geocoding');
      console.log('[SpeakDestination] Geocoding destination...');
      const geocodeResults = await geocodeAddress(destinationToUse);
      
      if (geocodeResults.length === 0) {
        console.error('[SpeakDestination] ✗ No geocoding results found');
        throw new Error('Could not find this location. Please try a different address.');
      }
      
      const destination = geocodeResults[0];
      console.log('[SpeakDestination] ✓ Geocoded successfully:', destination.placeName);
      console.log('[SpeakDestination]   Latitude:', destination.latitude);
      console.log('[SpeakDestination]   Longitude:', destination.longitude);

      setFlowState('locating');
      console.log('[SpeakDestination] Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const origin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(origin);
      console.log('[SpeakDestination] ✓ Location obtained:', origin.latitude, origin.longitude);
      
      const address = await reverseGeocode(origin.latitude, origin.longitude);
      setCurrentAddress(address);
      console.log('[SpeakDestination] ✓ Current address:', address);

      setFlowState('routing');
      console.log('[SpeakDestination] Calculating route...');
      const route = await getMultiModalDirections(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude,
        destination.placeName
      );
      
      console.log('[SpeakDestination] ✓ Route calculated successfully!');
      console.log('[SpeakDestination]   Steps:', route.steps.length);
      console.log('[SpeakDestination]   Distance:', route.totalDistance);
      console.log('[SpeakDestination]   Duration:', route.totalDuration);
      setRouteData(route);

      const links = new Map<string, OmioBookingLink>();
      route.steps.forEach(step => {
        if (isPublicTransportStep(step)) {
          const link = generateOmioBookingLink(step);
          if (link) {
            links.set(step.id, link);
          }
        }
      });
      setBookingLinks(links);
      console.log('[SpeakDestination] ✓ Generated', links.size, 'booking links');

      console.log('[SpeakDestination] ========================================');
      console.log('[SpeakDestination] ✓ NAVIGATION READY!');
      console.log('[SpeakDestination] ========================================');
      setFlowState('ready');

      if (mapRef.current && route.polyline.length > 0) {
        const coordinates = route.polyline.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
      
    } catch (error) {
      console.error('[SpeakDestination] ========================================');
      console.error('[SpeakDestination] ✗ ERROR PROCESSING DESTINATION');
      console.error('[SpeakDestination] ========================================');
      console.error('[SpeakDestination] Error:', error);
      
      setFlowState('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to process destination. Please try again.';
      setErrorMessage(errorMsg);
      console.error('[SpeakDestination] ✗ Error displayed to user:', errorMsg);
    }
  }, [recognizedText, extractedDestination]);

  const speakDirections = useCallback(async () => {
    if (!routeData) return;
    
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    setIsSpeaking(true);
    
    const introText = `Your route to ${routeData.destination.address}. Total distance: ${formatDistance(routeData.totalDistance)}. Estimated time: ${formatDuration(routeData.totalDuration)}.`;
    
    const stepsText = routeData.steps.map((step, index) => {
      let modeText = '';
      if (step.mode === 'transit' && step.transitDetails) {
        modeText = `Take ${step.transitDetails.vehicleType} ${step.transitDetails.lineName} from ${step.transitDetails.departureStop} to ${step.transitDetails.arrivalStop}.`;
      } else {
        modeText = step.instruction;
      }
      return `Step ${index + 1}: ${modeText}`;
    }).join(' ');
    
    const fullText = `${introText} ${stepsText}`;
    
    Speech.speak(fullText, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [routeData, isSpeaking]);

  const openBookingLink = useCallback((link: OmioBookingLink) => {
    console.log('[SpeakDestination] Opening booking link:', link.url);
    Linking.openURL(link.url).catch(err => {
      console.error('[SpeakDestination] Failed to open link:', err);
      Alert.alert('Error', 'Could not open booking page');
    });
  }, []);

  const resetFlow = useCallback(() => {
    setFlowState('idle');
    setRecognizedText('');
    setExtractedDestination(null);
    setErrorMessage('');
    setCurrentLocation(null);
    setCurrentAddress('');
    setRouteData(null);
    setBookingLinks(new Map());
    setSelectedStepIndex(null);
    setIsAgentSpeaking(false);
    
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.disconnect();
      deepgramServiceRef.current = null;
    }
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const getModeIcon = (mode: string, vehicleType?: string) => {
    const iconProps = { size: 20, color: Colors.primary, strokeWidth: 2 };
    
    if (mode === 'transit') {
      if (vehicleType === 'train') return <Train {...iconProps} />;
      if (vehicleType === 'bus') return <Bus {...iconProps} />;
      return <Train {...iconProps} />;
    }
    if (mode === 'walking') return <Footprints {...iconProps} />;
    if (mode === 'driving') return <Car {...iconProps} />;
    return <Navigation {...iconProps} />;
  };

  const renderIdleState = () => (
    <View style={styles.centeredContent}>
      <View style={styles.iconContainer}>
        <Navigation color={Colors.primary} size={48} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Speak Your Destination</Text>
      <Text style={styles.subtitle}>
        Tap the microphone and say where you want to go
      </Text>
      <TouchableOpacity
        style={styles.speakButton}
        onPress={startListening}
        activeOpacity={0.8}
        testID="speak-destination-button"
      >
        <Mic color="#FFFFFF" size={32} strokeWidth={2} />
        <Text style={styles.speakButtonText}>Start Speaking</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListeningState = () => (
    <View style={styles.centeredContent}>
      <Animated.View style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.micCircle}>
          <Mic color={Colors.primary} size={48} strokeWidth={2} />
        </View>
      </Animated.View>
      <Text style={styles.listeningText}>Listening...</Text>
      <Text style={styles.listeningHint}>Say your destination clearly</Text>
      {recognizedText ? (
        <Text style={styles.realtimeTranscript}>&quot;{recognizedText}&quot;</Text>
      ) : null}
      {isAgentSpeaking ? (
        <Text style={styles.agentSpeakingText}>Agent is responding...</Text>
      ) : null}
      <TouchableOpacity
        style={styles.stopButton}
        onPress={stopListening}
        activeOpacity={0.8}
      >
        <MicOff color="#FFFFFF" size={24} strokeWidth={2} />
        <Text style={styles.stopButtonText}>Stop Recording</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessingState = () => (
    <View style={styles.centeredContent}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.processingText}>Processing your speech...</Text>
    </View>
  );

  const renderConfirmingState = () => (
    <View style={styles.centeredContent}>
      <View style={styles.recognizedContainer}>
        <Text style={styles.recognizedLabel}>I heard:</Text>
        <Text style={styles.recognizedText}>{recognizedText}</Text>
      </View>
      <View style={styles.confirmActions}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={confirmDestination}
          activeOpacity={0.8}
        >
          <Check color="#FFFFFF" size={24} strokeWidth={2.5} />
          <Text style={styles.confirmButtonText}>Confirm Destination</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={resetFlow}
          activeOpacity={0.8}
        >
          <RotateCcw color={Colors.textSecondary} size={20} />
          <Text style={styles.tryAgainText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoadingState = (message: string) => (
    <View style={styles.centeredContent}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.processingText}>{message}</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centeredContent}>
      <View style={[styles.iconContainer, styles.errorIconContainer]}>
        <MicOff color={Colors.error} size={48} strokeWidth={1.5} />
      </View>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      <TouchableOpacity
        style={styles.speakButton}
        onPress={resetFlow}
        activeOpacity={0.8}
      >
        <RotateCcw color="#FFFFFF" size={24} strokeWidth={2} />
        <Text style={styles.speakButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRouteStep = (step: RouteStep, index: number) => {
    const isTransit = isPublicTransportStep(step);
    const bookingLink = bookingLinks.get(step.id);
    const isSelected = selectedStepIndex === index;

    return (
      <TouchableOpacity
        key={step.id}
        style={[styles.stepCard, isSelected && styles.stepCardSelected]}
        onPress={() => setSelectedStepIndex(isSelected ? null : index)}
        activeOpacity={0.7}
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepIconContainer}>
            {getModeIcon(step.mode, step.transitDetails?.vehicleType)}
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepMode}>
              {step.mode === 'transit' && step.transitDetails
                ? `${step.transitDetails.vehicleType.toUpperCase()} - ${step.transitDetails.lineName}`
                : step.mode.charAt(0).toUpperCase() + step.mode.slice(1)}
            </Text>
            <Text style={styles.stepMeta}>
              {formatDistance(step.distance)} • {formatDuration(step.duration)}
            </Text>
          </View>
          <ChevronRight
            color={Colors.textLight}
            size={20}
            style={{ transform: [{ rotate: isSelected ? '90deg' : '0deg' }] }}
          />
        </View>

        {isSelected && (
          <View style={styles.stepDetails}>
            <Text style={styles.stepInstruction}>{step.instruction}</Text>
            
            {isTransit && step.transitDetails && (
              <View style={styles.transitDetails}>
                <Text style={styles.transitInfo}>
                  From: {step.transitDetails.departureStop}
                </Text>
                <Text style={styles.transitInfo}>
                  To: {step.transitDetails.arrivalStop}
                </Text>
                {step.transitDetails.numStops && (
                  <Text style={styles.transitInfo}>
                    {step.transitDetails.numStops} stops
                  </Text>
                )}
              </View>
            )}

            {isTransit && bookingLink && (
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => openBookingLink(bookingLink)}
                activeOpacity={0.8}
              >
                <ExternalLink color="#FFFFFF" size={18} strokeWidth={2} />
                <Text style={styles.bookButtonText}>
                  Book on {bookingLink.provider}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderReadyState = () => {
    if (!routeData || !currentLocation) return null;

    const polylineCoords = routeData.polyline.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return (
      <View style={styles.routeContainer}>
        <View style={styles.mapContainer}>
          {Platform.OS !== 'web' ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: (currentLocation.latitude + routeData.destination.latitude) / 2,
                longitude: (currentLocation.longitude + routeData.destination.longitude) / 2,
                latitudeDelta: Math.abs(currentLocation.latitude - routeData.destination.latitude) * 1.5 || 0.05,
                longitudeDelta: Math.abs(currentLocation.longitude - routeData.destination.longitude) * 1.5 || 0.05,
              }}
            >
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                pinColor={Colors.primary}
              />
              <Marker
                coordinate={{
                  latitude: routeData.destination.latitude,
                  longitude: routeData.destination.longitude,
                }}
                title={routeData.destination.address}
                pinColor={Colors.error}
              />
              {polylineCoords.length > 0 && (
                <Polyline
                  coordinates={polylineCoords}
                  strokeColor={Colors.primary}
                  strokeWidth={4}
                />
              )}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <MapPin color={Colors.textLight} size={48} strokeWidth={1.5} />
              <Text style={styles.mapPlaceholderText}>
                Map preview available on mobile
              </Text>
            </View>
          )}
        </View>

        <View style={styles.routeSummary}>
          <View style={styles.routeSummaryRow}>
            <View style={styles.summaryItem}>
              <Route color={Colors.primary} size={20} strokeWidth={2} />
              <Text style={styles.summaryValue}>{formatDistance(routeData.totalDistance)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Clock color={Colors.primary} size={20} strokeWidth={2} />
              <Text style={styles.summaryValue}>{formatDuration(routeData.totalDuration)}</Text>
            </View>
            <TouchableOpacity
              style={styles.speakDirectionsButton}
              onPress={speakDirections}
              activeOpacity={0.8}
            >
              {isSpeaking ? (
                <VolumeX color={Colors.primary} size={22} strokeWidth={2} />
              ) : (
                <Volume2 color={Colors.primary} size={22} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
          {currentAddress ? (
            <Text style={styles.fromText} numberOfLines={1}>
              From: {currentAddress}
            </Text>
          ) : null}
          <Text style={styles.destinationText} numberOfLines={2}>
            To: {routeData.destination.address}
          </Text>
        </View>

        <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepsTitle}>Route Steps</Text>
          {routeData.steps.map((step, index) => renderRouteStep(step, index))}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.newSearchButton}
            onPress={resetFlow}
            activeOpacity={0.8}
          >
            <RotateCcw color={Colors.primary} size={20} strokeWidth={2} />
            <Text style={styles.newSearchText}>New Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (flowState) {
      case 'idle':
        return renderIdleState();
      case 'listening':
        return renderListeningState();
      case 'processing':
        return renderProcessingState();
      case 'confirming':
        return renderConfirmingState();
      case 'geocoding':
        return renderLoadingState('Finding location...');
      case 'locating':
        return renderLoadingState('Getting your position...');
      case 'routing':
        return renderLoadingState('Calculating route...');
      case 'ready':
        return renderReadyState();
      case 'error':
        return renderErrorState();
      default:
        return renderIdleState();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color={Colors.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Speak Destination</Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIconContainer: {
    backgroundColor: `${Colors.error}15`,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  speakButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  micContainer: {
    marginBottom: 32,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 4,
    borderColor: `${Colors.primary}30`,
  },
  listeningText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  listeningHint: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  realtimeTranscript: {
    fontSize: 18,
    fontStyle: 'italic',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  agentSpeakingText: {
    fontSize: 14,
    color: Colors.success,
    marginBottom: 24,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 10,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  processingText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 20,
  },
  recognizedContainer: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  recognizedLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  recognizedText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  confirmActions: {
    width: '100%',
    gap: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tryAgainText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  routeContainer: {
    flex: 1,
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mapPlaceholderText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  routeSummary: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 24,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  speakDirectionsButton: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fromText: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stepsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepInfo: {
    flex: 1,
  },
  stepMode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stepMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  stepDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  stepInstruction: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  transitDetails: {
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  transitInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  openMapsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  newSearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
