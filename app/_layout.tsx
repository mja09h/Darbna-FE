import { Stack } from "expo-router";
import React from "react";
import { LanguageProvider } from "../context/LanguageContext";

const _layout = () => {
  return (
    <LanguageProvider>
      <Stack initialRouteName="(onBoarding)">
        <Stack.Screen name="(onBoarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </LanguageProvider>
  );
};

export default _layout;
