import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const HEADER_BG_COLOR = "#2c120c";

const index = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();

  const handleSettingsPress = () => {
    router.push("/(protected)/(tabs)/profile/(settings)");
  };

  return (
    <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.tabs.profile}</Text>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color="#ad5410" />
        </View>
        <Text style={styles.welcomeText}>name</Text>
      </View>

      {/* Content Section */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.primary }]}
          onPress={handleSettingsPress}
        >
          <View style={styles.settingsButtonContent}>
            <Ionicons name="settings-outline" size={22} color="#f5e6d3" />
            <Text style={styles.settingsButtonText}>{t.settings.title}</Text>
          </View>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={22}
            color="#f5e6d3"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ad5410",
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
    alignSelf: "center",
  },
  welcomeText: {
    fontSize: 18,
    color: "#f5e6d3",
    fontWeight: "500",
    alignSelf: "center",
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
  },
  settingsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  settingsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f5e6d3",
  },
});
