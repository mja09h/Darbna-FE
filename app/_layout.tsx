import { Stack } from "expo-router";
import React from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SettingsProvider } from "../context/SettingsContext";
import { MapProvider } from "../context/MapContext"; 
import { RouteRecordingProvider } from "../context/RouteRecordingContext";
const _layout = () => {
  return (
    <MapProvider>
      <RouteRecordingProvider>
      <LanguageProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <Stack initialRouteName="(onBoarding)">
              <Stack.Screen
                name="(onBoarding)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(protected)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
    </RouteRecordingProvider>
    </MapProvider>  
  );
};

export default _layout;
