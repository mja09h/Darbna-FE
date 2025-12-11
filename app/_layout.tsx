import { Stack } from "expo-router";
import React from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SettingsProvider } from "../context/SettingsContext";

const _layout = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Stack initialRouteName="(onBoarding)">
          <Stack.Screen name="(onBoarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Stack initialRouteName="(onBoarding)">
            <Stack.Screen
              name="(onBoarding)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </SettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default _layout;
