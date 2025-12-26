import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { ArrowLeft, Camera as CameraIcon } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { LocationService } from "@/lib/services/LocationService";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    setCapturing(true);

    try {
      const locationResult = await LocationService.getCurrentLocation();

      router.push({
        pathname: "/main/home/location" as any,
        params: {
          street: locationResult.address?.street || "Unknown Street",
          houseNumber: locationResult.address?.streetNumber || "N/A",
          city: locationResult.address?.city || "Unknown City",
          latitude: locationResult.coordinates.latitude.toString(),
          longitude: locationResult.coordinates.longitude.toString(),
        },
      });
    } catch (error) {
      console.error("[CameraScreen] Error capturing location:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to get your location. Please try again."
      );
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.permissionContainer}>
          <CameraIcon color={Colors.textSecondary} size={64} strokeWidth={1.5} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            TravelSnap needs camera access to help identify your location
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.permissionContainer}>
          <CameraIcon color={Colors.textSecondary} size={64} strokeWidth={1.5} />
          <Text style={styles.permissionTitle}>Camera on Web</Text>
          <Text style={styles.permissionText}>
            Camera features work best on mobile devices. Using location instead.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleCapture}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.permissionButtonText}>Use My Location</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <SafeAreaView style={styles.cameraContent} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButtonCamera}
              onPress={() => router.back()}
            >
              <ArrowLeft color={Colors.surface} size={28} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.instructionContainer}>
            <View style={styles.instructionBadge}>
              <Text style={styles.instructionText}>
                Point at a street sign or building and tap the button
              </Text>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  cameraContent: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButtonCamera: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  instructionBadge: {
    backgroundColor: Colors.overlay,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  instructionText: {
    color: Colors.surface,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  bottomBar: {
    paddingBottom: 40,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  permissionButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
