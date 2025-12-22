import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAlert } from "../context/AlertContext";
import { CreatePinData } from "../types/map";

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

// Format category name for display (capitalize and replace underscores)
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
};

interface PinCreationModalProps {
  visible: boolean;
  location: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onCreate: (pinData: CreatePinData) => Promise<void>;
}

const PinCreationModal: React.FC<PinCreationModalProps> = ({
  visible,
  location,
  onClose,
  onCreate,
}) => {
  const { alert } = useAlert();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const MAX_IMAGES = 4;
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);

  const takePhoto = async () => {
    setShowImageSourceModal(false);

    // Check if we've reached the max
    if (images.length >= MAX_IMAGES) {
      alert(
        "Maximum Images",
        `You can only add up to ${MAX_IMAGES} images per pin.`
      );
      return;
    }

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert(
        "Permission Required",
        "Sorry, we need camera permissions to take photos!"
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImage = result.assets[0];
      if (newImage.uri) {
        setImages([...images, newImage]);
      } else {
        alert("Error", "Failed to capture image");
      }
    }
  };

  const pickImage = async () => {
    setShowImageSourceModal(false);

    // Check if we've reached the max
    if (images.length >= MAX_IMAGES) {
      alert(
        "Maximum Images",
        `You can only add up to ${MAX_IMAGES} images per pin.`
      );
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert(
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
      allowsEditing: false, // Disable editing for multiple selection
      allowsMultipleSelection: allowsMultipleSelection,
      quality: 0.8,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Add new images to existing ones, but don't exceed MAX_IMAGES
      const newImages = result.assets
        .slice(0, remainingSlots)
        .filter((asset) => asset.uri); // Ensure all images have URIs

      if (newImages.length > 0) {
        setImages([...images, ...newImages]);
      } else {
        alert("Error", "No valid images were selected");
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Error", "Please enter a title");
      return;
    }
    if (!category) {
      alert("Error", "Please select a category");
      return;
    }
    if (!location) {
      alert("Error", "Location is required");
      return;
    }

    setLoading(true);
    try {
      const pinData: CreatePinData = {
        title: title.trim(),
        category: category,
        isPublic,
        location,
      };

      // Add optional fields only if they exist
      if (description.trim()) {
        pinData.description = description.trim();
      }
      if (images.length > 0) {
        pinData.images = images;
      }

      await onCreate(pinData);
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setIsPublic(true);
      setImages([]);
      onClose();
      alert("Success", "Pin created successfully!");
    } catch (error: any) {
      alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create pin. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setDescription("");
      setCategory("");
      setIsPublic(true);
      setImages([]);
      onClose();
    }
  };

  // Debug log
  useEffect(() => {
    console.log("📍 PinCreationModal visible:", visible, "location:", location);
  }, [visible, location]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Pin</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Images Picker - Optional (up to 4 images) */}
            <View style={styles.imagesSection}>
              <Text style={styles.label}>
                Images (optional) - {images.length}/{MAX_IMAGES}
              </Text>

              {/* Display selected images */}
              {images.length > 0 && (
                <View style={styles.imagesGrid}>
                  {images.map((img, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image
                        source={{ uri: img.uri }}
                        style={styles.selectedImage}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                        disabled={loading}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={COLORS.white}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add image button */}
              {images.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => setShowImageSourceModal(true)}
                  disabled={loading}
                >
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="add-circle-outline"
                      size={48}
                      color={COLORS.desertOrange}
                    />
                    <Text style={styles.imagePlaceholderText}>
                      {images.length === 0
                        ? "Tap to add images (optional)"
                        : `Add more images (${
                            MAX_IMAGES - images.length
                          } remaining)`}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pin title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={COLORS.lightText}
                editable={!loading}
              />
            </View>

            {/* Description Input - Optional */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter description"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                placeholderTextColor={COLORS.lightText}
                editable={!loading}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryModal(true)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categorySelectorText,
                    !category && styles.categoryPlaceholder,
                  ]}
                >
                  {category ? formatCategoryName(category) : "Select category"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.lightText}
                />
              </TouchableOpacity>
            </View>

            {/* Public/Private Toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.label}>Public Pin</Text>
                <Text style={styles.toggleDescription}>
                  {isPublic ? "Visible to all users" : "Only visible to you"}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={loading}
                trackColor={{ false: COLORS.sandBeige, true: COLORS.green }}
                thumbColor={COLORS.white}
              />
            </View>

            {/* Location Info */}
            {location && (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color={COLORS.lightText} />
                <Text style={styles.locationText}>
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.createButtonText}>Create Pin</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
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

      {/* Image Source Selection Modal */}
      <Modal
        visible={showImageSourceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageSourceModal(false)}
      >
        <TouchableOpacity
          style={styles.sourceModalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageSourceModal(false)}
        >
          <View style={styles.sourceModalContent}>
            <Text style={styles.sourceModalTitle}>Select Image Source</Text>

            <TouchableOpacity
              style={styles.sourceOption}
              onPress={takePhoto}
              disabled={loading}
            >
              <Ionicons name="camera" size={32} color={COLORS.desertOrange} />
              <Text style={styles.sourceOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sourceOption}
              onPress={pickImage}
              disabled={loading}
            >
              <Ionicons name="images" size={32} color={COLORS.desertOrange} />
              <Text style={styles.sourceOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sourceCancelButton}
              onPress={() => setShowImageSourceModal(false)}
            >
              <Text style={styles.sourceCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBeige,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
  },
  scrollView: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  imagesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.offWhiteDesert,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.sandBeige,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: COLORS.lightText,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkSandBrown,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.offWhiteDesert,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 10,
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.lightText,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.sandBeige,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
  },
  createButton: {
    backgroundColor: COLORS.desertOrange,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  categorySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.offWhiteDesert,
  },
  categorySelectorText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryPlaceholder: {
    color: COLORS.lightText,
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  categoryModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  categoryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBeige,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  sourceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sourceModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxWidth: 300,
  },
  sourceModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    marginBottom: 20,
    textAlign: "center",
  },
  sourceOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.offWhiteDesert,
    marginBottom: 12,
  },
  sourceOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkSandBrown,
    marginLeft: 16,
  },
  sourceCancelButton: {
    marginTop: 8,
    padding: 12,
    alignItems: "center",
  },
  sourceCancelText: {
    fontSize: 16,
    color: COLORS.lightText,
    fontWeight: "600",
  },
});

export default PinCreationModal;
