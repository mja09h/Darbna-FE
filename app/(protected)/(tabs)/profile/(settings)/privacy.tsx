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
import { Ionicons } from "@expo/vector-icons";

const PrivacyScreen = () => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

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
          {t.settings.privacyPolicy}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t.settings.privacyPolicy}
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Introduction
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          Darbna ("we," "our," or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and
          safeguard your information when you use our mobile application.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Information We Collect
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          We may collect information about you in a variety of ways. The
          information we may collect via the app includes:
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          • Personal Data: Personally identifiable information, such as your
          name and email address, that you voluntarily give to us when you
          register with the app.
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          • Location Data: We may collect location information if you grant us
          permission to access your device's location services.
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          • Device Information: We may collect information about your mobile
          device, including device ID, operating system, and mobile network
          information.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          How We Use Your Information
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          We use the information we collect to:
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          • Provide, maintain, and improve our services
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          • Send you notifications and updates
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          • Respond to your comments and questions
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          • Monitor and analyze usage patterns
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Data Security
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          We use administrative, technical, and physical security measures to
          help protect your personal information. While we have taken reasonable
          steps to secure the personal information you provide to us, please be
          aware that despite our efforts, no security measures are perfect or
          impenetrable.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Rights
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          You have the right to access, update, or delete your personal
          information at any time. You can also opt out of certain data
          collection practices by adjusting your device settings.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Changes to This Privacy Policy
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page and
          updating the "Last updated" date.
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          If you have any questions about this Privacy Policy, please contact us
          through the app or via email.
        </Text>
      </ScrollView>
    </View>
  );
};

export default PrivacyScreen;

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
