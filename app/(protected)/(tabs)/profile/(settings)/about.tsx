import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";

const AboutScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            {isRTL ? "→" : "←"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.settings.about}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.content, { color: colors.text }]}>
          Welcome to Darbna, your trusted companion for exploring and navigating
          your journey. Our mission is to provide you with the best experience
          as you discover new places and create lasting memories.
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          Darbna is designed to help you find your way, connect with
          communities, and make the most of your adventures. We are committed to
          providing a seamless and intuitive experience for all our users.
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
