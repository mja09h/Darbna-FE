import { Stack } from "expo-router";
import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SettingsProvider } from "../context/SettingsContext";
import { MapProvider } from "../context/MapContext";
import { RouteRecordingProvider } from "../context/RouteRecordingContext";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const _layout = () => {
  const router = useRouter();

  useEffect(() => {
    // Handle notification response when user taps on a notification
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { alertId } = response.notification.request.content.data;
        if (alertId) {
          console.log(`Navigate to alert: ${alertId}`);
          // You can implement global state management to open the modal here
          // Example: router.push(`/alert/${alertId}`);
        }
      });

    // Cleanup subscription on unmount
    return () => Notifications.removeNotificationSubscription(responseListener);
  }, [router]);

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
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
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
