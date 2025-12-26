import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { fetchNearbyHotels, Place } from "@/lib/services/PlacesService";
import { LocationService } from "@/lib/services/LocationService";

export default function NearbyHotelsScreen() {
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
  }>();

  const [hotels, setHotels] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        setError(null);

        let location: { latitude: number; longitude: number };

        // Try to get location from params first
        if (params.latitude && params.longitude) {
          location = {
            latitude: parseFloat(params.latitude),
            longitude: parseFloat(params.longitude),
          };
        } else {
          // Get current location
          const locationResult = await LocationService.getCurrentLocation();
          location = locationResult.coordinates;
        }

        setCurrentLocation(location);

        const nearbyHotels = await fetchNearbyHotels(location, 2000);
        setHotels(nearbyHotels);
      } catch (err) {
        console.error("[NearbyHotelsScreen] Error loading hotels:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load nearby hotels. Please try again.";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadHotels();
  }, [params.latitude, params.longitude]);

  const handleBookNow = (hotel: Place) => {
    // Open Booking.com with hotel search
    const searchQuery = encodeURIComponent(hotel.name);
    const url = `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
    Linking.openURL(url).catch((err) => {
      console.error("[NearbyHotelsScreen] Error opening booking link:", err);
      Alert.alert("Error", "Could not open booking page");
    });
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatPriceLevel = (level?: number): string => {
    if (!level) return "Price not available";
    return "$".repeat(level);
  };

  const renderHotel = ({ item }: { item: Place }) => (
    <View style={styles.hotelCard}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.hotelImage} />
      ) : (
        <View style={[styles.hotelImage, styles.hotelImagePlaceholder]}>
          <MapPin color={Colors.textLight} size={32} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.hotelInfo}>
        <View style={styles.hotelHeader}>
          <Text style={styles.hotelName}>{item.name}</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.distanceContainer}>
            <MapPin color={Colors.textSecondary} size={14} />
            <Text style={styles.distanceText}>
              {formatDistance(item.distance)}
            </Text>
          </View>
          {item.priceLevel !== undefined && (
            <Text style={styles.priceText}>
              {formatPriceLevel(item.priceLevel)}
            </Text>
          )}
        </View>

        {item.address && (
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address}
          </Text>
        )}

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => handleBookNow(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Book now (Booking.com)</Text>
          <ExternalLink color="white" size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color={Colors.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Hotels</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading nearby hotels...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              const location = currentLocation || {
                latitude: parseFloat(params.latitude || "0"),
                longitude: parseFloat(params.longitude || "0"),
              };
              fetchNearbyHotels(location, 2000)
                .then(setHotels)
                .catch((err) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to load hotels"
                  );
                })
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : hotels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin color={Colors.textLight} size={48} strokeWidth={1.5} />
          <Text style={styles.emptyText}>
            No hotels found nearby. Try a different location.
          </Text>
        </View>
      ) : (
        <FlatList
          data={hotels}
          renderItem={renderHotel}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back to Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  listContent: {
    padding: 24,
    gap: 20,
  },
  hotelCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  hotelImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#e0e0e0",
  },
  hotelImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  hotelInfo: {
    padding: 16,
  },
  hotelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FBC02D",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: "#003580", // Booking.com blue-ish
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bookButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
    gap: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
