import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import Colors from "@/constants/colors";

export default function Index() {
  const { session, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboarding();

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    if (!hasCompletedOnboarding) {
      router.replace("/onboarding");
    } else if (!session) {
      router.replace("/auth");
    } else {
      router.replace("/main/home");
    }
  }, [session, authLoading, hasCompletedOnboarding, onboardingLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
