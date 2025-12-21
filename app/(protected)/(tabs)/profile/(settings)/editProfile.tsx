import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  Image,
  StatusBar,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { useAuth } from "../../../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { updateUser } from "../../../../../api/user";
import { getCountries } from "../../../../../data/Countries";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../../../../../api";

const HEADER_BG_COLOR = "#2c120c";

const EditProfileSettings = () => {
  // --- Hooks ---
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const { user, updateUserState } = useAuth();

  // --- Data ---
  const countries = getCountries(language as "en" | "ar");

  // --- Local State ---
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [country, setCountry] = useState(user?.country || "");
  const [profileImage, setProfileImage] = useState(
    user?.profilePicture || null
  );
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: "success" | "error" | "warning" | "info";
  }>({ title: "", message: "" });

  // --- Helpers ---
  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get full image URL from relative path
  const getProfileImageUri = (
    profilePicture: string | null | undefined
  ): string | null => {
    if (!profilePicture) return null;

    // If already a full URL, return as is
    if (
      profilePicture.startsWith("http://") ||
      profilePicture.startsWith("https://")
    ) {
      return profilePicture;
    }

    // If it's a local file URI (from image picker), return as is
    if (
      profilePicture.startsWith("file://") ||
      profilePicture.startsWith("content://")
    ) {
      return profilePicture;
    }

    // Otherwise, construct full URL from backend
    const baseUrl = BASE_URL.replace("/api", "");
    return `${baseUrl}${
      profilePicture.startsWith("/") ? "" : "/"
    }${profilePicture}`;
  };

  // Get the display image URI (use selected image or user's existing profile picture)
  const displayImageUri =
    profileImage || getProfileImageUri(user?.profilePicture);

  // --- Handlers ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        t.common.error,
        "Sorry, we need camera roll permissions to make this work!",
        "error"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setBase64Image(result.assets[0] as any);
    }
  };

  const handleSave = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const updateData: any = {};

      if (name && name !== user.name) {
        updateData.name = name;
      }
      if (bio && bio !== user.bio) {
        updateData.bio = bio;
      }
      if (country && country !== user.country) {
        updateData.country = country;
      }
      if (base64Image) {
        // We pass the full asset object or uri, let the api/user.ts handle formatting for FormData
        updateData.profilePicture = {
          uri: profileImage, // Use the URI from state
          fileName: "profile.jpg", // Default name
          type: "image/jpeg",
        };
      }

      // Only call API if there are changes
      if (Object.keys(updateData).length === 0) {
        showAlert(t.common.error, "No changes to save", "error", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
        setLoading(false);
        return;
      }

      const updatedUser = await updateUser(user._id, updateData);

      // Update local context
      updateUserState(updatedUser.data || updatedUser);

      showAlert(t.common.success, t.profile.profileUpdated, "success", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert(t.common.error, t.profile.updateFailed, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderCountryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.countryItem, { borderBottomColor: colors.border }]}
      onPress={() => {
        setCountry(item);
        setIsCountryModalVisible(false);
      }}
    >
      <Text style={[styles.countryText, { color: colors.text }]}>{item}</Text>
      {country === item && (
        <Ionicons name="checkmark" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  // --- Render ---
  return (
    <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={28}
            color="#f5e6d3"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile.editProfile}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#f5e6d3" />
          ) : (
            <Text style={{ color: "#f5e6d3", fontWeight: "600", fontSize: 16 }}>
              {t.common.save}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Image Picker */}
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
              {displayImageUri ? (
                <Image
                  source={{ uri: displayImageUri }}
                  style={styles.profileImage}
                  onError={(error) => {
                    console.log("Error loading profile image:", error);
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.placeholderImage,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={40}
                    color={colors.textSecondary}
                  />
                </View>
              )}
              <View
                style={[
                  styles.editIconContainer,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>
              Change Profile Photo
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.fullName}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  textAlign: isRTL ? "right" : "left",
                  backgroundColor: colors.surface,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder={t.profile.fullName}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Country Selection */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.country}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
              onPress={() => setIsCountryModalVisible(true)}
            >
              <Text
                style={{ color: country ? colors.text : colors.textSecondary }}
              >
                {country || t.auth.selectCountry}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Bio Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.bio}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  textAlign: isRTL ? "right" : "left",
                  backgroundColor: colors.surface,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder={t.profile.bio}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>

      {/* Country Selection Modal */}
      <Modal
        visible={isCountryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.auth.selectCountry}
              </Text>
              <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                placeholder={t.auth.searchCountry}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item}
              style={styles.countryList}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default EditProfileSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  imageWrapper: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#ad5410",
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ad5410",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchIcon: {
    position: "absolute",
    left: 36,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  countryText: {
    fontSize: 16,
  },
});
