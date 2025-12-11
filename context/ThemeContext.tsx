import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, ColorSchemeName } from "react-native";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface Colors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  border: string;
  card: string;
}

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  colors: Colors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "@app_theme";

// Light theme colors (matching existing app colors)
const lightColors: Colors = {
  background: "#ffffff",
  surface: "#f5f5f5",
  text: "#2c120c",
  textSecondary: "#a89080",
  primary: "#ad5410",
  primaryLight: "#f5e6d3",
  border: "#e0e0e0",
  card: "#ffffff",
};

// Dark theme colors
const darkColors: Colors = {
  background: "#1a1a1a",
  surface: "#2c2c2c",
  text: "#f5e6d3",
  textSecondary: "#a89080",
  primary: "#ad5410",
  primaryLight: "#3d2818",
  border: "#404040",
  card: "#2c2c2c",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    loadSavedTheme();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (
        savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "system"
      ) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.log("Error loading theme:", error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemTheme === "dark" ? "dark" : "light") : theme;

  const colors = resolvedTheme === "dark" ? darkColors : lightColors;
  const isDark = resolvedTheme === "dark";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        colors,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
