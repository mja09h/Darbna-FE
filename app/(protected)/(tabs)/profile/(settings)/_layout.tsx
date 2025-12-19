import React from "react";
import { Stack } from "expo-router";

const _layout = () => {
  return (
    
    <Stack>
      
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="editProfile" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
