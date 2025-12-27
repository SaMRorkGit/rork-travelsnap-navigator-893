import { Audio } from 'expo-av';
import { GeocodingResult, RouteData, RouteStep, OmioBookingLink } from '@/types';
import { transcribeWithRorkToolkitFallback } from './services/DeepgramVoiceAgentService';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';
const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY || '';

if (__DEV__) {
  const hasMapboxToken = MAPBOX_ACCESS_TOKEN !== 'YOUR_MAPBOX_ACCESS_TOKEN';
  const hasDeepgramKey = !!DEEPGRAM_API_KEY;
  
  if (!hasDeepgramKey) {
    console.warn('[SpeakDestinationAPI] Deepgram API Key not configured. Voice features will use Rork Toolkit fallback.');
  }
  if (!hasMapboxToken) {
    console.warn('[SpeakDestinationAPI] Mapbox Access Token not configured. Geocoding and routing features may not work.');
  }
}

const OMIO_AFFILIATE_ID = 'YOUR_OMIO_AFFILIATE_ID';
const OMIO_BASE_URL = 'https://www.omio.com';

// =============================================================================
// DEEPGRAM VOICE AGENT API
// =============================================================================

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export {
  DeepgramVoiceAgentService,
  DeepgramVoiceAgentCallbacks,
  createVoiceAgentSession,
  startVoiceRecording,
  stopVoiceRecording,
} from './services/DeepgramVoiceAgentService';

export async function transcribeAudio(audioUri: string): Promise<SpeechRecognitionResult> {
  console.log('[SpeakDestinationAPI] Transcribing audio using Rork Toolkit fallback');
  
  try {
    const transcript = await transcribeWithRorkToolkitFallback(audioUri);
    return {
      transcript,
      confidence: 0.9,
      isFinal: true,
    };
  } catch (error) {
    console.error('[SpeakDestinationAPI] Transcription error:', error);
    throw error;
  }
}

export async function transcribeAudioWithRorkToolkit(recording: Audio.Recording): Promise<string> {
  console.log('[SpeakDestinationAPI] Using Rork Toolkit for transcription');
  
  const uri = recording.getURI();
  if (!uri) {
    throw new Error('No recording URI available');
  }

  return transcribeWithRorkToolkitFallback(uri);
}

// =============================================================================
// MAPBOX GEOCODING API
// =============================================================================

export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
  console.group('[SpeakDestinationAPI] Geocoding');
  console.log(`[${new Date().toISOString()}] Requesting geocode for: "${address}"`);
  
  if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN') {
    console.error('✗ Mapbox Access Token is missing or default.');
    console.groupEnd();
    throw new Error('Mapbox configuration is missing. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.');
  }
  
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5&types=address,place,poi`;

  console.log(`[${new Date().toISOString()}] API URL: ${url.replace(MAPBOX_ACCESS_TOKEN, '***')}`);

  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] Response Status: ${response.status} (${duration}ms)`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('✗ Mapbox API error:', errorText);
      console.groupEnd();
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Results found: ${data.features?.length || 0}`);
    
    if (data.features?.length > 0) {
      console.log('Top result:', data.features[0].place_name);
    }

    if (!data.features || data.features.length === 0) {
      console.warn('! No results found for this address');
      console.groupEnd();
      return [];
    }

    const results = data.features.map((feature: any) => ({
      placeName: feature.place_name,
      longitude: feature.center[0],
      latitude: feature.center[1],
      relevance: feature.relevance,
    }));
    
    console.groupEnd();
    return results;
  } catch (error) {
    console.error('✗ Geocoding exception:', error);
    console.groupEnd();
    throw error;
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  console.log('[SpeakDestinationAPI] Reverse geocoding:', latitude, longitude);
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('[SpeakDestinationAPI] Reverse geocoding error:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

// =============================================================================
// MAPBOX DIRECTIONS API
// =============================================================================

export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<RouteData> {
  console.group('[SpeakDestinationAPI] Directions');
  console.log(`[${new Date().toISOString()}] Requesting ${profile} directions`);
  console.log(`From: ${originLat},${originLng}`);
  console.log(`To: ${destLat},${destLng}`);
  
  if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN') {
    console.error('✗ Mapbox Access Token is missing or default.');
    console.groupEnd();
    throw new Error('Mapbox configuration is missing. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.');
  }
  
  const coordinates = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&steps=true&overview=full&annotations=duration,distance`;
  
  console.log(`[${new Date().toISOString()}] API URL: ${url.replace(MAPBOX_ACCESS_TOKEN, '***')}`);

  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] Response Status: ${response.status} (${duration}ms)`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn('! Mapbox Directions error:', errorText);

      let errorMessage = `Directions API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          if (errorData.message.includes('exceeds maximum distance')) {
            errorMessage = 'Destination is too far away. Please select a closer location.';
          } else if (errorData.code === 'NoRoute') {
            errorMessage = 'No route found between these locations.';
          } else if (errorData.code === 'InvalidInput') {
             errorMessage = errorData.message;
          } else {
            errorMessage = errorData.message;
          }
        }
      } catch {
        // use default error message
      }
      console.groupEnd();
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Routes found: ${data.routes?.length || 0}`);

    if (!data.routes || data.routes.length === 0) {
      console.groupEnd();
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    const legs = route.legs[0];
    
    console.log(`[${new Date().toISOString()}] Primary Route: ${formatDistance(route.distance)}, ${formatDuration(route.duration)}`);

    // Parse steps from Mapbox response
    const steps: RouteStep[] = legs.steps.map((step: any, index: number) => ({
      id: `step-${index}`,
      instruction: step.maneuver.instruction || formatManeuver(step.maneuver),
      distance: step.distance,
      duration: step.duration,
      mode: profile === 'walking' ? 'walking' : profile === 'cycling' ? 'cycling' : 'driving',
      maneuver: step.maneuver.type,
      coordinates: step.geometry?.coordinates || [],
    }));

    // Extract polyline coordinates
    const polyline: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] // Convert [lng, lat] to [lat, lng]
    );

    const routeData: RouteData = {
      origin: {
        latitude: originLat,
        longitude: originLng,
      },
      destination: {
        latitude: destLat,
        longitude: destLng,
        address: '', // Will be filled by caller
      },
      totalDistance: route.distance,
      totalDuration: route.duration,
      steps,
      polyline,
    };

    console.groupEnd();
    return routeData;
  } catch (error) {
    console.error('✗ Directions exception:', error);
    console.groupEnd();
    throw error;
  }
}

// Get multi-modal directions using real Mapbox Directions API
// Returns real driving directions from Mapbox API
export async function getMultiModalDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  destinationAddress: string
): Promise<RouteData> {
  console.log('[SpeakDestinationAPI] Getting directions from real Mapbox API');
  
  // Get real directions from Mapbox API
  const route = await getDirections(originLat, originLng, destLat, destLng, 'driving');
  route.destination.address = destinationAddress;
  
  // Return real route data from Mapbox API (no mock transit simulation)
  return route;
}

// =============================================================================
// TRANSIT DETECTION & OMIO INTEGRATION
// =============================================================================

// Detect if a step requires public transport
export function isPublicTransportStep(step: RouteStep): boolean {
  return step.mode === 'transit' && step.transitDetails !== undefined;
}

// =============================================================================
// OMIO BOOKING INTEGRATION (PLACEHOLDER)
// =============================================================================

export function generateOmioBookingLink(step: RouteStep): OmioBookingLink | null {
  if (!isPublicTransportStep(step) || !step.transitDetails) {
    return null;
  }

  console.log('[SpeakDestinationAPI] Generating Omio booking link for step:', step.id);
  
  // PLACEHOLDER: In production, you would:
  // 1. Call Omio Search API to find available journeys
  // 2. Get actual prices and booking URLs
  // 3. Include your affiliate ID for commission tracking
  
  const { departureStop, arrivalStop, vehicleType } = step.transitDetails;
  
  // Generate placeholder booking URL
  // Format: https://www.omio.com/search?from=X&to=Y&date=Z&affiliate=YOUR_ID
  const bookingParams = new URLSearchParams({
    from: encodeURIComponent(departureStop),
    to: encodeURIComponent(arrivalStop),
    mode: vehicleType,
    affiliate: OMIO_AFFILIATE_ID,
  });

  const bookingUrl = `${OMIO_BASE_URL}/search?${bookingParams.toString()}`;

  return {
    stepId: step.id,
    url: bookingUrl,
    provider: 'Omio',
    // Price would come from Omio API response
    price: undefined,
    currency: 'EUR',
  };
}

// Batch generate booking links for all transit steps
export function generateAllBookingLinks(steps: RouteStep[]): Map<string, OmioBookingLink> {
  const bookingLinks = new Map<string, OmioBookingLink>();
  
  steps.forEach(step => {
    const link = generateOmioBookingLink(step);
    if (link) {
      bookingLinks.set(step.id, link);
    }
  });
  
  console.log('[SpeakDestinationAPI] Generated', bookingLinks.size, 'booking links');
  return bookingLinks;
}

// PLACEHOLDER: Omio API integration
// When you have Omio API access, implement these functions:

export async function searchOmioJourneys(
  _origin: string,
  _destination: string,
  _date: Date,
  _passengers: number = 1
): Promise<any[]> {
  console.log('[SpeakDestinationAPI] PLACEHOLDER: Omio journey search');
  
  // TODO: Implement when Omio API keys are available
  // const response = await fetch(`${OMIO_API_URL}/journeys/search`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${OMIO_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ origin, destination, date, passengers }),
  // });
  
  return [];
}

export async function getOmioDeepLink(
  _journeyId: string
): Promise<string> {
  console.log('[SpeakDestinationAPI] PLACEHOLDER: Omio deep link generation');
  
  // TODO: Implement when Omio API keys are available
  // Returns affiliate tracking link to specific journey booking page
  
  return `${OMIO_BASE_URL}?affiliate=${OMIO_AFFILIATE_ID}`;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatManeuver(maneuver: any): string {
  const type = maneuver.type || 'continue';
  const modifier = maneuver.modifier || '';
  
  const maneuverMap: Record<string, string> = {
    'turn': `Turn ${modifier}`,
    'depart': 'Start your journey',
    'arrive': 'You have arrived',
    'merge': `Merge ${modifier}`,
    'fork': `Take the ${modifier} fork`,
    'roundabout': `Take the roundabout`,
    'continue': 'Continue straight',
    'new name': 'Continue onto new road',
    'end of road': `At end of road, turn ${modifier}`,
  };
  
  return maneuverMap[type] || `${type} ${modifier}`.trim();
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

export function getModeIcon(mode: string): string {
  const icons: Record<string, string> = {
    walking: 'walk',
    driving: 'car',
    transit: 'train',
    cycling: 'bike',
    bus: 'bus',
    train: 'train',
    metro: 'train',
    tram: 'tram',
    ferry: 'ship',
  };
  return icons[mode] || 'navigation';
}

// =============================================================================
// AUDIO RECORDING HELPERS
// =============================================================================

export async function startAudioRecording(): Promise<Audio.Recording> {
  console.log('[SpeakDestinationAPI] Starting audio recording');
  
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

  await recording.startAsync();
  console.log('[SpeakDestinationAPI] Recording started');
  
  return recording;
}

export async function stopAudioRecording(recording: Audio.Recording): Promise<string> {
  console.log('[SpeakDestinationAPI] Stopping audio recording');
  
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
  });
  
  const uri = recording.getURI();
  console.log('[SpeakDestinationAPI] Recording saved to:', uri);
  
  return uri || '';
}
