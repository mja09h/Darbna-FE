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
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { updateUser } from "../../../../api/user";
import { getCountries } from "../../../../data/Countries";
import CustomAlert, { AlertButton } from "../../../../components/CustomAlert";
import * as ImagePicker from "expo-image-picker";

const EditProfile = () => {
  // --- Hooks ---
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const { user, updateUserState } = useAuth();

  // --- Data ---
  // Get localized countries list
  const countries = getCountries(language as "en" | "ar");

  // --- Local State ---
  // Form fields
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
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

  // --- Handlers ---
  const pickImage = async () => {
    // Request permissions
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
      // Construct Data URI
      const base64 = `data:${
        result.assets[0].mimeType || "image/jpeg"
      };base64,${result.assets[0].base64}`;
      setBase64Image(base64);
    }
  };

  const handleSave = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const updateData: any = {
        name,
        bio,
        phone,
        country,
      };

      if (base64Image) {
        updateData.profilePicture = base64Image;
      }

      const updatedUser = await updateUser(user._id, updateData);

      console.log("Updated user from API:", updatedUser);

      // Update local context
      updateUserState(updatedUser);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.profile.editProfile}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}
            >
              {t.common.save}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Image Picker */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
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
              <Ionicons name="camera" size={16} color={colors.primaryLight} />
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

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t.profile.phone}
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
            value={phone}
            onChangeText={setPhone}
            placeholder={t.profile.phone}
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
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

      {/* Country Selection Modal */}
      <Modal
        visible={isCountryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
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
              <Text style={{ color: colors.primary, fontSize: 16 }}>
                {t.common.cancel}
              </Text>
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
                  backgroundColor: colors.surface,
                  color: colors.text,
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
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>

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

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff", // or background color to create a cut-out effect
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  modalContainer: {
    flex: 1,
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
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 15,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    top: 27,
    left: 25,
    zIndex: 1,
  },
  searchInput: {
    padding: 10,
    paddingLeft: 40,
    borderRadius: 10,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  countryItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countryText: {
    fontSize: 16,
  },
});
