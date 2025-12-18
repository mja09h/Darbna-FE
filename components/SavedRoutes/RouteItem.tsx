import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSavedRoutes } from "../../context/SavedRoutesContext";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";
import { ISavedRoute } from "../../context/SavedRoutesContext";

interface RouteItemProps {
  route: ISavedRoute;
}

const RouteItem: React.FC<RouteItemProps> = ({ route }) => {
  const { deleteSavedRoute, toggleFavorite } = useSavedRoutes();
  const { colors } = useTheme();
  const { units } = useSettings();
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDistance = (km: number): string => {
    if (units === "miles") {
      const miles = km * 0.621371;
      return miles < 1
        ? `${(miles * 5280).toFixed(0)} ft`
        : `${miles.toFixed(2)} mi`;
    }
    return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this saved route?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteSavedRoute(route._id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete route");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(route._id);
    } catch (error) {
      Alert.alert("Error", "Failed to toggle favorite");
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: colors.border || "#e0e0e0" },
      ]}
      disabled={isDeleting}
    >
      <View style={styles.content}>
        {/* Route Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={
              route.routeId.routeType === "Running"
                ? "fitness-outline"
                : route.routeId.routeType === "Cycling"
                ? "bicycle-outline"
                : route.routeId.routeType === "Walking"
                ? "walk-outline"
                : "trail-sign-outline"
            }
            size={24}
            color="#C46F26"
          />
        </View>

        {/* Route Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.routeName} numberOfLines={1}>
            {route.routeId.name}
          </Text>
          <Text style={styles.metadata}>
            {formatDistance(route.routeId.distance)} •{" "}
            {formatDate(route.savedAt)}
          </Text>
          {route.folderId && (
            <Text style={styles.folder}>{route.folderId.name}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.actionButton}
          >
            <Ionicons
              name={route.isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={route.isFavorite ? "#C46F26" : "#999"}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  metadata: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  folder: {
    fontSize: 12,
    color: "#C46F26",
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});

export default RouteItem;
