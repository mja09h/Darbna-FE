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
  Linking,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMap } from "../../../../context/MapContext";
import { useAuth } from "../../../../context/AuthContext";
import { IPinnedPlace, CreatePinData } from "../../../../types/map";
import { getPinById } from "../../../../api/pins";
import { BASE_URL } from "../../../../api/index";
import { getUserById } from "../../../../api/user";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null);

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
        setCurrentImageIndex(0); // Reset image index
        setCreatorUsername(null); // Reset creator username

        // First try to get from context
        const pinFromContext = pinnedPlaces.find((p) => p._id === pinId);
        let pinData: IPinnedPlace;

        if (pinFromContext) {
          pinData = pinFromContext;
        } else {
          // If not in context, fetch from API
          pinData = await getPinById(pinId);
        }

        setPin(pinData);
        setTitle(pinData.title);
        setDescription(pinData.description || "");
        setCategory(pinData.category);
        setIsPublic(pinData.isPublic);

        // Handle userId - check if it's a string (ID) or object (populated)
        if (typeof pinData.userId === "string") {
          // userId is just an ID string, fetch user data
          try {
            const userData = await getUserById(pinData.userId);
            setCreatorUsername(userData.username);
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Keep creatorUsername as null, will show "Unknown"
          }
        } else if (
          pinData.userId &&
          typeof pinData.userId === "object" &&
          pinData.userId.username
        ) {
          // userId is already populated with username
          setCreatorUsername(pinData.userId.username);
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

  // Open directions in Google Maps
  const openDirections = () => {
    if (!pin || !pin.location || !pin.location.coordinates) {
      Alert.alert("Error", "Location information is not available");
      return;
    }

    const latitude = pin.location.coordinates[1];
    const longitude = pin.location.coordinates[0];

    // Google Maps URL scheme
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&directionsmode=driving`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });

    // Fallback to web URL if native app is not available
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            return Linking.openURL(webUrl);
          }
        })
        .catch((err) => {
          console.error("Error opening maps:", err);
          // Fallback to web URL
          Linking.openURL(webUrl).catch((err) => {
            Alert.alert("Error", "Could not open maps application");
            console.error("Error opening web maps:", err);
          });
        });
    } else {
      // Fallback to web URL
      Linking.openURL(webUrl).catch((err) => {
        Alert.alert("Error", "Could not open maps application");
        console.error("Error opening web maps:", err);
      });
    }
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
          activeOpacity={0.8}
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
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Pin Details</Text>
          </View>
          {isOwner && !isEditing && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={22} color={COLORS.white} />
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
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={COLORS.white} />
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
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="close-circle"
                            size={22}
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
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={36}
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
                  <View style={styles.imageCarouselContainer}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.imagesScrollView}
                      contentContainerStyle={styles.imagesScrollContent}
                      onMomentumScrollEnd={(event) => {
                        const index = Math.round(
                          event.nativeEvent.contentOffset.x /
                            Dimensions.get("window").width
                        );
                        setCurrentImageIndex(index);
                      }}
                    >
                      {imageUris.map((uri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                          <Image
                            source={{ uri }}
                            style={styles.image}
                            resizeMode="cover"
                            onError={(error) => {
                              console.error("Image load error:", error);
                            }}
                          />
                        </View>
                      ))}
                    </ScrollView>
                    {imageUris.length > 1 && (
                      <View style={styles.imageIndicators}>
                        {imageUris.map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.indicator,
                              index === currentImageIndex &&
                                styles.indicatorActive,
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={72}
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
                  activeOpacity={0.7}
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
                  activeOpacity={0.8}
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
                  activeOpacity={0.8}
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
                    <Ionicons name="pricetag" size={22} color={COLORS.white} />
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
                    <Ionicons name="person" size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Created by</Text>
                    <Text style={styles.infoText}>
                      {creatorUsername ||
                        (typeof pin.userId === "object" && pin.userId?.username
                          ? pin.userId.username
                          : "Unknown")}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar" size={22} color={COLORS.white} />
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

              {/* Directions Button */}
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={openDirections}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={22} color={COLORS.white} />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>

              {isOwner && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.8}
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
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={22} color={COLORS.text} />
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
                    activeOpacity={0.7}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 17,
    color: COLORS.text,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 20,
    color: COLORS.red,
    marginBottom: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: COLORS.desertOrange,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.darkSandBrown,
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerButton: {
    padding: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  imagesSection: {
    width: "100%",
    marginBottom: 24,
  },
  imageCarouselContainer: {
    position: "relative",
    width: "100%",
  },
  imagesScrollView: {
    width: "100%",
    height: 360,
  },
  imagesScrollContent: {
    alignItems: "center",
  },
  imageWrapper: {
    width: Dimensions.get("window").width,
    height: 360,
    backgroundColor: COLORS.sandBeige,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    gap: 8,
    paddingVertical: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  indicatorActive: {
    backgroundColor: COLORS.white,
    width: 24,
  },
  imageItem: {
    position: "relative",
    marginRight: 16,
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(244, 67, 54, 0.9)",
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addImageButton: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.desertOrange,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addImageButtonText: {
    color: COLORS.desertOrange,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  imagePlaceholder: {
    width: "100%",
    height: 360,
    backgroundColor: COLORS.sandBeige,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 0,
  },
  imagePlaceholderText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.lightText,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  detailsContainer: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.darkSandBrown,
    marginBottom: 14,
    letterSpacing: 0.2,
    lineHeight: 38,
  },
  badgeContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  badgePublic: {
    backgroundColor: COLORS.green,
  },
  badgePrivate: {
    backgroundColor: COLORS.desertOrange,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  descriptionCard: {
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  description: {
    fontSize: 17,
    color: COLORS.text,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  infoCard: {
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.desertOrange,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.lightText,
    marginBottom: 6,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 17,
    color: COLORS.darkSandBrown,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.sandBeige,
    marginVertical: 12,
    marginLeft: 64,
    borderRadius: 1,
  },
  editForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.sandBeige,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  categoryButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: COLORS.sandBeige,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
  categoryButtonTextPlaceholder: {
    color: COLORS.lightText,
    fontWeight: "400",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 4,
  },
  switchHint: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 6,
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.sandBeige,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cancelButtonText: {
    color: COLORS.darkSandBrown,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.desertOrange,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: COLORS.desertOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    elevation: 1,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  directionsButton: {
    backgroundColor: COLORS.desertOrange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
    gap: 10,
    elevation: 3,
    shadowColor: COLORS.desertOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  directionsButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  deleteButton: {
    backgroundColor: COLORS.red,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
    elevation: 3,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingBottom: 40,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.sandBeige,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.offWhiteDesert,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBeige,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.offWhiteDesert,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.desertOrange,
  },
  categoryItemText: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: "500",
  },
  categoryItemTextSelected: {
    color: COLORS.desertOrange,
    fontWeight: "700",
  },
});

export default PinDetailPage;
