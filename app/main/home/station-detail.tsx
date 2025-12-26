import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bus, Compass, MapPin, Train } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { StationType } from "@/types";
import { openMapsApp } from "@/lib/services/DeepLinkService";

const getStationIcon = (type: StationType) => {
  const iconProps = { size: 32, strokeWidth: 2 };
  switch (type) {
    case "Train":
      return <Train color={Colors.primary} {...iconProps} />;
    case "Bus":
      return <Bus color={Colors.primary} {...iconProps} />;
    case "Metro":
      return <Train color={Colors.primary} {...iconProps} />;
    case "Taxi":
      return <MapPin color={Colors.primary} {...iconProps} />;
  }
};

export default function StationDetailScreen() {
  const params = useLocalSearchParams<{
    stationId: string;
    name: string;
    type: StationType;
    distance: string;
    walkingTime: string;
    latitude: string;
    longitude: string;
  }>();

  const latitude = parseFloat(params.latitude || "0");
  const longitude = parseFloat(params.longitude || "0");

  const openInMaps = async () => {
    try {
      await openMapsApp(
        { latitude, longitude },
        params.name
      );
    } catch (error) {
      console.error("[StationDetailScreen] Error opening maps:", error);
      Alert.alert("Error", "Could not open maps app. Please try again.");
    }
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
        <Text style={styles.headerTitle}>Station Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.stationHeader}>
          <View style={styles.iconContainer}>
            {getStationIcon(params.type)}
          </View>
          <Text style={styles.stationName}>{params.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{params.type}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{params.distance}m</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Walking Time</Text>
            <Text style={styles.infoValue}>{params.walkingTime} minutes</Text>
          </View>
        </View>

        {Platform.OS !== "web" ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                title={params.name}
              />
            </MapView>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MapPin color={Colors.textLight} size={48} strokeWidth={1.5} />
            <Text style={styles.mapPlaceholderText}>
              Map preview available on mobile
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openInMaps}
          >
            <Compass color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>Open in Maps for Directions</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stationHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stationName: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.surface,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 200,
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
  primaryButton: {
    backgroundColor: "#1E88E5",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
