import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Redirect } from "expo-router";

const index = () => {
  return Redirect({
    href: "/(protected)/(tabs)/profile/(settings)",
  });
};

export default index;

const styles = StyleSheet.create({});
