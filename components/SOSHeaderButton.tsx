// components/SOSHeaderButton.tsx
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SOSHeaderButtonProps {
  onPress: () => void;
}

const SOSHeaderButton = ({ onPress }: SOSHeaderButtonProps) => (
  <TouchableOpacity
    onPress={() => {
      onPress();
    }}
    style={{ marginLeft: 16 }}
  >
    <Ionicons name="warning" size={28} color="#D9534F" />
  </TouchableOpacity>
);

export default SOSHeaderButton;
