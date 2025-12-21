import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../../../api";

const HEADER_BG_COLOR = "#2c120c";

const ProfileScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();

  const handleSettingsPress = () => {
    router.push("/(protected)/(tabs)/profile/(settings)");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to get full image URL from relative path
  const getProfileImageUri = (
    profilePicture: string | undefined
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

  const profileImageUri = getProfileImageUri(user?.profilePicture);

  return (
    <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.tabs.profile}</Text>

        {/* Settings Icon - Top Right */}
        <TouchableOpacity
          style={styles.settingsIconButton}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
        >
          <View style={styles.settingsButtonContainer}>
            <Ionicons name="settings-outline" size={22} color="#ad5410" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.avatar}
                onError={(error) => {
                  console.log("Error loading profile image:", error);
                }}
              />
            ) : (
              <Ionicons name="person" size={48} color="#ad5410" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>{user?.name || "Guest User"}</Text>
            <Text style={styles.usernameText}>
              @{user?.username || "guest"}
            </Text>
            {user?.isVerified === false && (
              <View style={styles.verificationBadge}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.verificationText}>
                  {t.profile.emailNotVerified}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Content Section */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Bio */}
          {user?.bio ? (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                {t.profile.bio}
              </Text>
              <Text style={[styles.bioText, { color: colors.text }]}>
                {user.bio}
              </Text>
            </View>
          ) : null}
          {/* Details */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.detailRow}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {user?.email}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {user?.phone || t.profile.noPhone}
              </Text>
            </View>

            {user?.country && (
              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {user.country}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {t.profile.memberSince}{" "}
                {user?.createdAt ? formatDate(user.createdAt) : ""}
              </Text>
            </View>
          </View>
          {/* // Saved Routes Link */}
          {/* // saved route in the profile page */}
          {/* Saved Routes Link */}
          {/* saved route in the profile page */}
          {/* <TouchableOpacity
            style={[
              styles.settingsButton,
              { backgroundColor: colors.surface, marginBottom: 12 },
            ]}
            onPress={() => router.push("/(protected)/(tabs)/saved")}
          >
            <View style={styles.settingsButtonContent}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.settingsButtonText, { color: colors.text }]}>
                {t.profile.savedRoutes}
              </Text>
            </View>
            <Ionicons
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity> */}
          {/* saved route in the profile page */}
          {/* // saved route in the profile page */}
        </ScrollView>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
  },
  settingsIconButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  settingsButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(245, 230, 211, 0.15)", // Light background with transparency
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(173, 84, 16, 0.3)", // Desert orange border with transparency
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3d2818",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#ad5410",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    alignItems: "center",
  },
  nameText: {
    fontSize: 24,
    color: "#f5e6d3",
    fontWeight: "bold",
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 16,
    color: "#a89080",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  verificationText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    gap: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 16,
  },
  settingsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  settingsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
