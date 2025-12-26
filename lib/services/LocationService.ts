/**
 * LocationService
 * 
 * Centralized service for handling device location operations.
 * Wraps expo-location with proper error handling and permission management.
 */

import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  street?: string;
  streetNumber?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface LocationResult {
  coordinates: LocationCoordinates;
  address?: LocationAddress;
  accuracy?: number;
  timestamp: number;
}

export class LocationService {
  /**
   * Request location permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[LocationService] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  static async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[LocationService] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Get current device location
   */
  static async getCurrentLocation(options?: {
    accuracy?: Location.Accuracy;
    timeout?: number;
  }): Promise<LocationResult> {
    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: options?.accuracy || Location.Accuracy.Balanced,
        ...options,
      });

      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Try to get address via reverse geocoding
      let address: LocationAddress | undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });

        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = {
            street: addr.street || undefined,
            streetNumber: addr.streetNumber || undefined,
            city: addr.city || undefined,
            country: addr.country || undefined,
            postalCode: addr.postalCode || undefined,
            formattedAddress: [
              addr.streetNumber,
              addr.street,
              addr.city,
              addr.country,
            ]
              .filter(Boolean)
              .join(', '),
          };
        }
      } catch (geocodeError) {
        console.warn('[LocationService] Reverse geocoding failed:', geocodeError);
        // Continue without address
      }

      return {
        coordinates,
        address,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('[LocationService] Error getting location:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get current location');
    }
  }

  /**
   * Watch location updates
   */
  static async watchPosition(
    callback: (location: LocationResult) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<Location.LocationSubscription> {
    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    return Location.watchPositionAsync(
      {
        accuracy: options?.accuracy || Location.Accuracy.Balanced,
        timeInterval: options?.timeInterval || 1000,
        distanceInterval: options?.distanceInterval || 1,
      },
      async (location) => {
        const coordinates: LocationCoordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        callback({
          coordinates,
          accuracy: location.coords.accuracy || undefined,
          timestamp: location.timestamp,
        });
      }
    );
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  static calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

