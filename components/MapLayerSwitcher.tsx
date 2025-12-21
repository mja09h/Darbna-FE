import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../data/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
            size={22}
            color={
              currentMapType === item.type ? COLORS.white : COLORS.darkSandBrown
            }
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    top: SCREEN_HEIGHT / 2 - 66, // Center vertically (3 buttons * 44px height / 2)
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  activeButton: {
    backgroundColor: COLORS.desertOrange,
  },
});

export default MapLayerSwitcher;
