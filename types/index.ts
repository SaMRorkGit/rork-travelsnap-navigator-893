export type StationType = "Bus" | "Train" | "Metro" | "Taxi";

export interface Station {
  id: string;
  name: string;
  type: StationType;
  distance: number;
  walkingTime: number;
  latitude: number;
  longitude: number;
}

export interface Location {
  street: string;
  houseNumber: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface Destination {
  address: string;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type TransportMode = 'walking' | 'driving' | 'transit' | 'cycling';

export interface RouteStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  mode: TransportMode;
  maneuver?: string;
  transitDetails?: {
    lineName: string;
    lineShortName?: string;
    departureStop: string;
    arrivalStop: string;
    departureTime?: string;
    arrivalTime?: string;
    numStops?: number;
    vehicleType: 'bus' | 'train' | 'metro' | 'tram' | 'ferry' | 'other';
  };
  coordinates: [number, number][];
}

export interface RouteData {
  origin: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  totalDistance: number;
  totalDuration: number;
  steps: RouteStep[];
  polyline: [number, number][];
}

export interface GeocodingResult {
  placeName: string;
  latitude: number;
  longitude: number;
  relevance: number;
}

export interface OmioBookingLink {
  stepId: string;
  url: string;
  provider: string;
  price?: string;
  currency?: string;
}
