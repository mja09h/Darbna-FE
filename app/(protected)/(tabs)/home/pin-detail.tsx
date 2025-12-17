import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
  FlatList,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMap } from "../../../../context/MapContext";
import { useAuth } from "../../../../context/AuthContext";
import { IPinnedPlace, CreatePinData } from "../../../../types/map";
import { getPinById } from "../../../../api/pins";
import { BASE_URL } from "../../../../api/index";
import * as ImagePicker from "expo-image-picker";

// Pin categories from backend
const PIN_CATEGORIES = [
  "mountain",
  "desert",
  "valley",
  "canyon",
  "cave",
  "waterfall",
  "lake",
  "river",
  "spring",
  "oasis",
  "forest",
  "trail",
  "campsite",
  "viewpoint",
  "rock_formation",
  "wildlife_area",
  "emergency_shelter",
  "landmark",
  "other",
] as const;

// Format category name for display
const formatCategoryName = (category: string): string => {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Darbna Brand Colors
const COLORS = {
  desertOrange: "#C46F26",
  darkSandBrown: "#3A1D1A",
  palmBrown: "#7D482",
  sandBeige: "#E9DCCF",
  offWhiteDesert: "#F4EEE7",
  white: "#FFFFFF",
  text: "#333333",
  lightText: "#666666",
  green: "#4CAF50",
  red: "#F44336",
};

const PinDetailPage = () => {
  const router = useRouter();
  const { pinId } = useLocalSearchParams<{ pinId: string }>();
  const { updatePin, deletePin, pinnedPlaces } = useMap();
  const { user } = useAuth();
  const [pin, setPin] = useState<IPinnedPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const MAX_IMAGES = 4;

  // Check if user owns this pin
  const isOwner =
    user &&
    pin &&
    pin.userId &&
    typeof pin.userId === "object" &&
    pin.userId._id === user._id;

  // Fetch pin data
  useEffect(() => {
    const fetchPin = async () => {
      try {
        setLoading(true);
        // First try to get from context
        const pinFromContext = pinnedPlaces.find((p) => p._id === pinId);
        if (pinFromContext) {
          setPin(pinFromContext);
          setTitle(pinFromContext.title);
          setDescription(pinFromContext.description || "");
          setCategory(pinFromContext.category);
          setIsPublic(pinFromContext.isPublic);
        } else {
          // If not in context, fetch from API
          const fetchedPin = await getPinById(pinId);
          setPin(fetchedPin);
          setTitle(fetchedPin.title);
          setDescription(fetchedPin.description || "");
          setCategory(fetchedPin.category);
          setIsPublic(fetchedPin.isPublic);
        }
      } catch (error) {
        console.error("Error fetching pin:", error);
        Alert.alert("Error", "Failed to load pin details");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (pinId) {
      fetchPin();
    }
  }, [pinId, pinnedPlaces]);

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      "Delete Pin",
      "Are you sure you want to delete this pin? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePin(pinId);
              Alert.alert("Success", "Pin deleted successfully");
              router.back();
            } catch (error) {
              console.error("Error deleting pin:", error);
              Alert.alert("Error", "Failed to delete pin");
            }
          },
        },
      ]
    );
  };

  // Handle edit save
  const handleSave = async () => {
    if (!title.trim() || !category) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const updateData: Partial<CreatePinData> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        isPublic,
        location: {
          latitude: pin!.location.coordinates[1],
          longitude: pin!.location.coordinates[0],
        },
      };

      if (images.length > 0) {
        updateData.images = images;
      }

      const updatedPin = await updatePin(pinId, updateData);
      setPin(updatedPin);
      setIsEditing(false);
      Alert.alert("Success", "Pin updated successfully");
    } catch (error) {
      console.error("Error updating pin:", error);
      Alert.alert("Error", "Failed to update pin");
    } finally {
      setSaving(false);
    }
  };

  // Pick images
  const pickImages = async () => {
    // Check if we've reached the max
    if (images.length >= MAX_IMAGES) {
      Alert.alert(
        "Maximum Images",
        `You can only add up to ${MAX_IMAGES} images per pin.`
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to add images!"
      );
      return;
    }

    // Calculate how many images we can still add
    const remainingSlots = MAX_IMAGES - images.length;
    const allowsMultipleSelection = remainingSlots > 1;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: allowsMultipleSelection,
      quality: 0.8,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Add new images to existing ones, but don't exceed MAX_IMAGES
      const newImages = result.assets.slice(0, remainingSlots);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.desertOrange} />
        <Text style={styles.loadingText}>Loading pin details...</Text>
      </View>
    );
  }

  if (!pin) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Pin not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get image URIs - handle both full URLs and relative paths
  const getImageUris = (): string[] => {
    // If editing and have new images, use those
    if (isEditing && images.length > 0) {
      return images.map((img) => img.uri);
    }

    // Otherwise use pin images
    if (!pin.images || pin.images.length === 0) return [];

    const baseUrl = BASE_URL.replace("/api", "");
    return pin.images.map((imgPath) => {
      // If image is already a full URL, use it; otherwise prepend BASE_URL
      if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
        return imgPath;
      }
      return `${baseUrl}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
    });
  };

  const imageUris = getImageUris();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Pin Details</Text>
          </View>
          {isOwner && !isEditing && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          {isOwner && isEditing && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setIsEditing(false);
                // Reset form
                setTitle(pin.title);
                setDescription(pin.description || "");
                setCategory(pin.category);
                setIsPublic(pin.isPublic);
                setImages([]);
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          {!isOwner && <View style={styles.headerButton} />}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Images */}
          <View style={styles.imagesSection}>
            {isEditing ? (
              <>
                <Text style={styles.label}>
                  Images - {images.length}/{MAX_IMAGES}
                </Text>

                {/* Display selected images in edit mode */}
                {images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagesScrollView}
                    contentContainerStyle={styles.imagesScrollContent}
                  >
                    {images.map((img, index) => (
                      <View key={index} style={styles.imageItem}>
                        <Image
                          source={{ uri: img.uri }}
                          style={styles.imageThumbnail}
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color={COLORS.white}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Add images button */}
                {images.length < MAX_IMAGES && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={pickImages}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={32}
                      color={COLORS.desertOrange}
                    />
                    <Text style={styles.addImageButtonText}>
                      {images.length === 0
                        ? "Add Images"
                        : `Add More (${MAX_IMAGES - images.length} remaining)`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {imageUris.length > 0 ? (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={true}
                    style={styles.imagesScrollView}
                    contentContainerStyle={styles.imagesScrollContent}
                  >
                    {imageUris.map((uri, index) => (
                      <Image
                        key={index}
                        source={{ uri }}
                        style={styles.image}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={64}
                      color={COLORS.lightText}
                    />
                    <Text style={styles.imagePlaceholderText}>No Images</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Content */}
          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter pin title"
                  placeholderTextColor={COLORS.lightText}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter description"
                  placeholderTextColor={COLORS.lightText}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      !category && styles.categoryButtonTextPlaceholder,
                    ]}
                  >
                    {category
                      ? formatCategoryName(category)
                      : "Select Category"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Public Pin</Text>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{
                      false: COLORS.lightText,
                      true: COLORS.green,
                    }}
                    thumbColor={COLORS.white}
                  />
                </View>
                <Text style={styles.switchHint}>
                  {isPublic
                    ? "Anyone can see this pin"
                    : "Only you can see this pin"}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setTitle(pin.title);
                    setDescription(pin.description || "");
                    setCategory(pin.category);
                    setIsPublic(pin.isPublic);
                    setImages([]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saving && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.detailsContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>{pin.title}</Text>
                <View style={styles.badgeContainer}>
                  <View
                    style={[
                      styles.badge,
                      pin.isPublic ? styles.badgePublic : styles.badgePrivate,
                    ]}
                  >
                    <Ionicons
                      name={pin.isPublic ? "globe" : "lock-closed"}
                      size={14}
                      color={COLORS.white}
                    />
                    <Text style={styles.badgeText}>
                      {pin.isPublic ? "Public" : "Private"}
                    </Text>
                  </View>
                </View>
              </View>

              {pin.description && (
                <View style={styles.descriptionCard}>
                  <Text style={styles.description}>{pin.description}</Text>
                </View>
              )}

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons
                      name="pricetag"
                      size={20}
                      color={COLORS.desertOrange}
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Category</Text>
                    <Text style={styles.infoText}>
                      {formatCategoryName(pin.category)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons
                      name="person"
                      size={20}
                      color={COLORS.desertOrange}
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Created by</Text>
                    <Text style={styles.infoText}>
                      {pin.userId?.username || "Unknown"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={COLORS.desertOrange}
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Created on</Text>
                    <Text style={styles.infoText}>
                      {new Date(pin.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {isOwner && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash" size={20} color={COLORS.white} />
                  <Text style={styles.deleteButtonText}>Delete Pin</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={PIN_CATEGORIES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      category === item && styles.categoryItemSelected,
                    ]}
                    onPress={() => {
                      setCategory(item);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        category === item && styles.categoryItemTextSelected,
                      ]}
                    >
                      {formatCategoryName(item)}
                    </Text>
                    {category === item && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={COLORS.desertOrange}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkSandBrown,
    paddingTop: 30,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.offWhiteDesert,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.red,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: COLORS.desertOrange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.darkSandBrown,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imagesSection: {
    width: "100%",
    marginBottom: 20,
  },
  imagesScrollView: {
    width: "100%",
    height: 280,
  },
  imagesScrollContent: {
    alignItems: "center",
  },
  image: {
    width: Dimensions.get("window").width,
    height: 280,
    resizeMode: "cover",
  },
  imageItem: {
    position: "relative",
    marginRight: 12,
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  addImageButton: {
    marginTop: 12,
    padding: 16,
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.sandBeige,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addImageButtonText: {
    color: COLORS.desertOrange,
    fontSize: 14,
    fontWeight: "600",
  },
  imagePlaceholder: {
    width: "100%",
    height: 280,
    backgroundColor: COLORS.sandBeige,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.lightText,
  },
  detailsContainer: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  badgeContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgePublic: {
    backgroundColor: COLORS.green,
  },
  badgePrivate: {
    backgroundColor: COLORS.desertOrange,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  descriptionCard: {
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.sandBeige,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.sandBeige,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.sandBeige,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.darkSandBrown,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.sandBeige,
    marginVertical: 8,
    marginLeft: 52,
  },
  editForm: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkSandBrown,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  categoryButton: {
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
  },
  categoryButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  categoryButtonTextPlaceholder: {
    color: COLORS.lightText,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  switchHint: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.sandBeige,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: COLORS.darkSandBrown,
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.desertOrange,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: COLORS.red,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBeige,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.darkSandBrown,
  },
  modalCloseButton: {
    padding: 4,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBeige,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.offWhiteDesert,
  },
  categoryItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  categoryItemTextSelected: {
    color: COLORS.desertOrange,
    fontWeight: "600",
  },
});

export default PinDetailPage;
