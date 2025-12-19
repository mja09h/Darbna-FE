import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const HEADER_BG_COLOR = "#2c120c";

const SubscriptionsScreen = () => {
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
        <Text style={styles.headerTitle}>{t.profile.mySubscriptions}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Current Plan Card */}
          <View style={[styles.planCard, { backgroundColor: colors.primary }]}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Free Plan</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>$0 / month</Text>
            <Text style={styles.planDescription}>
              Basic features for exploring and recording routes.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginBottom: 16 },
              ]}
            >
              Current Plan Features
            </Text>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Record unlimited routes
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Save up to 5 offline maps
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Basic community features
              </Text>
            </View>
          </View>

          {/* Upgrade Banner (Placeholder for future) */}
          <View
            style={[
              styles.upgradeContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="star" size={32} color={colors.primary} />
            <Text style={[styles.upgradeTitle, { color: colors.text }]}>
              Premium Coming Soon
            </Text>
            <Text
              style={[
                styles.upgradeDescription,
                { color: colors.textSecondary },
              ]}
            >
              Get access to advanced route planning, unlimited offline maps, and
              more.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default SubscriptionsScreen;

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
  planCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  activeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  planPrice: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
    fontWeight: "600",
  },
  planDescription: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
  },
  upgradeContainer: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  upgradeDescription: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
