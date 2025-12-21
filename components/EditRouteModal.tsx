import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useSettings } from "../context/SettingsContext";
import { useAlert } from "../context/AlertContext";
import { IRecordedRoute } from "../types/route";

const ROUTE_TYPES = ["Running", "Cycling", "Walking", "Hiking", "Other"];

interface EditRouteModalProps {
  visible: boolean;
  route: IRecordedRoute | null;
  onUpdate: (
    routeId: string,
    data: {
      name: string;
      description: string;
      isPublic: boolean;
      routeType: string;
    }
  ) => Promise<void>;
  onCancel: () => void;
}

const EditRouteModal: React.FC<EditRouteModalProps> = ({
  visible,
  route,
  onUpdate,
  onCancel,
}) => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { units } = useSettings();
  const { alert } = useAlert();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [routeType, setRouteType] = useState("Running");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (route) {
      setName(route.name);
      setDescription(route.description || "");
      setIsPublic(route.isPublic);
      setRouteType(route.routeType || "Running");
    }
  }, [route]);

  const formatDistance = (km: number) => {
    if (units === "miles") {
      const miles = km * 0.621371;
      if (miles < 1) {
        return `${(miles * 5280).toFixed(0)} ft`;
      }
      return `${miles.toFixed(2)} mi`;
    }
    if (km < 1) {
      return `${(km * 1000).toFixed(0)}m`;
    }
    return `${km.toFixed(2)}km`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const handleUpdate = async () => {
    if (!route) return;

    // Validation
    if (!name.trim()) {
      alert(t.common.error, "Route name is required");
      return;
    }

    if (description.length > 250) {
      alert(t.common.error, "Description must not exceed 250 characters");
      return;
    }

    if (!routeType) {
      alert(t.common.error, "Please select a route type");
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(route._id, {
        name: name.trim(),
        description: description.trim(),
        isPublic,
        routeType,
      });
    } catch (error) {
      alert(t.common.error, "Failed to update route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRouteTypeLabel = (type: string): string => {
    return (
      t.savedRoutes.routeTypes[type as keyof typeof t.savedRoutes.routeTypes] ||
      type
    );
  };

  if (!route) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View
        style={[styles.container, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      >
        <ScrollView style={styles.scrollView}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Edit Route
              </Text>
              <TouchableOpacity onPress={onCancel} disabled={isLoading}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Screenshot Preview */}
            {route.screenshot && (
              <View style={styles.screenshotContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Route Map
                </Text>
                <Image
                  source={{ uri: route.screenshot.url }}
                  style={styles.screenshot}
                />
              </View>
            )}

            {/* Route Stats */}
            <View
              style={[
                styles.statsContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Route Details
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t.savedRoutes.distance}
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatDistance(route.distance)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t.savedRoutes.duration}
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatTime(route.duration)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Route Name Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.savedRoutes.routeName}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Route Name"
                placeholderTextColor={colors.textSecondary}
                editable={!isLoading}
              />
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <View style={styles.labelContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t.savedRoutes.description}
                </Text>
                <Text
                  style={[
                    styles.characterCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {description.length}/250
                </Text>
              </View>
              <TextInput
                style={[
                  styles.descriptionInput,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                placeholder="Describe your route (e.g., difficulty, highlights, conditions)"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                maxLength={250}
                placeholderTextColor={colors.textSecondary}
                editable={!isLoading}
              />
            </View>

            {/* Route Type Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.savedRoutes.routeType}
              </Text>
              <View style={styles.typeGrid}>
                {ROUTE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      routeType === type && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setRouteType(type)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: colors.text },
                        routeType === type && { color: colors.background },
                      ]}
                    >
                      {getRouteTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Privacy Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Privacy
              </Text>
              <View style={styles.privacyContainer}>
                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    !isPublic && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setIsPublic(false)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={!isPublic ? "lock-closed" : "lock-open"}
                    size={20}
                    color={!isPublic ? colors.background : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.privacyButtonText,
                      { color: !isPublic ? colors.background : colors.text },
                    ]}
                  >
                    Private
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    isPublic && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setIsPublic(true)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isPublic ? "globe" : "globe-outline"}
                    size={20}
                    color={isPublic ? colors.background : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.privacyButtonText,
                      { color: isPublic ? colors.background : colors.text },
                    ]}
                  >
                    Public
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[styles.privacyHint, { color: colors.textSecondary }]}
              >
                {isPublic
                  ? "This route will be visible to all users in the community"
                  : "This route will be saved privately to your account"}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={onCancel}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleUpdate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: colors.background },
                    ]}
                  >
                    Update
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrollView: {
    maxHeight: "90%",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  characterCount: {
    fontSize: 12,
  },
  screenshotContainer: {
    marginBottom: 20,
  },
  screenshot: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  statsContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  descriptionInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 100,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeButton: {
    width: "48%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 10,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  privacyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  privacyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 5,
  },
  privacyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  privacyHint: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {},
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EditRouteModal;
