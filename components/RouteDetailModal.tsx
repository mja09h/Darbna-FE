import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ISavedRoute } from "../context/SavedRoutesContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import api from "../api/index";
import { useLanguage } from "../context/LanguageContext";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

interface RouteDetailModalProps {
  visible: boolean;
  onClose: () => void;
  route: ISavedRoute | null;
  onRouteUpdated?: () => void;
  onRouteDeleted?: (routeId: string) => void;
}

const RouteDetailModal: React.FC<RouteDetailModalProps> = ({
  visible,
  onClose,
  route,
  onRouteUpdated,
  onRouteDeleted,
}) => {
  const { units } = useSettings();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { alert } = useAlert();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedIsPublic, setEditedIsPublic] = useState(false);
  const [editedRouteType, setEditedRouteType] = useState("");
  const [editedDifficulty, setEditedDifficulty] = useState("");
  const [editedLocation, setEditedLocation] = useState("");

  useEffect(() => {
    if (route) {
      setEditedName(route.routeId?.name || "");
      setEditedDescription(route.routeId?.description || "");
      setEditedIsPublic(route.routeId?.isPublic || false);  // FIXED: Changed from route.isPublic
      setEditedRouteType(route.routeId?.routeType || "Other");
      setEditedDifficulty(route.routeId?.difficulty || "Moderate");
      setEditedLocation(route.routeId?.location || "");
      setIsEditMode(false);
    }
  }, [route]);

  if (!route) return null;

  const isCreator = user?._id === route.routeId?.userId;
  const actualRouteId = route._id?.startsWith("recorded_")
    ? route._id.replace("recorded_", "")
    : route.routeId?._id;

  const formatDistance = (km: number): string => {
    if (units === "miles") {
      const miles = km * 0.621371;
      return miles < 1
        ? `${(miles * 5280).toFixed(0)} ft`
        : `${miles.toFixed(2)} mi`;
    }
    return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`;
  };

  const formatElevation = (meters: number): string => {
    if (units === "miles") {
      const feet = meters * 3.28084;
      return `${feet.toFixed(0)} ft`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}-${hours + 1} hr`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    }
    return "< 1 min";
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "#4CAF50";
      case "moderate":
        return "#FF9800";
      case "hard":
        return "#F44336";
      default:
        return colors.textSecondary;
    }
  };

  const getRouteTypeLabel = (routeType?: string): string => {
    if (!routeType) return "Loop";

    const coords = route.routeId.path?.coordinates;
    if (coords && coords.length > 1) {
      const start = coords[0];
      const end = coords[coords.length - 1];
      const isLoop =
        Math.abs(start[0] - end[0]) < 0.001 &&
        Math.abs(start[1] - end[1]) < 0.001;
      return isLoop ? "Loop" : "Out & Back";
    }

    return "Loop";
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      alert("Error", "Route name cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/routes/${actualRouteId}`, {
        name: editedName,
        description: editedDescription,
        isPublic: editedIsPublic,
        routeType: editedRouteType,
        difficulty: editedDifficulty,
        location: editedLocation,
      });

      alert("Success", "Route updated successfully");
      setIsEditMode(false);
      onRouteUpdated?.();
      onClose(); // Add this line to close the modal
    } catch (error) {
      alert("Error", "Failed to update route");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = () => {
    alert("Delete Route", "Are you sure you want to delete this route?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          onRouteDeleted?.(route._id);
        },
      },
    ]);
  };

  const handleShowMap = () => {
    onClose();
    router.push({
      pathname: "/(protected)/(tabs)/home",
      params: { route: JSON.stringify(route.routeId) },
    });
  };

  const handleGetDirections = async () => {
    try {
      const startPoint = route.routeId?.startPoint;

      if (!startPoint || !startPoint.latitude || !startPoint.longitude) {
        alert("Error", "Start point not available for this route");
        return;
      }

      const latitude = startPoint.latitude;
      const longitude = startPoint.longitude;

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}`;

      try {
        await Linking.openURL(googleMapsUrl);
      } catch (error) {
        try {
          await Linking.openURL(appleMapsUrl);
        } catch (appleMapsError) {
          alert("Error", "No maps application available on your device");
        }
      }
    } catch (error) {
      alert("Error", "Failed to open directions");
    }
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.headerButton,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={onClose}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text
        style={[styles.headerTitle, { color: colors.text }]}
        numberOfLines={1}
      >
        {route?.routeId?.name}
      </Text>

      {isCreator && (
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setIsEditMode(!isEditMode)}
        >
          <Ionicons
            name={isEditMode ? "close" : "pencil"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeroImage = () => {
    const images = [
      ...(route?.routeId?.screenshot ? [route.routeId.screenshot.url] : []),
      ...(route?.routeId?.images?.map((img: any) => img.url) || []),
    ];

    if (images.length === 0) {
      return (
        <View
          style={[styles.heroImage, { backgroundColor: colors.primaryLight }]}
        >
          <Ionicons name="map-outline" size={64} color={colors.primary} />
        </View>
      );
    }

    return (
      <View>
        <Image
          source={{ uri: images[currentImageIndex] }}
          style={styles.heroImage}
        />
        {images.length > 1 && (
          <View style={styles.imageIndicator}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentImageIndex ? colors.primary : "#ccc",
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderViewMode = () => (
    <>
      {/* Route Stats */}
      <View
        style={[styles.statsContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Distance
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatDistance(route?.routeId?.distance || 0)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Elevation
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatElevation(route?.routeId?.elevationGain || 0)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Time
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatDuration(route?.routeId?.duration || 0)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Type
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {getRouteTypeLabel(route?.routeId?.routeType)}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        {/* Difficulty & Rating */}
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Difficulty
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor: getDifficultyColor(
                  route?.routeId?.difficulty || "Moderate"
                ),
              },
            ]}
          >
            <Text style={[styles.difficultyText, { color: "#fff" }]}>
              {route?.routeId?.difficulty || "Moderate"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Rating
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={"#FFC107"} />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {route?.routeId?.rating?.toFixed(1) || "4.0"}
            </Text>
          </View>
        </View>

        {/* Description */}
        {route?.routeId?.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Description
            </Text>
            <Text
              style={[styles.descriptionText, { color: colors.textSecondary }]}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {route.routeId.description}
            </Text>
            {route.routeId.description.length > 100 && (
              <TouchableOpacity
                onPress={() => setShowFullDescription(!showFullDescription)}
              >
                <Text style={[styles.readMore, { color: colors.primary }]}>
                  {showFullDescription ? "Read Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Route Points */}
        {(route?.routeId?.startPoint || route?.routeId?.endPoint) && (
          <View style={styles.pointsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Route Points
            </Text>

            {route?.routeId?.startPoint && (
              <View style={styles.pointRow}>
                <Ionicons name="location" size={20} color="#4CAF50" />
                <View style={styles.pointInfo}>
                  <Text style={[styles.pointLabel, { color: colors.text }]}>
                    Start Point
                  </Text>
                  <Text
                    style={[
                      styles.pointCoords,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {route.routeId.startPoint.latitude.toFixed(6)},{" "}
                    {route.routeId.startPoint.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}

            {route?.routeId?.endPoint && (
              <View style={styles.pointRow}>
                <Ionicons name="location" size={20} color="#F44336" />
                <View style={styles.pointInfo}>
                  <Text style={[styles.pointLabel, { color: colors.text }]}>
                    End Point
                  </Text>
                  <Text
                    style={[
                      styles.pointCoords,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {route.routeId.endPoint.latitude.toFixed(6)},{" "}
                    {route.routeId.endPoint.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleGetDirections}
        >
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Get Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={handleShowMap}
        >
          <Ionicons name="map-outline" size={20} color={colors.text} />
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete Button */}
      {isCreator && (
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: "rgba(244, 67, 54, 0.1)" },
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
          <Text style={styles.deleteButtonText}>Delete Route</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderEditMode = () => (
    <View style={styles.detailsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Edit Route
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Name
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={editedName}
          onChangeText={setEditedName}
          placeholder="Route Name"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Description
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={editedDescription}
          onChangeText={setEditedDescription}
          placeholder="Description"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Location
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={editedLocation}
          onChangeText={setEditedLocation}
          placeholder="e.g. Riyadh, Saudi Arabia"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Route Type
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={editedRouteType}
          onChangeText={setEditedRouteType}
          placeholder="e.g. Hiking, Running"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Difficulty
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={editedDifficulty}
          onChangeText={setEditedDifficulty}
          placeholder="e.g. Easy, Moderate, Hard"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Public
        </Text>
        <Switch
          value={editedIsPublic}
          onValueChange={setEditedIsPublic}
          trackColor={{ false: "#767577", true: colors.primary }}
          thumbColor={editedIsPublic ? colors.primaryLight : "#f4f3f4"}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: colors.primary, marginTop: 20 },
        ]}
        onPress={handleSaveEdit}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderHeroImage()}
          {isEditMode ? renderEditMode() : renderViewMode()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroImage: {
    width: "100%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  imageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  detailsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  pointsContainer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pointInfo: {
    marginLeft: 12,
  },
  pointLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  pointCoords: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 25,
    marginHorizontal: 24,
    marginTop: 12,
  },
  deleteButtonText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
});

export default RouteDetailModal;
