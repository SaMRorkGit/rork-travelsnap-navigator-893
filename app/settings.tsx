import { router } from "expo-router";
import { ArrowLeft, Camera, Mic, ChevronRight, Globe, FileText, Shield, Moon } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Linking, Platform, Alert, ActionSheetIOS, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera as ExpoCamera } from "expo-camera";
import { Audio } from "expo-av";

import { useTheme } from "@/context/ThemeContext";
import { useSettings, ThemeSetting, Language } from "@/context/SettingsContext";
import { LanguageNames } from "@/constants/translations";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSetting, t, isLoading } = useSettings();
  
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setCheckingPermissions(true);
      const cameraStatus = await ExpoCamera.getCameraPermissionsAsync();
      setCameraPermission(cameraStatus.granted);

      const micStatus = await Audio.getPermissionsAsync();
      setMicPermission(micStatus.granted);
    } catch (error) {
      console.error("Error checking permissions:", error);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      if (Linking.openSettings) {
        Linking.openSettings();
      } else {
        Alert.alert(t('common', 'error'), "Please open your device settings to manage permissions.");
      }
    }
  };

  const handlePermissionPress = (granted: boolean | null, type: string) => {
    if (granted) return;

    Alert.alert(
      "Permission Required",
      `${type} access is not granted. Please enable it in system settings to use this feature.`,
      [
        { text: t('common', 'cancel'), style: "cancel" },
        { text: "Open Settings", onPress: openSettings }
      ]
    );
  };

  const handleLanguageChange = () => {
    const languageCodes: Language[] = ['auto', 'en', 'de', 'fr', 'it', 'es', 'pt', 'no', 'zh'];
    const options = [
      t('settings', 'theme').auto,
      LanguageNames.en,
      LanguageNames.de,
      LanguageNames.fr,
      LanguageNames.it,
      LanguageNames.es,
      LanguageNames.pt,
      LanguageNames.no,
      LanguageNames.zh,
      t('common', 'cancel')
    ];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex < languageCodes.length) {
            updateSetting('language', languageCodes[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        t('settings', 'language'),
        t('settings', 'chooseLanguage'),
        [
          ...languageCodes.map((code, index) => ({
            text: options[index],
            onPress: () => updateSetting('language', code)
          })),
          { text: t('common', 'cancel'), style: "cancel" as const }
        ]
      );
    }
  };

  const handleAppearanceChange = () => {
    const options = [
      t('settings', 'theme').auto, 
      t('settings', 'theme').light, 
      t('settings', 'theme').dark, 
      t('common', 'cancel')
    ];
    
    const themeValues: ThemeSetting[] = ['auto', 'light', 'dark'];

    if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex: 3,
            },
            (buttonIndex) => {
                if (buttonIndex !== 3) {
                    updateSetting('theme', themeValues[buttonIndex]);
                }
            }
        );
    } else {
        Alert.alert(
            t('settings', 'appearance'),
            "Choose your preferred appearance",
            [
                { text: t('settings', 'theme').auto, onPress: () => updateSetting('theme', 'auto') },
                { text: t('settings', 'theme').light, onPress: () => updateSetting('theme', 'light') },
                { text: t('settings', 'theme').dark, onPress: () => updateSetting('theme', 'dark') },
                { text: t('common', 'cancel'), style: "cancel" }
            ]
        );
    }
  };

  const getLanguageLabel = () => {
    if (settings.language === 'auto') return t('settings', 'theme').auto;
    return LanguageNames[settings.language] || settings.language;
  };

  const getThemeLabel = () => {
    if (settings.theme === 'auto') return t('settings', 'theme').auto;
    if (settings.theme === 'light') return t('settings', 'theme').light;
    if (settings.theme === 'dark') return t('settings', 'theme').dark;
    return settings.theme;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings', 'title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings', 'permissions')}</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.row}
            onPress={() => handlePermissionPress(cameraPermission, t('settings', 'camera'))}
            disabled={cameraPermission === true || checkingPermissions}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Camera color={colors.primary} size={20} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings', 'camera')}</Text>
            </View>
            <View style={styles.rowRight}>
                {checkingPermissions ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <>
                    <Text style={[styles.statusText, { color: cameraPermission ? colors.primary : colors.textSecondary }]}>
                    {cameraPermission ? t('settings', 'granted') : t('settings', 'notGranted')}
                    </Text>
                    {!cameraPermission && <ChevronRight color={colors.textSecondary} size={20} />}
                  </>
                )}
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            style={styles.row}
            onPress={() => handlePermissionPress(micPermission, t('settings', 'microphone'))}
            disabled={micPermission === true || checkingPermissions}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Mic color={colors.primary} size={20} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings', 'microphone')}</Text>
            </View>
             <View style={styles.rowRight}>
                {checkingPermissions ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <>
                    <Text style={[styles.statusText, { color: micPermission ? colors.primary : colors.textSecondary }]}>
                    {micPermission ? t('settings', 'granted') : t('settings', 'notGranted')}
                    </Text>
                     {!micPermission && <ChevronRight color={colors.textSecondary} size={20} />}
                  </>
                )}
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings', 'preferences')}</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.row} onPress={handleLanguageChange}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Globe color={colors.primary} size={20} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings', 'language')}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>{getLanguageLabel()}</Text>
               <ChevronRight color={colors.textSecondary} size={20} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

           <TouchableOpacity style={styles.row} onPress={handleAppearanceChange}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Moon color={colors.primary} size={20} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings', 'appearance')}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>{getThemeLabel()}</Text>
               <ChevronRight color={colors.textSecondary} size={20} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings', 'legal')}</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.row}
            onPress={() => openLink("https://termify.io/privacy-policy/715uL3GSdR")}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Shield color={colors.primary} size={20} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings', 'privacyPolicy')}</Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            style={styles.row}
            onPress={() => openLink("https://termify.io/terms-and-conditions/Eq8p7cCPea")}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <FileText color={colors.primary} size={20} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings', 'termsOfService')}</Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginLeft: 60, 
  },
});
