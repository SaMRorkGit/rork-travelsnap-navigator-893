import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ExternalLink, Home, MapPin, Navigation } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { LocationService } from "@/lib/services/LocationService";
import { geocodeAddress, getDirections } from "@/lib/speakDestinationApi";
import { openMapsApp } from "@/lib/services/DeepLinkService";

export default function DestinationScreen() {
  const params = useLocalSearchParams<{
    address: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [routePolyline, setRoutePolyline] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);

  const loadLocationData = useCallback(async () => {
    try {
      // Get current location
      const locationResult = await LocationService.getCurrentLocation();
      setCurrentLocation(locationResult.coordinates);

      // Geocode destination address using Mapbox (with fallback)
      try {
        const geocodeResults = await geocodeAddress(params.address);
        if (geocodeResults.length > 0) {
          const dest = geocodeResults[0];
          setDestinationCoords({
            latitude: dest.latitude,
            longitude: dest.longitude,
          });

          // Get route from Mapbox Directions API (with fallback)
          try {
            const route = await getDirections(
              locationResult.coordinates.latitude,
              locationResult.coordinates.longitude,
              dest.latitude,
              dest.longitude,
              'driving'
            );

            // Convert polyline to coordinates for map display
            const polylineCoords = route.polyline.map(([lat, lng]) => ({
              latitude: lat,
              longitude: lng,
            }));
            setRoutePolyline(polylineCoords);
          } catch (routeError) {
            console.warn("[DestinationScreen] Could not load detailed route:", routeError);
            // Continue without route polyline - user can still open in maps
          }
        } else {
          // Geocoding returned no results
          console.warn("[DestinationScreen] Could not find destination address");
          Alert.alert(
            "Address Not Found",
            "Could not find the destination address. You can still open it in maps to search manually.",
            [{ text: "OK" }]
          );
        }
      } catch (geocodeError) {
        console.warn("[DestinationScreen] Geocoding error:", geocodeError);
        // Show user-friendly message but don't block the UI
        if (__DEV__) {
          console.warn("[DestinationScreen] Geocoding failed, but continuing with current location");
        }
        Alert.alert(
          "Location Service Unavailable",
          "Could not geocode the destination address. You can still open it in maps to search manually.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("[DestinationScreen] Error loading location:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load location";
      
      // Only show alert for critical errors, not for missing API keys
      if (!errorMessage.includes("Mapbox Access Token") && !errorMessage.includes("not configured")) {
        Alert.alert("Error", errorMessage);
      } else {
        // For missing API keys, just log and continue
        console.warn("[DestinationScreen] API configuration issue:", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [params.address]);

  useEffect(() => {
    loadLocationData();
  }, [loadLocationData]);

  const openInMaps = async () => {
    if (!destinationCoords) return;

    try {
      await openMapsApp(destinationCoords, params.address);
    } catch (error) {
      console.error("[DestinationScreen] Error opening maps:", error);
      Alert.alert("Error", "Could not open maps app. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Finding your route...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color={Colors.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Route</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.destinationCard}>
          <View style={styles.cardHeader}>
            <Navigation color={Colors.primary} size={24} strokeWidth={2} />
            <Text style={styles.cardTitle}>Destination</Text>
          </View>
          <Text style={styles.destinationAddress}>{params.address}</Text>
        </View>

        {currentLocation && destinationCoords ? (
          Platform.OS !== "web" ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: (currentLocation.latitude + destinationCoords.latitude) / 2,
                  longitude: (currentLocation.longitude + destinationCoords.longitude) / 2,
                  latitudeDelta: Math.abs(currentLocation.latitude - destinationCoords.latitude) * 2 || 0.02,
                  longitudeDelta: Math.abs(currentLocation.longitude - destinationCoords.longitude) * 2 || 0.02,
                }}
              >
                <Marker
                  coordinate={currentLocation}
                  title="Your Location"
                  pinColor={Colors.primary}
                />
                <Marker
                  coordinate={destinationCoords}
                  title={params.address}
                  pinColor={Colors.error}
                />
                {routePolyline.length > 0 && (
                  <Polyline
                    coordinates={routePolyline}
                    strokeColor={Colors.primary}
                    strokeWidth={4}
                  />
                )}
              </MapView>
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <MapPin color={Colors.textLight} size={48} strokeWidth={1.5} />
              <Text style={styles.mapPlaceholderText}>
                Map preview available on mobile
              </Text>
            </View>
          )
        ) : (
          <View style={styles.mapPlaceholder}>
            <MapPin color={Colors.textLight} size={48} strokeWidth={1.5} />
            <Text style={styles.mapPlaceholderText}>
              Unable to load map
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={openInMaps}
          >
            <ExternalLink color={Colors.surface} size={20} strokeWidth={2} />
            <Text style={styles.buttonTextPrimary}>Open in Maps for Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/main/home")}
          >
            <Home color={Colors.textSecondary} size={20} strokeWidth={2} />
            <Text style={styles.buttonTextSecondary}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  destinationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  destinationAddress: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 300,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  mapPlaceholderText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  actions: {
    gap: 12,
    paddingBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.surface,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
});
