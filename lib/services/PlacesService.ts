/**
 * PlacesService
 * 
 * Service for fetching nearby places using Google Places API.
 * Supports stations, restaurants, cafes, hotels, and things to do.
 */

import { LocationCoordinates, LocationService } from './LocationService';

const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'YOUR_GOOGLE_PLACES_API_KEY';

export type PlaceCategory =
  | 'station'
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'tourist_attraction'
  | 'point_of_interest';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  coordinates: LocationCoordinates;
  distance: number; // in meters
  rating?: number;
  priceLevel?: number; // 0-4
  photoUrl?: string;
  address?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: {
    openNow: boolean;
    weekdayText?: string[];
  };
}

export interface NearbyPlacesOptions {
  location: LocationCoordinates;
  radius?: number; // in meters, default 2000
  category?: PlaceCategory;
  maxResults?: number; // default 20
}

/**
 * Map PlaceCategory to Google Places API types
 */
function getGooglePlaceType(category: PlaceCategory): string {
  const typeMap: Record<PlaceCategory, string> = {
    station: 'transit_station',
    restaurant: 'restaurant',
    cafe: 'cafe',
    hotel: 'lodging',
    tourist_attraction: 'tourist_attraction',
    point_of_interest: 'point_of_interest',
  };
  return typeMap[category] || 'point_of_interest';
}

/**
 * Fetch nearby places from Google Places API
 */
export async function fetchNearbyPlaces(
  options: NearbyPlacesOptions
): Promise<Place[]> {
  if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') {
    if (__DEV__) {
      console.warn(
        '[PlacesService] Google Places API Key not configured. Nearby places features will not work.'
      );
    }
    throw new Error(
      'Google Places API Key is not configured. Please set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in your .env file.'
    );
  }

  const { location, radius = 2000, category, maxResults = 20 } = options;

  try {
    // Use Nearby Search API
    const type = category ? getGooglePlaceType(category) : '';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}${type ? `&type=${type}` : ''}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'REQUEST_DENIED') {
      throw new Error('Google Places API access denied. Check your API key and enable Places API.');
    }
    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API quota exceeded.');
    }
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${data.status}`);
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Map Google Places results to our Place interface
    const places: Place[] = data.results
      .slice(0, maxResults)
      .map((result: any) => {
        // Calculate distance
        const placeLocation: LocationCoordinates = {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        };
        const distance = LocationService.calculateDistance(
          location,
          placeLocation
        );

        // Get photo URL if available
        let photoUrl: string | undefined;
        if (result.photos && result.photos.length > 0) {
          const photoRef = result.photos[0].photo_reference;
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
        }

        // Determine category from types
        let category: PlaceCategory = 'point_of_interest';
        if (result.types.includes('transit_station')) category = 'station';
        else if (result.types.includes('restaurant')) category = 'restaurant';
        else if (result.types.includes('cafe')) category = 'cafe';
        else if (result.types.includes('lodging')) category = 'hotel';
        else if (result.types.includes('tourist_attraction')) category = 'tourist_attraction';

        return {
          id: result.place_id,
          name: result.name,
          category,
          coordinates: placeLocation,
          distance: Math.round(distance),
          rating: result.rating,
          priceLevel: result.price_level,
          photoUrl,
          address: result.vicinity || result.formatted_address,
          openingHours: result.opening_hours
            ? {
                openNow: result.opening_hours.open_now || false,
                weekdayText: result.opening_hours.weekday_text,
              }
            : undefined,
        };
      })
      .sort((a: Place, b: Place) => a.distance - b.distance);

    return places;
  } catch (error) {
    console.error('[PlacesService] Error fetching nearby places:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch nearby places');
  }
}

/**
 * Fetch nearby stations (transit stations)
 */
export async function fetchNearbyStations(
  location: LocationCoordinates,
  radius?: number
): Promise<Place[]> {
  return fetchNearbyPlaces({
    location,
    radius: radius || 2000,
    category: 'station',
    maxResults: 20,
  });
}

/**
 * Fetch nearby hotels
 */
export async function fetchNearbyHotels(
  location: LocationCoordinates,
  radius?: number
): Promise<Place[]> {
  return fetchNearbyPlaces({
    location,
    radius: radius || 2000,
    category: 'hotel',
    maxResults: 20,
  });
}

/**
 * Fetch nearby restaurants
 */
export async function fetchNearbyRestaurants(
  location: LocationCoordinates,
  radius?: number
): Promise<Place[]> {
  return fetchNearbyPlaces({
    location,
    radius: radius || 2000,
    category: 'restaurant',
    maxResults: 20,
  });
}

/**
 * Fetch nearby cafes
 */
export async function fetchNearbyCafes(
  location: LocationCoordinates,
  radius?: number
): Promise<Place[]> {
  return fetchNearbyPlaces({
    location,
    radius: radius || 2000,
    category: 'cafe',
    maxResults: 20,
  });
}

/**
 * Fetch nearby things to do (tourist attractions)
 */
export async function fetchNearbyAttractions(
  location: LocationCoordinates,
  radius?: number
): Promise<Place[]> {
  return fetchNearbyPlaces({
    location,
    radius: radius || 2000,
    category: 'tourist_attraction',
    maxResults: 20,
  });
}

