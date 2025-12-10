import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import React from "react";

const _layout = () => {
  return (
    <Stack initialRouteName="(onBoarding)">
      <Stack.Screen name="(onBoarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;

const styles = StyleSheet.create({});
