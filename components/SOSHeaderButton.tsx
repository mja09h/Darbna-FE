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
    style={styles.button}
  >
    <Ionicons name="alert-circle" size={28} color="#D9534F" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    marginLeft: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SOSHeaderButton;
