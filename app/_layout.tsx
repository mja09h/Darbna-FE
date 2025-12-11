import { Stack } from "expo-router";
import React from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";

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
    </LanguageProvider>
  );
};

export default _layout;
