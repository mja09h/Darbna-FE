// components/SOSHeaderButton.tsx
import React from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";

interface SOSHeaderButtonProps {
  onPress: () => void;
}

const SOSHeaderButton = ({ onPress }: SOSHeaderButtonProps) => (
  <TouchableOpacity onPress={onPress} style={styles.button} activeOpacity={0.7}>
    <View style={styles.sosContainer}>
      <Text style={styles.sosText}>SOS</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    marginLeft: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  sosContainer: {
    backgroundColor: "#F4EEE7", // offWhiteDesert
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C46F26", // desertOrange
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sosText: {
    color: "#FF3B30", // Red for visibility
    fontSize: 14,
    fontWeight: "900", // Extra bold
    letterSpacing: 0.5,
  },
});

export default SOSHeaderButton;
