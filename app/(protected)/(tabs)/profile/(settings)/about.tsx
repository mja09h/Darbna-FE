import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const HEADER_BG_COLOR = "#2c120c";

const AboutScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();

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
        <Text style={styles.headerTitle}>{t.settings.about}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.content, { color: colors.text }]}>
            Welcome to Darbna, your trusted companion for exploring and
            navigating your journey. Our mission is to provide you with the best
            experience as you discover new places and create lasting memories.
          </Text>
          <Text style={[styles.content, { color: colors.text }]}>
            Darbna is designed to help you find your way, connect with
            communities, and make the most of your adventures. We are committed
            to providing a seamless and intuitive experience for all our users.
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Our Mission
          </Text>
          <Text style={[styles.content, { color: colors.text }]}>
            To empower travelers and explorers with the tools they need to
            navigate confidently and discover amazing places around them.
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Version
          </Text>
          <Text style={[styles.content, { color: colors.textSecondary }]}>
            1.0.0
          </Text>
        </ScrollView>
      </View>
    </View>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  headerSpacer: {
    width: 40,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
});
