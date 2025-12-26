import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { useEffect, useState, useCallback } from "react";
import { Translations, SupportedLanguage } from "@/constants/translations";

export type Language = "auto" | SupportedLanguage;
export type ThemeSetting = "auto" | "light" | "dark";

export interface SettingsState {
  language: Language;
  theme: ThemeSetting;
  hasSeenOnboarding: boolean;
}

const SETTINGS_KEY = "@travelsnap_settings";

const DEFAULT_SETTINGS: SettingsState = {
  language: "auto",
  theme: "auto",
  hasSeenOnboarding: false,
};

export const [SettingsProvider, useSettings] = createContextHook(
  () => {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    const loadSettings = useCallback(async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      loadSettings();
    }, [loadSettings]);

    const saveSettings = async (newSettings: SettingsState) => {
      setSettings(newSettings);
      try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    };

    const updateSetting = async <K extends keyof SettingsState>(
      key: K,
      value: SettingsState[K]
    ) => {
      const newSettings = { ...settings, [key]: value };
      await saveSettings(newSettings);
    };

    const getActiveLanguage = useCallback((): SupportedLanguage => {
      if (settings.language !== "auto") {
        return settings.language;
      }

      const locales = getLocales();
      const deviceLanguage = locales[0]?.languageCode;

      // Check if device language is supported
      if (deviceLanguage && (deviceLanguage in Translations)) {
        return deviceLanguage as SupportedLanguage;
      }

      return "en";
    }, [settings.language]);

    const t = useCallback(
      (scope: keyof typeof Translations.en, key: string) => {
        const lang = getActiveLanguage();
        // @ts-ignore
        return Translations[lang]?.[scope]?.[key] || Translations['en'][scope][key] || key;
      },
      [getActiveLanguage]
    );
    
    // Helper to get the whole translation object for a scope
    const getTranslations = useCallback((scope: keyof typeof Translations.en) => {
       const lang = getActiveLanguage();
       return Translations[lang]?.[scope] || Translations['en'][scope];
    }, [getActiveLanguage]);


    return {
      settings,
      isLoading,
      updateSetting,
      activeLanguage: getActiveLanguage(),
      t, // simple translation helper
      getTranslations,
    };
  },
  {
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    updateSetting: async () => {},
    activeLanguage: "en",
    t: (_scope, key) => key,
    getTranslations: (scope) => Translations.en[scope],
  }
);
