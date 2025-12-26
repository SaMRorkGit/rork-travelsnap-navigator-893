/**
 * MapboxService
 * 
 * Service for Mapbox integration.
 * Provides utilities for working with Mapbox maps, styles, and coordinates.
 */

const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';

export interface MapboxStyle {
  url: string;
  name: string;
}

export class MapboxService {
  /**
   * Get Mapbox access token
   */
  static getAccessToken(): string {
    if (MAPBOX_ACCESS_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN') {
      console.warn(
        '[MapboxService] Mapbox Access Token not configured. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.'
      );
    }
    return MAPBOX_ACCESS_TOKEN;
  }

  /**
   * Check if Mapbox is configured
   */
  static isConfigured(): boolean {
    return MAPBOX_ACCESS_TOKEN !== 'YOUR_MAPBOX_ACCESS_TOKEN';
  }

  /**
   * Get default Mapbox style URL
   */
  static getDefaultStyle(): string {
    return 'mapbox://styles/mapbox/streets-v12';
  }

  /**
   * Get Mapbox style URL for custom styles
   */
  static getStyleUrl(styleId: string): string {
    return `mapbox://styles/mapbox/${styleId}`;
  }

  /**
   * Common Mapbox styles
   */
  static readonly STYLES = {
    STREETS: 'mapbox://styles/mapbox/streets-v12',
    OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
    LIGHT: 'mapbox://styles/mapbox/light-v11',
    DARK: 'mapbox://styles/mapbox/dark-v11',
    SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
    SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
    NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
    NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1',
  } as const;

  /**
   * Get Mapbox tile URL for react-native-maps (fallback)
   * This allows using Mapbox tiles with react-native-maps
   */
  static getTileUrlTemplate(styleId: string = 'streets-v12'): string {
    const token = this.getAccessToken();
    return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/{z}/{x}/{y}?access_token=${token}`;
  }

  /**
   * Calculate map region from coordinates
   */
  static calculateRegion(
    coordinates: Array<{ latitude: number; longitude: number }>,
    padding: number = 0.1
  ): {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } {
    if (coordinates.length === 0) {
      throw new Error('Cannot calculate region from empty coordinates');
    }

    const lats = coordinates.map((c) => c.latitude);
    const lngs = coordinates.map((c) => c.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = Math.max(maxLat - minLat, 0.01) * (1 + padding);
    const lngDelta = Math.max(maxLng - minLng, 0.01) * (1 + padding);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }

  /**
   * Convert Mapbox polyline format to coordinates array
   * Mapbox returns [lng, lat], we need [lat, lng]
   */
  static convertPolylineToCoordinates(
    polyline: [number, number][]
  ): Array<{ latitude: number; longitude: number }> {
    return polyline.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));
  }
}

