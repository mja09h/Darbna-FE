import React from "react";
import { Stack } from "expo-router";

const _layout = () => {
  return (
    <Stack initialRouteName="welcome">
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
