import { Stack } from "expo-router";
import React from "react";

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="destination" />
      <Stack.Screen name="location" />
      <Stack.Screen name="stations" />
      <Stack.Screen name="station-detail" />
      <Stack.Screen name="nearby-hotels" />
      <Stack.Screen name="speak-destination" />
    </Stack>
  );
}
