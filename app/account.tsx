import { router } from "expo-router";
import { ArrowLeft, LogOut, Mail, Trash2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const { t } = useSettings();

  const handleSignOut = async () => {
    Alert.alert(
      t('account', 'logoutConfirmTitle'),
      t('account', 'logoutConfirmMessage'),
      [
        { text: t('common', 'cancel'), style: "cancel" },
        { 
          text: t('account', 'logout'), 
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth");
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('account', 'deleteConfirmTitle'),
      t('account', 'deleteConfirmMessage'),
      [
        { text: t('common', 'cancel'), style: "cancel" },
        { 
          text: t('account', 'delete'), 
          style: "destructive",
          onPress: () => {
             // Logic to delete account would go here
             Alert.alert(t('account', 'deleteNotSupportedTitle'), t('account', 'deleteNotSupportedMessage'));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('account', 'title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Mail color={colors.primary} size={20} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{t('account', 'email')}</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleSignOut}
          >
            <LogOut color={colors.error} size={20} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{t('account', 'logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleDeleteAccount}
          >
            <Trash2 color={colors.textSecondary} size={20} />
            <Text style={[styles.deleteText, { color: colors.textSecondary }]}>{t('account', 'deleteAccount')}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
  },
  logoutButton: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
