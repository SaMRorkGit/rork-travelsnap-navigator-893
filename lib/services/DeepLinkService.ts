/**
 * DeepLinkService
 * 
 * Service for generating and opening external deep links to:
 * - Navigation apps (Google Maps, Apple Maps, Uber, Lyft)
 * - Food delivery apps (UberEats, DoorDash, etc.)
 * - Other external services
 */

import { Platform, Linking } from 'react-native';
import { LocationCoordinates } from './LocationService';

export interface NavigationApp {
  name: string;
  url: string;
  fallbackUrl?: string; // Web fallback if app not installed
}

/**
 * Generate Google Maps deep link
 */
export function getGoogleMapsLink(
  destination: LocationCoordinates,
  label?: string
): NavigationApp {
  const encodedLabel = label ? encodeURIComponent(label) : '';
  const coords = `${destination.latitude},${destination.longitude}`;

  return {
    name: 'Google Maps',
    url:
      Platform.OS === 'ios'
        ? `comgooglemaps://?q=${coords}${encodedLabel ? `&q=${encodedLabel}` : ''}`
        : Platform.OS === 'android'
        ? `geo:${coords}${encodedLabel ? `?q=${coords}(${encodedLabel})` : ''}`
        : `https://www.google.com/maps/search/?api=1&query=${coords}${encodedLabel ? `&query_place_id=${encodedLabel}` : ''}`,
    fallbackUrl: `https://www.google.com/maps/search/?api=1&query=${coords}`,
  };
}

/**
 * Generate Apple Maps deep link
 */
export function getAppleMapsLink(
  destination: LocationCoordinates,
  label?: string
): NavigationApp {
  const encodedLabel = label ? encodeURIComponent(label) : '';
  const coords = `${destination.latitude},${destination.longitude}`;

  return {
    name: 'Apple Maps',
    url: `maps:0,0?q=${encodedLabel || coords}@${coords}`,
    fallbackUrl: `https://maps.apple.com/?q=${coords}`,
  };
}

/**
 * Generate Uber deep link
 */
export function getUberLink(
  destination: LocationCoordinates,
  pickup?: LocationCoordinates,
  label?: string
): NavigationApp {
  const destCoords = `${destination.latitude},${destination.longitude}`;
  const pickupCoords = pickup
    ? `&pickup_latitude=${pickup.latitude}&pickup_longitude=${pickup.longitude}`
    : '';

  return {
    name: 'Uber',
    url: `uber://?action=setPickup&dropoff[latitude]=${destination.latitude}&dropoff[longitude]=${destination.longitude}${pickupCoords}${label ? `&dropoff[nickname]=${encodeURIComponent(label)}` : ''}`,
    fallbackUrl: `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${destination.latitude}&dropoff[longitude]=${destination.longitude}${pickupCoords}`,
  };
}

/**
 * Generate Lyft deep link
 */
export function getLyftLink(
  destination: LocationCoordinates,
  pickup?: LocationCoordinates
): NavigationApp {
  const destCoords = `${destination.latitude},${destination.longitude}`;
  const pickupCoords = pickup
    ? `&pickup[latitude]=${pickup.latitude}&pickup[longitude]=${pickup.longitude}`
    : '';

  return {
    name: 'Lyft',
    url: `lyft://ridetype?id=lyft&destination[latitude]=${destination.latitude}&destination[longitude]=${destination.longitude}${pickupCoords}`,
    fallbackUrl: `https://www.lyft.com/rider?destination[latitude]=${destination.latitude}&destination[longitude]=${destination.longitude}${pickupCoords}`,
  };
}

/**
 * Generate UberEats deep link
 */
export function getUberEatsLink(
  location: LocationCoordinates,
  restaurantName?: string
): NavigationApp {
  return {
    name: 'UberEats',
    url: `ubereats://?action=setDeliveryLocation&latitude=${location.latitude}&longitude=${location.longitude}`,
    fallbackUrl: `https://www.ubereats.com/?lat=${location.latitude}&lng=${location.longitude}`,
  };
}

/**
 * Generate DoorDash deep link
 */
export function getDoorDashLink(location: LocationCoordinates): NavigationApp {
  return {
    name: 'DoorDash',
    url: `doordash://?action=setDeliveryLocation&latitude=${location.latitude}&longitude=${location.longitude}`,
    fallbackUrl: `https://www.doordash.com/?lat=${location.latitude}&lng=${location.longitude}`,
  };
}

/**
 * Generate general food delivery link (opens best available)
 */
export function getFoodDeliveryLink(
  location: LocationCoordinates
): NavigationApp[] {
  return [getUberEatsLink(location), getDoorDashLink(location)];
}

/**
 * Open a navigation app with fallback
 */
export async function openNavigationApp(
  app: NavigationApp
): Promise<boolean> {
  try {
    // Try to open the app
    const canOpen = await Linking.canOpenURL(app.url);
    if (canOpen) {
      await Linking.openURL(app.url);
      return true;
    }

    // Fallback to web URL if app not installed
    if (app.fallbackUrl) {
      await Linking.openURL(app.fallbackUrl);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[DeepLinkService] Error opening navigation app:', error);
    return false;
  }
}

/**
 * Open Google Maps or Apple Maps (platform-specific)
 */
export async function openMapsApp(
  destination: LocationCoordinates,
  label?: string
): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // Try Apple Maps first on iOS
    const appleMaps = getAppleMapsLink(destination, label);
    const opened = await openNavigationApp(appleMaps);
    if (opened) return true;

    // Fallback to Google Maps
    const googleMaps = getGoogleMapsLink(destination, label);
    return openNavigationApp(googleMaps);
  } else {
    // Android: Use Google Maps
    const googleMaps = getGoogleMapsLink(destination, label);
    return openNavigationApp(googleMaps);
  }
}

/**
 * Open ride-sharing app (Uber with Lyft fallback)
 */
export async function openRideApp(
  destination: LocationCoordinates,
  pickup?: LocationCoordinates,
  label?: string
): Promise<boolean> {
  // Try Uber first
  const uber = getUberLink(destination, pickup, label);
  const opened = await openNavigationApp(uber);
  if (opened) return true;

  // Fallback to Lyft
  const lyft = getLyftLink(destination, pickup);
  return openNavigationApp(lyft);
}

/**
 * Open food delivery app (UberEats with DoorDash fallback)
 */
export async function openFoodDeliveryApp(
  location: LocationCoordinates
): Promise<boolean> {
  const uberEats = getUberEatsLink(location);
  const opened = await openNavigationApp(uberEats);
  if (opened) return true;

  const doorDash = getDoorDashLink(location);
  return openNavigationApp(doorDash);
}

