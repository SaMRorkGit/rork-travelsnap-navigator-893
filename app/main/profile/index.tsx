import { router } from "expo-router";
import { LogOut, Settings, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const { t } = useSettings();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile', 'title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <Image 
                source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1760&auto=format&fit=crop" }}
                style={styles.avatar}
             />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.full_name || "User"}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        <View style={[styles.menuContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push("/account")}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
              <User color={colors.primary} size={20} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile', 'account')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push("/settings")}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
              <Settings color={colors.primary} size={20} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile', 'settings')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem, { backgroundColor: colors.card }]}
            onPress={handleSignOut}
          >
            <View style={[styles.menuIcon, styles.logoutIcon]}>
              <LogOut color={colors.error} size={20} />
            </View>
            <Text style={[styles.menuText, styles.logoutText, { color: colors.error }]}>{t('account', 'logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatar: {
      width: '100%',
      height: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  menuContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 0,
  },
  logoutIcon: {
    backgroundColor: "#FFEBEE",
  },
  logoutText: {
    color: "#EF4444",
  },
});
