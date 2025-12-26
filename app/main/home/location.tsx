import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Car, Coffee, Hotel, MapPin, Smartphone, Utensils, Zap, Bus } from "lucide-react-native";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { openMapsApp, openRideApp, openFoodDeliveryApp } from "@/lib/services/DeepLinkService";
import { MapboxService } from "@/lib/services/MapboxService";

export default function LocationScreen() {
  const { t } = useSettings();
  const params = useLocalSearchParams<{
    street: string;
    houseNumber: string;
    city: string;
    latitude: string;
    longitude: string;
  }>();

  const latitude = parseFloat(params.latitude || "0");
  const longitude = parseFloat(params.longitude || "0");

  const location = { latitude, longitude };

  const handleGetRide = async () => {
    await openRideApp(location);
  };

  const handleFoodDelivery = async () => {
    await openFoodDeliveryApp(location);
  };

  const handleRestaurants = async () => {
    // Open OpenTable or similar with location
    const url = `https://www.opentable.com/s?covers=2&dateTime=${new Date().toISOString().split('T')[0]}&latitude=${latitude}&longitude=${longitude}`;
    Linking.openURL(url).catch(() => {
      // Fallback to general search
      Linking.openURL(`https://www.opentable.com`);
    });
  };

  const handleThingsToDo = async () => {
    // Open GetYourGuide or similar with location
    const url = `https://www.getyourguide.com/s/?q=${encodeURIComponent(`${latitude},${longitude}`)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.getyourguide.com`);
    });
  };

  const handleMobileInternet = async () => {
    // Open Airalo or similar
    Linking.openURL("https://www.airalo.com").catch(console.error);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/main/home")}
        >
          <ArrowLeft color={Colors.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{t('location', 'title')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin color={Colors.primary} size={24} strokeWidth={2} />
            <Text style={styles.cardTitle}>{t('location', 'currentLocation')}</Text>
          </View>
          
          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>{t('location', 'street')}:</Text>
              <Text style={styles.addressValue}>{params.street}</Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>{t('location', 'number')}:</Text>
              <Text style={styles.addressValue}>{params.houseNumber}</Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>{t('location', 'city')}:</Text>
              <Text style={styles.addressValue}>{params.city}</Text>
            </View>
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
              customMapStyle={MapboxService.isConfigured() ? undefined : undefined}
            >
              <Marker coordinate={{ latitude, longitude }} title="Your Location" />
            </MapView>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MapPin color={Colors.textLight} size={48} strokeWidth={1.5} />
            <Text style={styles.mapPlaceholderText}>
              {t('location', 'mapPreview')}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/main/home/stations" as any,
                params: {
                  latitude: params.latitude,
                  longitude: params.longitude,
                },
              })
            }
          >
            <Bus color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>{t('location', 'showStations')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.affiliateButton}
            onPress={() =>
              router.push({
                pathname: "/main/home/nearby-hotels" as any,
                params: {
                  latitude: params.latitude,
                  longitude: params.longitude,
                },
              })
            }
          >
            <Hotel color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.affiliateButtonText}>{t('location', 'nearbyHotels')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.affiliateButton}
            onPress={handleGetRide}
          >
            <Car color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.affiliateButtonText}>{t('location', 'getRide')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.affiliateButton}
            onPress={handleFoodDelivery}
          >
            <Utensils color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.affiliateButtonText}>{t('location', 'foodDelivery')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.affiliateButton}
            onPress={handleRestaurants}
          >
            <Coffee color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.affiliateButtonText}>{t('location', 'restaurants')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.affiliateButton}
            onPress={handleThingsToDo}
          >
            <Zap color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.affiliateButtonText}>{t('location', 'thingsToDo')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.affiliateButton}
            onPress={handleMobileInternet}
          >
            <Smartphone color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.affiliateButtonText}>{t('location', 'mobileInternet')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
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
  headerTitleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
  },
  addressContainer: {
    gap: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    width: 80,
  },
  addressValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
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
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  affiliateButton: {
    backgroundColor: "#43A047",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  affiliateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
