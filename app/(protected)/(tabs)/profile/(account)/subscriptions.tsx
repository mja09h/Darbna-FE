import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const SubscriptionsScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          My Subscriptions
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: colors.text }]}>
              Free Plan
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </View>
          <Text style={[styles.planPrice, { color: colors.text }]}>
            $0.00{" "}
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              / month
            </Text>
          </Text>

          <View style={styles.divider} />

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Basic Map Access
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Community Access
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Save 5 Locations
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SubscriptionsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginBottom: 20,
  },
  features: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 16,
  },
  upgradeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
