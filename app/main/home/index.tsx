import { router, Href } from "expo-router";
import { Camera, MapPin, Mic } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <View style={styles.content}>
              
              <View style={styles.header}>
                <View style={styles.badgeContainer}>
                  <MapPin size={14} color="#FFF" />
                  <Text style={styles.badgeText}>{t('home', 'navigateBadge')}</Text>
                </View>
                <Text style={styles.title}>
                  {t('home', 'title')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('home', 'subtitle')}
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.largeButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/camera" as Href)}
                  activeOpacity={0.9}
                >
                  <View style={styles.iconCircle}>
                    <Camera color={colors.primary} size={32} strokeWidth={2.5} />
                  </View>
                  <View style={styles.buttonTexts}>
                    <Text style={styles.largeButtonText}>{t('home', 'takePicture')}</Text>
                    <Text style={styles.largeButtonSubtext}>{t('home', 'identifyLandmarks')}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.largeButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/voice-input" as Href)}
                  activeOpacity={0.9}
                >
                  <View style={styles.iconCircle}>
                    <Mic color={colors.primary} size={32} strokeWidth={2.5} />
                  </View>
                  <View style={styles.buttonTexts}>
                    <Text style={styles.largeButtonText}>{t('home', 'speakDestination')}</Text>
                    <Text style={styles.largeButtonSubtext}>{t('home', 'sayDestination')}</Text>
                  </View>
                </TouchableOpacity>
              </View>

            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
    gap: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 26,
    fontWeight: "500",
    maxWidth: '90%',
  },
  actions: {
    gap: 16,
    marginBottom: 20,
  },
  largeButton: {
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTexts: {
    flex: 1,
    gap: 4,
  },
  largeButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  largeButtonSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
});
