import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "travelsnap_onboarding_completed_v1";

export const [OnboardingProvider, useOnboarding] = createContextHook(
  () => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    useEffect(() => {
      checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (value === "true") {
          setHasCompletedOnboarding(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const completeOnboarding = async () => {
      try {
        await AsyncStorage.setItem(ONBOARDING_KEY, "true");
        setHasCompletedOnboarding(true);
      } catch (error) {
        console.error("Error saving onboarding status:", error);
      }
    };

    const resetOnboarding = async () => {
        try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            setHasCompletedOnboarding(false);
        } catch (error) {
            console.error("Error resetting onboarding status:", error);
        }
    }

    return {
      isLoading,
      hasCompletedOnboarding,
      completeOnboarding,
      resetOnboarding
    };
  },
  {
    isLoading: true,
    hasCompletedOnboarding: false,
    completeOnboarding: async () => {},
    resetOnboarding: async () => {},
  }
);
