import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../data/colors";

interface MapLayerSwitcherProps {
  currentMapType: "standard" | "satellite" | "terrain" | "hybrid";
  onMapTypeChange: (
    mapType: "standard" | "satellite" | "terrain" | "hybrid"
  ) => void;
}

const MAP_TYPES: Array<{
  type: "standard" | "satellite" | "terrain" | "hybrid";
  label: string;
  icon: string;
}> = [
  { type: "standard", label: "Map", icon: "map" },
  { type: "satellite", label: "Satellite", icon: "image" },
  { type: "terrain", label: "Terrain", icon: "layers" }, // FIXED: Changed from "mountain" to "layers"
];

const MapLayerSwitcher: React.FC<MapLayerSwitcherProps> = ({
  currentMapType,
  onMapTypeChange,
}) => {
  return (
    <View style={styles.container}>
      {MAP_TYPES.map((item) => (
        <TouchableOpacity
          key={item.type}
          style={[
            styles.button,
            currentMapType === item.type && styles.activeButton,
          ]}
          onPress={() => onMapTypeChange(item.type)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.icon as any}
            size={20}
            color={
              currentMapType === item.type ? COLORS.white : COLORS.darkSandBrown
            }
          />
          <Text
            style={[
              styles.buttonText,
              currentMapType === item.type && styles.activeButtonText,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 5,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  activeButton: {
    backgroundColor: COLORS.desertOrange,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.darkSandBrown,
  },
  activeButtonText: {
    color: COLORS.white,
  },
});

export default MapLayerSwitcher;
