import { Tabs } from "expo-router";
import { House, User } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { Platform } from "react-native";
import { useSettings } from "@/context/SettingsContext";

export default function MainLayout() {
  const { t } = useSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: Platform.OS === "android" ? 60 : 80,
          paddingBottom: Platform.OS === "android" ? 10 : 30,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('navigation', 'home'),
          tabBarIcon: ({ color, size }) => (
            <House color={color} size={size} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation', 'profile'),
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}
