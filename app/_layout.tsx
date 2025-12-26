// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Handle update errors gracefully
if (Platform.OS !== 'web') {
  try {
    // Catch unhandled promise rejections
    const originalUnhandledRejection = global.onunhandledrejection;
    global.onunhandledrejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error?.message?.includes('Failed to download remote update') ||
          error?.message?.includes('java.io.IOException') ||
          error?.message?.includes('remote update')) {
        console.warn('[App] Update download failed (non-fatal), continuing with cached version');
        event.preventDefault?.();
        return;
      }
      if (originalUnhandledRejection) {
        (originalUnhandledRejection as (event: PromiseRejectionEvent) => void)(event);
      }
    };

    // Catch global errors
    const ErrorUtils = (global as any).ErrorUtils;
    if (ErrorUtils) {
      const originalHandler = ErrorUtils.getGlobalHandler?.();
      if (originalHandler) {
        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          if (error?.message?.includes('Failed to download remote update') ||
              error?.message?.includes('java.io.IOException') ||
              error?.message?.includes('remote update')) {
            console.warn('[App] Update download failed (non-fatal), continuing with cached version');
            return;
          }
          originalHandler(error, isFatal);
        });
      }
    }
  } catch (e) {
    // Silently fail if error handling setup fails
    console.warn('[App] Could not set up update error handler:', e);
  }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="main" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="voice-input" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="account" />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <ThemeProvider>
            <AuthProvider>
              <OnboardingProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </OnboardingProvider>
            </AuthProvider>
          </ThemeProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
