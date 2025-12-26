import createContextHook from "@nkzw/create-context-hook";
import { useColorScheme } from "react-native";
import { Colors, ThemeColors } from "@/constants/theme";
import { useSettings } from "@/context/SettingsContext";

interface ThemeContextValue {
  theme: "light" | "dark";
  colors: ThemeColors;
  isDark: boolean;
}

export const [ThemeProvider, useTheme] = createContextHook(
  (): ThemeContextValue => {
    const systemColorScheme = useColorScheme();
    const { settings } = useSettings();

    const getActiveTheme = (): "light" | "dark" => {
      if (settings.theme === "auto") {
        return systemColorScheme === "dark" ? "dark" : "light";
      }
      return settings.theme;
    };

    const activeTheme = getActiveTheme();
    const colors = Colors[activeTheme];

    return {
      theme: activeTheme,
      colors,
      isDark: activeTheme === "dark",
    };
  },
  {
    theme: "light",
    colors: Colors.light,
    isDark: false,
  }
);
