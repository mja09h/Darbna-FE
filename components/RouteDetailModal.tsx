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
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ISavedRoute } from "../context/SavedRoutesContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/index";
import { useLanguage } from "../context/LanguageContext";

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
      Alert.alert("Error", "Route name cannot be empty");
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

      Alert.alert("Success", "Route updated successfully");
      setIsEditMode(false);
      if (onRouteUpdated) {
        onRouteUpdated();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update route"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(route.routeId?.name || "");
    setEditedDescription(route.routeId?.description || "");
    setEditedIsPublic(route.isFavorite || false);
    setEditedRouteType(route.routeId?.routeType || "Other");
    setEditedDifficulty(route.routeId?.difficulty || "Moderate");
    setEditedLocation(route.routeId?.location || "");
    setIsEditMode(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this route? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (onRouteDeleted) {
              onRouteDeleted(route._id);
            }
          },
        },
      ]
    );
  };

  const images = [
    route.routeId?.screenshot?.url,
    ...(route.routeId?.images?.map((img: any) => img.url) || []),
  ].filter(Boolean);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={onClose}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {isCreator && !isEditMode && (
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => setIsEditMode(true)}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeroImage = () => (
    <View style={styles.heroImageContainer}>
      {images.length > 0 ? (
        <>
          <Image
            source={{ uri: images[currentImageIndex] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        index === currentImageIndex
                          ? "#fff"
                          : "rgba(255,255,255,0.5)",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View
          style={[styles.placeholderImage, { backgroundColor: colors.surface }]}
        >
          <Ionicons
            name="image-outline"
            size={80}
            color={colors.textSecondary}
          />
        </View>
      )}
    </View>
  );

  const renderEditMode = () => (
    <View
      style={[styles.editContainer, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.editLabel, { color: colors.text }]}>
        Route Name *
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
        placeholder="Enter route name"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.editLabel, { color: colors.text }]}>
        Description
      </Text>
      <TextInput
        style={[
          styles.editTextArea,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
        value={editedDescription}
        onChangeText={setEditedDescription}
        placeholder="Enter route description"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={4}
      />

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
        placeholder="e.g., Riyadh, Saudi Arabia"
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.editLabel, { color: colors.text }]}>
          Public Route
        </Text>
        <Switch
          value={editedIsPublic}
          onValueChange={setEditedIsPublic}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={editedIsPublic ? colors.background : colors.textSecondary}
        />
      </View>

      <Text style={[styles.editLabel, { color: colors.text }]}>Route Type</Text>
      <View style={styles.optionsRow}>
        {["Running", "Cycling", "Walking", "Hiking", "Other"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.optionChip,
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
                styles.optionText,
                {
                  color:
                    editedRouteType === type ? colors.background : colors.text,
                },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.editLabel, { color: colors.text }]}>Difficulty</Text>
      <View style={styles.optionsRow}>
        {["Easy", "Moderate", "Hard"].map((diff) => (
          <TouchableOpacity
            key={diff}
            style={[
              styles.optionChip,
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
                styles.optionText,
                {
                  color:
                    editedDifficulty === diff ? colors.background : colors.text,
                },
              ]}
            >
              {diff}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.editActions}>
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={handleCancelEdit}
          disabled={isSaving}
        >
          <Text style={[styles.editButtonText, { color: colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveEdit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.editButtonText, { color: colors.background }]}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {isCreator && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: "#F44336" }]}
          onPress={handleDelete}
          disabled={isSaving}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete Route</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderViewMode = () => (
    <>
      <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.routeName, { color: colors.text }]}>
            {route.routeId?.name || "Unnamed Route"}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={
                  i < Math.floor(route.routeId?.rating || 0)
                    ? "star"
                    : "star-outline"
                }
                size={16}
                color="#FFD700"
              />
            ))}
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {route.routeId?.rating?.toFixed(1) || "4.0"}
            </Text>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  getDifficultyColor(route.routeId?.difficulty || "Moderate") +
                  "20",
              },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                {
                  color: getDifficultyColor(
                    route.routeId?.difficulty || "Moderate"
                  ),
                },
              ]}
            >
              {route.routeId?.difficulty || "Moderate"}
            </Text>
          </View>
          {route.routeId?.location && (
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
            >
              • {route.routeId.location}
            </Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatDistance(route.routeId?.distance || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Length
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatElevation(route.routeId?.elevationGain || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Elevation gain
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {route.routeId?.estimatedTime ||
                formatDuration(route.routeId?.duration || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Estimated time
            </Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.routeTypeIcon}>
              <Ionicons name="repeat-outline" size={24} color={colors.text} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {getRouteTypeLabel(route.routeId?.routeType)}
            </Text>
          </View>
        </View>

        {route.routeId?.description && (
          <View style={styles.descriptionContainer}>
            <Text
              style={[styles.description, { color: colors.text }]}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {route.routeId.description}
            </Text>
            {route.routeId.description.length > 150 && (
              <TouchableOpacity
                onPress={() => setShowFullDescription(!showFullDescription)}
              >
                <Text style={[styles.showMoreText, { color: colors.primary }]}>
                  {showFullDescription ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="create-outline" size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Customize route
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="car-outline" size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Get directions
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={colors.background}
            />
            <Text
              style={[styles.primaryButtonText, { color: colors.background }]}
            >
              Download
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="map-outline" size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImageContainer: {
    width: width,
    height: height * 0.4,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  titleRow: {
    marginBottom: 12,
  },
  routeName: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statBox: {
    width: "48%",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  routeTypeIcon: {
    marginBottom: 4,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Edit Mode Styles
  editContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  editTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  editButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default RouteDetailModal;
