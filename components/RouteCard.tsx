import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../data/colors";

interface RouteCardProps {
  name: string;
  distance: string;
  location: string;
  routeType?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const getRouteIcon = (routeType?: string): string => {
  switch (routeType) {
    case "Running":
      return "fitness-outline";
    case "Cycling":
      return "bicycle-outline";
    case "Walking":
      return "walk-outline";
    case "Hiking":
      return "trail-sign-outline";
    default:
      return "map-outline";
  }
};

const RouteCard: React.FC<RouteCardProps> = ({
  name,
  distance,
  location,
  routeType,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.routeItemContainer, style]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.routeCard}>
        {/* Route Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={getRouteIcon(routeType) as any}
            size={28}
            color={COLORS.white}
          />
        </View>

        {/* Route Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.routeName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Ionicons
                name="resize-outline"
                size={14}
                color={COLORS.lightText}
              />
              <Text style={styles.metadataText}>{distance}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.lightText}
              />
              <Text style={styles.metadataText}>{location}</Text>
            </View>
          </View>
        </View>

        {/* Chevron Icon */}
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  routeItemContainer: {
    marginBottom: 16,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.desertOrange,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 2,
    shadowColor: COLORS.desertOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  infoContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  chevronContainer: {
    marginLeft: 8,
    padding: 4,
  },
});

export default RouteCard;
