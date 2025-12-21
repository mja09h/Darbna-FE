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
import InteractiveMap from "./InteractiveMap";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

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
      setEditedIsPublic(route.isFavorite || false);
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

  // NEW: Handle Map button press
  const handleShowMap = () => {
    console.log("Map button pressed");
    console.log("Route data:", JSON.stringify(route, null, 2));
    setShowMapModal(true);
  };

  // NEW: Handle Get Directions button press
  const handleGetDirections = async () => {
    try {
      const startPoint = route.routeId?.startPoint;

      console.log("Get Directions pressed");
      console.log("Start point:", startPoint);

      if (!startPoint || !startPoint.latitude || !startPoint.longitude) {
        alert("Error", "Start point not available for this route");
        return;
      }

      const latitude = startPoint.latitude;
      const longitude = startPoint.longitude;

      // Try Google Maps first
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

      {/* Route Details */}
      <View style={styles.detailsContainer}>
        {/* Difficulty */}
        {route?.routeId?.difficulty && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Difficulty
            </Text>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor:
                    getDifficultyColor(route.routeId.difficulty) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  {
                    color: getDifficultyColor(route.routeId.difficulty),
                  },
                ]}
              >
                {route.routeId.difficulty}
              </Text>
            </View>
          </View>
        )}

        {/* Rating */}
        {route?.routeId?.rating && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Rating
            </Text>
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={
                    i < Math.floor(route.routeId.rating || 0)
                      ? "star"
                      : "star-outline"
                  }
                  size={16}
                  color="#FFB800"
                />
              ))}
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {route.routeId.rating?.toFixed(1)}
              </Text>
            </View>
          </View>
        )}

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
                  {showFullDescription ? "Show less" : "Show more"}
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
    <View style={styles.editContainer}>
      {/* Name */}
      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.text }]}>
          Route Name
        </Text>
        <TextInput
          style={[
            styles.editInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={editedName}
          onChangeText={setEditedName}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Description */}
      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.text }]}>
          Description
        </Text>
        <TextInput
          style={[
            styles.editInput,
            styles.editTextArea,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={editedDescription}
          onChangeText={setEditedDescription}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Route Type */}
      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.text }]}>
          Route Type
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeSelector}
        >
          {["Running", "Cycling", "Walking", "Hiking", "Other"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                {
                  backgroundColor:
                    editedRouteType === type ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setEditedRouteType(type)}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  {
                    color: editedRouteType === type ? "#fff" : colors.text,
                  },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Difficulty */}
      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.text }]}>
          Difficulty
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeSelector}
        >
          {["Easy", "Moderate", "Hard"].map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.typeOption,
                {
                  backgroundColor:
                    editedDifficulty === diff ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setEditedDifficulty(diff)}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  {
                    color: editedDifficulty === diff ? "#fff" : colors.text,
                  },
                ]}
              >
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Location */}
      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.text }]}>Location</Text>
        <TextInput
          style={[
            styles.editInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={editedLocation}
          onChangeText={setEditedLocation}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Public Switch */}
      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.text }]}>
          Make Public
        </Text>
        <Switch
          value={editedIsPublic}
          onValueChange={setEditedIsPublic}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSaveEdit}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {renderHeader()}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderHeroImage()}
            {isEditMode ? renderEditMode() : renderViewMode()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Map Modal */}
      {showMapModal && route?.routeId?.path && (
        <Modal
          visible={showMapModal}
          animationType="slide"
          onRequestClose={() => setShowMapModal(false)}
        >
          <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <View style={styles.mapHeader}>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowMapModal(false)}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Route Map
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <InteractiveMap
              userLocation={null}
              currentRoute={
                route.routeId?.points && route.routeId.points.length > 0
                  ? {
                      name: route.routeId.name || "",
                      description: route.routeId.description || "",
                      points: route.routeId.points,
                      startTime: null,
                      distance: route.routeId.distance || 0,
                      duration: route.routeId.duration || 0,
                    }
                  : null
              }
            />
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
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
    alignItems: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  pointInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pointLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  pointCoords: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "600",
  },
  editContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  editTextArea: {
    textAlignVertical: "top",
    paddingTop: 10,
  },
  typeSelector: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RouteDetailModal;
