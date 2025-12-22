import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { useAuth } from "../../../../../context/AuthContext";
import { useAlert } from "../../../../../context/AlertContext";
import { Ionicons } from "@expo/vector-icons";
import {
  getSubscriptionStatus,
  downgradeToFree,
} from "../../../../../api/subscriptions";
import { SubscriptionStatusResponse } from "../../../../../types/subscription";
import { maskCardNumber } from "../../../../../utils/cardValidation";
import UpgradeToPremiumModal from "../../../../../components/UpgradeToPremiumModal";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";

const HEADER_BG_COLOR = "#2c120c";

const SubscriptionsScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { user, updateUserState } = useAuth();
  const { alert } = useAlert();

  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateCardModal, setShowUpdateCardModal] = useState(false);
  const [showDowngradeAlert, setShowDowngradeAlert] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  // Refresh subscription status when screen comes into focus (e.g., returning from upgrade page)
  useFocusEffect(
    React.useCallback(() => {
      fetchSubscriptionStatus();
    }, [])
  );

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionStatus();
      setSubscriptionData(data);

      // Update user state with subscription data
      if (user) {
        updateUserState({
          ...user,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionStatus: data.subscriptionStatus,
          cardInfo: data.cardInfo,
          subscriptionStartDate: data.subscriptionStartDate,
          subscriptionEndDate: data.subscriptionEndDate,
        });
      }
    } catch (error: any) {
      console.error("Error fetching subscription status:", error);
      // If API fails, use user state as fallback instead of defaulting to free
      if (user?.subscriptionPlan) {
        setSubscriptionData({
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus || "active",
          cardInfo: user.cardInfo,
          subscriptionStartDate: user.subscriptionStartDate,
          subscriptionEndDate: user.subscriptionEndDate,
        });
      } else {
        // Only default to free if user state also doesn't have subscription info
        setSubscriptionData({
          subscriptionPlan: "free",
          subscriptionStatus: "active",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    try {
      setLoading(true);
      await downgradeToFree();
      await fetchSubscriptionStatus();
      alert(
        t.common.success,
        t.subscription?.downgradeSuccess ||
          "Successfully downgraded to Free plan"
      );
      setShowDowngradeAlert(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        t.subscription?.downgradeFailed ||
        "Failed to downgrade. Please try again.";
      alert(t.common.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check both subscriptionData (from API) and user state (fallback)
  const isPremium =
    (subscriptionData?.subscriptionPlan === "premium" ||
      user?.subscriptionPlan === "premium") &&
    (subscriptionData?.subscriptionStatus === "active" ||
      user?.subscriptionStatus === "active");

  // Ensure we show upgrade button for free users even if API fails
  const showUpgradeButton = !isPremium && subscriptionData !== null;

  const freeFeatures = [
    t.subscription?.freeFeature1 || "Record unlimited routes",
    t.subscription?.freeFeature2 || "Save up to 5 offline maps",
    t.subscription?.freeFeature3 || "Basic community features",
    t.subscription?.freeFeature4 || "Create and share pins",
  ];

  const premiumFeatures = [
    t.subscription?.premiumFeature1 || "Unlimited offline maps",
    t.subscription?.premiumFeature2 || "Advanced route planning",
    t.subscription?.premiumFeature3 || "Priority support",
    t.subscription?.premiumFeature4 || "Enhanced map features",
    t.subscription?.premiumFeature5 || "Unlimited pin creation",
    t.subscription?.premiumFeature6 || "Export routes in multiple formats",
  ];

  if (loading && !subscriptionData) {
    return (
      <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

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
          {/* Email Verification Warning */}
          {!user?.isVerified && (
            <View
              style={[
                styles.verificationWarning,
                {
                  backgroundColor: "#FFF3CD",
                  borderColor: "#FFC107",
                },
              ]}
            >
              <Ionicons name="alert-circle" size={24} color="#FF9800" />
              <View style={styles.verificationWarningContent}>
                <Text
                  style={[
                    styles.verificationWarningTitle,
                    { color: "#856404" },
                  ]}
                >
                  {t.subscription?.emailVerificationRequiredTitle ||
                    "Email Verification Required"}
                </Text>
                <Text
                  style={[styles.verificationWarningText, { color: "#856404" }]}
                >
                  {t.subscription?.emailVerificationRequiredMessage ||
                    "Please verify your email address to upgrade to Premium or manage your subscription."}
                </Text>
                <TouchableOpacity
                  style={styles.verifyEmailButton}
                  onPress={() =>
                    router.push(
                      "/(protected)/(tabs)/profile/(account)/verifyEmail"
                    )
                  }
                >
                  <Text style={styles.verifyEmailButtonText}>
                    {t.profile?.verifyEmail || "Verify Email"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Current Plan Card */}
          <View
            style={[
              styles.planCard,
              {
                backgroundColor: isPremium ? "#C46F26" : colors.primary,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>
                {isPremium
                  ? t.subscription?.premiumPlan || "Premium Plan"
                  : t.subscription?.freePlan || "Free Plan"}
              </Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>
                  {subscriptionData?.subscriptionStatus === "active"
                    ? t.subscription?.active || "Active"
                    : t.subscription?.cancelled || "Cancelled"}
                </Text>
              </View>
            </View>
            <Text style={styles.planPrice}>
              {isPremium
                ? t.subscription?.premiumPrice || "Premium"
                : "$0 / month"}
            </Text>
            <Text style={styles.planDescription}>
              {isPremium
                ? t.subscription?.premiumDescription ||
                  "Access to all premium features and unlimited resources."
                : t.subscription?.freeDescription ||
                  "Basic features for exploring and recording routes."}
            </Text>
          </View>

          {/* Card Info (Premium Only) */}
          {isPremium && subscriptionData?.cardInfo && (
            <View
              style={[
                styles.cardInfoContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardInfoHeader}>
                <Ionicons name="card" size={24} color={colors.primary} />
                <Text style={[styles.cardInfoTitle, { color: colors.text }]}>
                  {t.subscription?.cardInfo || "Card Information"}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text
                  style={[
                    styles.cardInfoLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t.subscription?.cardNumber || "Card Number"}
                </Text>
                <Text style={[styles.cardInfoValue, { color: colors.text }]}>
                  {maskCardNumber(subscriptionData.cardInfo.cardNumber)}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text
                  style={[
                    styles.cardInfoLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t.subscription?.cardHolderName || "Cardholder"}
                </Text>
                <Text style={[styles.cardInfoValue, { color: colors.text }]}>
                  {subscriptionData.cardInfo.cardHolderName}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text
                  style={[
                    styles.cardInfoLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t.subscription?.expiryDate || "Expiry"}
                </Text>
                <Text style={[styles.cardInfoValue, { color: colors.text }]}>
                  {subscriptionData.cardInfo.expiryMonth
                    .toString()
                    .padStart(2, "0")}
                  /{subscriptionData.cardInfo.expiryYear.toString().slice(-2)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.updateCardButton,
                  {
                    borderColor: user?.isVerified
                      ? colors.border
                      : colors.textSecondary,
                    opacity: user?.isVerified ? 1 : 0.6,
                  },
                ]}
                onPress={() => {
                  if (!user?.isVerified) {
                    alert(
                      t.common.error,
                      t.profile?.emailVerificationRequired ||
                        "Please verify your email address before managing payment information"
                    );
                    return;
                  }
                  setShowUpdateCardModal(true);
                }}
                disabled={!user?.isVerified}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.updateCardText, { color: colors.primary }]}
                >
                  {t.subscription?.updateCard || "Update Card"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginBottom: 16 },
              ]}
            >
              {t.subscription?.currentPlanFeatures || "Current Plan Features"}
            </Text>
            {(isPremium ? premiumFeatures : freeFeatures).map(
              (feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    {feature}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Action Buttons */}
          {showUpgradeButton ? (
            <TouchableOpacity
              style={[
                styles.upgradeButton,
                {
                  backgroundColor: user?.isVerified
                    ? colors.primary
                    : colors.textSecondary,
                  opacity: user?.isVerified ? 1 : 0.6,
                },
              ]}
              onPress={() => {
                if (!user?.isVerified) {
                  alert(
                    t.common.error,
                    t.subscription?.emailVerificationRequired ||
                      "Please verify your email address before upgrading to Premium"
                  );
                  return;
                }
                router.push("/(protected)/(tabs)/profile/(account)/upgrade");
              }}
              disabled={loading || !user?.isVerified}
            >
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.upgradeButtonText}>
                {t.subscription?.upgradeToPremium || "Upgrade to Premium"}
              </Text>
            </TouchableOpacity>
          ) : isPremium ? (
            <TouchableOpacity
              style={[styles.downgradeButton, { borderColor: colors.border }]}
              onPress={() => setShowDowngradeAlert(true)}
              disabled={loading}
            >
              <Ionicons
                name="arrow-down-circle-outline"
                size={20}
                color="#FF3B30"
              />
              <Text style={[styles.downgradeButtonText, { color: "#FF3B30" }]}>
                {t.subscription?.downgradeToFree || "Downgrade to Free"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

      {/* Update Card Modal */}
      {isPremium && subscriptionData?.cardInfo && (
        <UpgradeToPremiumModal
          visible={showUpdateCardModal}
          onClose={() => setShowUpdateCardModal(false)}
          onSuccess={fetchSubscriptionStatus}
          isUpdating={true}
          existingCardData={{
            cardNumber: subscriptionData.cardInfo.cardNumber,
            cardHolderName: subscriptionData.cardInfo.cardHolderName,
            expiryMonth: subscriptionData.cardInfo.expiryMonth,
            expiryYear: subscriptionData.cardInfo.expiryYear,
            billingAddress: subscriptionData.cardInfo.billingAddress,
          }}
        />
      )}

      {/* Downgrade Confirmation Alert */}
      <CustomAlert
        visible={showDowngradeAlert}
        title={t.subscription?.downgradeConfirm || "Downgrade to Free?"}
        message={
          t.subscription?.downgradeConfirmMessage ||
          "Are you sure you want to downgrade to the Free plan? You will lose access to Premium features."
        }
        type="warning"
        buttons={[
          {
            text: t.common.cancel || "Cancel",
            style: "cancel",
            onPress: () => setShowDowngradeAlert(false),
          },
          {
            text: t.subscription?.downgrade || "Downgrade",
            style: "destructive",
            onPress: handleDowngrade,
          },
        ]}
        onDismiss={() => setShowDowngradeAlert(false)}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfoContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  cardInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardInfoLabel: {
    fontSize: 14,
  },
  cardInfoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  updateCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  updateCardText: {
    fontSize: 14,
    fontWeight: "600",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  downgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    gap: 8,
  },
  downgradeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  verificationWarning: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  verificationWarningContent: {
    flex: 1,
    gap: 8,
  },
  verificationWarningTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  verificationWarningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  verifyEmailButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FF9800",
    marginTop: 4,
  },
  verifyEmailButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
