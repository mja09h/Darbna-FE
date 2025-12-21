import { Stack } from "expo-router";
import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SettingsProvider } from "../context/SettingsContext";
import { MapProvider } from "../context/MapContext";
import { RouteRecordingProvider } from "../context/RouteRecordingContext";
import { SavedRoutesProvider } from "../context/SavedRoutesContext";
import { AlertProvider } from "../context/AlertContext";

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

    // Handle deep links for password reset
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === "reset-password" && queryParams?.token) {
        const token = queryParams.token as string;
        router.push({
          pathname: "/(auth)/resetPassword",
          params: { token },
        });
      }
    };

    // Listen for deep links when app is already open
    const linkingListener = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      Notifications.removeNotificationSubscription(responseListener);
      linkingListener.remove();
    };
  }, [router]);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AlertProvider>
            <AuthProvider>
              <MapProvider>
                <RouteRecordingProvider>
                  <SavedRoutesProvider>
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
                      <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                      />
                    </Stack>
                  </SavedRoutesProvider>
                </RouteRecordingProvider>
              </MapProvider>
            </AuthProvider>
          </AlertProvider>
        </SettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default _layout;
