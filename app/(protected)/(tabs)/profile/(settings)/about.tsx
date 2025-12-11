import { StyleSheet, Text, View, ScrollView } from "react-native";
import React from "react";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";

const AboutScreen = () => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t.settings.about}
        </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
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
