import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bus, MapPin, Train } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { fetchNearbyStations, Place } from "@/lib/services/PlacesService";
import { LocationService } from "@/lib/services/LocationService";

const getStationIcon = (place: Place) => {
  const iconProps = { size: 24, strokeWidth: 2 };
  const name = place.name.toLowerCase();
  
  if (name.includes('train') || name.includes('railway') || name.includes('metro')) {
    return <Train color={Colors.primary} {...iconProps} />;
  } else if (name.includes('bus')) {
    return <Bus color={Colors.primary} {...iconProps} />;
  } else {
    return <MapPin color={Colors.primary} {...iconProps} />;
  }
};

const getStationType = (place: Place): string => {
  const name = place.name.toLowerCase();
  if (name.includes('train') || name.includes('railway')) return 'Train';
  if (name.includes('metro')) return 'Metro';
  if (name.includes('bus')) return 'Bus';
  return 'Station';
};

const calculateWalkingTime = (distanceMeters: number): number => {
  // Average walking speed: 5 km/h = 1.39 m/s
  const walkingSpeedMps = 1.39;
  const seconds = distanceMeters / walkingSpeedMps;
  return Math.ceil(seconds / 60); // Convert to minutes
};

export default function StationsScreen() {
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
  }>();

  const [stations, setStations] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const latitude = parseFloat(params.latitude || "0");
  const longitude = parseFloat(params.longitude || "0");

  useEffect(() => {
    const loadStations = async () => {
      if (!latitude || !longitude) {
        setError("Invalid location coordinates");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const nearbyStations = await fetchNearbyStations(
          { latitude, longitude },
          2000 // 2km radius
        );
        
        setStations(nearbyStations);
      } catch (err) {
        console.error("[StationsScreen] Error loading stations:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load nearby stations. Please try again.";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [latitude, longitude]);

  const renderStation = ({ item }: { item: Place }) => {
    const walkingTime = calculateWalkingTime(item.distance);
    const stationType = getStationType(item);

    return (
      <TouchableOpacity
        style={styles.stationCard}
        onPress={() =>
          router.push({
            pathname: "/main/home/station-detail" as any,
            params: {
              stationId: item.id,
              name: item.name,
              type: stationType,
              distance: item.distance.toString(),
              walkingTime: walkingTime.toString(),
              latitude: item.coordinates.latitude.toString(),
              longitude: item.coordinates.longitude.toString(),
            },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.stationIconContainer}>
          {getStationIcon(item)}
        </View>

        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{item.name}</Text>
          <View style={styles.stationMeta}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stationType}</Text>
            </View>
            <Text style={styles.stationDistance}>
              {item.distance}m · {walkingTime} min walk
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color={Colors.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Nearest Stations</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading nearby stations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Retry loading
              fetchNearbyStations({ latitude, longitude }, 2000)
                .then(setStations)
                .catch((err) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to load stations"
                  );
                })
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : stations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin color={Colors.textLight} size={48} strokeWidth={1.5} />
          <Text style={styles.emptyText}>
            No stations found nearby. Try a different location.
          </Text>
        </View>
      ) : (
        <FlatList
          data={stations}
          renderItem={renderStation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stationCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 16,
  },
  stationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  stationInfo: {
    flex: 1,
    gap: 8,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  stationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.surface,
  },
  stationDistance: {
    fontSize: 14,
    color: Colors.textSecondary,
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
