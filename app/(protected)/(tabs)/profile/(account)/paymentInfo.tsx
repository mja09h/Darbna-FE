import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CreditCardInput from "../../../../../components/CreditCardInput";
import {
  updateCardInfo,
  deleteCardInfo,
  getSubscriptionStatus,
} from "../../../../../api/subscriptions";
import {
  UpdateCardRequest,
  BillingAddress,
} from "../../../../../types/subscription";
import {
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  getCardType,
  CardType,
} from "../../../../../utils/cardValidation";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { useAlert } from "../../../../../context/AlertContext";
import { useAuth } from "../../../../../context/AuthContext";
import { maskCardNumber } from "../../../../../utils/cardValidation";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";

const HEADER_BG_COLOR = "#2c120c";

const PaymentInfoScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { alert } = useAlert();
  const { user, updateUserState } = useAuth();

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState(0);
  const [expiryYear, setExpiryYear] = useState(0);
  const [cvv, setCVV] = useState("");
  const [cardType, setCardType] = useState<CardType>("Visa");
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const [errors, setErrors] = useState<{
    cardNumber?: string;
    cardHolderName?: string;
    expiryDate?: string;
    cvv?: string;
    billingAddress?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load existing payment info if available
  useEffect(() => {
    if (user?.cardInfo) {
      const cardInfo = user.cardInfo;
      // Card number is masked, so we'll leave it empty for editing
      setCardNumber("");
      setCardHolderName(cardInfo.cardHolderName || "");
      setExpiryMonth(cardInfo.expiryMonth || 0);
      setExpiryYear(cardInfo.expiryYear || 0);
      setCVV("");
      setCardType((cardInfo.cardType as CardType) || "Visa");
      setBillingAddress(
        cardInfo.billingAddress || {
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
        }
      );
    }
  }, [user?.cardInfo]);

  // Prevent editing if email is not verified
  useEffect(() => {
    if (isEditing && !user?.isVerified) {
      setIsEditing(false);
      alert(
        t.common.error,
        t.profile?.emailVerificationRequired ||
          "Please verify your email address before adding payment information"
      );
    }
  }, [user?.isVerified, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate card number
    const cleanedCardNumber = cardNumber.replace(/\s+/g, "");
    if (!cleanedCardNumber) {
      newErrors.cardNumber =
        t.subscription?.cardNumberRequired || "Card number is required";
    } else if (!validateCardNumber(cleanedCardNumber)) {
      newErrors.cardNumber =
        t.subscription?.cardNumberInvalid || "Invalid card number";
    }

    // Validate cardholder name
    if (!cardHolderName.trim()) {
      newErrors.cardHolderName =
        t.subscription?.cardHolderNameRequired || "Cardholder name is required";
    }

    // Validate expiry date
    if (!expiryMonth || !expiryYear) {
      newErrors.expiryDate =
        t.subscription?.expiryDateRequired || "Expiry date is required";
    } else if (!validateExpiryDate(expiryMonth, expiryYear)) {
      newErrors.expiryDate =
        t.subscription?.expiryDateInvalid || "Invalid or expired date";
    }

    // Validate CVV
    const detectedCardType = getCardType(cardNumber);
    if (!cvv) {
      newErrors.cvv = t.subscription?.cvvRequired || "CVV is required";
    } else if (!validateCVV(cvv, detectedCardType)) {
      newErrors.cvv = t.subscription?.cvvInvalid || "Invalid CVV";
    }

    // Validate billing address
    if (
      !billingAddress.street.trim() ||
      !billingAddress.city.trim() ||
      !billingAddress.state.trim() ||
      !billingAddress.zip.trim() ||
      !billingAddress.country.trim()
    ) {
      newErrors.billingAddress =
        t.subscription?.billingAddressRequired ||
        "All billing address fields are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const refreshPaymentInfo = async () => {
    try {
      const subscriptionData = await getSubscriptionStatus();
      if (subscriptionData.cardInfo && user) {
        updateUserState({
          ...user,
          cardInfo: subscriptionData.cardInfo,
        });
      } else if (!subscriptionData.cardInfo && user) {
        // Clear card info if it was deleted
        updateUserState({
          ...user,
          cardInfo: undefined,
        });
      }
    } catch (error) {
      console.error("Error refreshing payment info:", error);
    }
  };

  const handleSave = async () => {
    // Check email verification
    if (!user?.isVerified) {
      alert(
        t.common.error,
        t.profile?.emailVerificationRequired ||
          "Please verify your email address before adding payment information"
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cleanedCardNumber = cardNumber.replace(/\s+/g, "");

      const updateData: UpdateCardRequest = {
        cardNumber: cleanedCardNumber,
        cardHolderName: cardHolderName.trim(),
        expiryMonth,
        expiryYear,
        cvv,
        billingAddress,
      };

      await updateCardInfo(updateData);

      // Refresh payment info from server
      await refreshPaymentInfo();

      alert(
        t.common.success,
        t.profile?.paymentInfoUpdated ||
          "Payment information updated successfully"
      );

      setIsEditing(false);
    } catch (error: any) {
      // Handle 403 Forbidden (email not verified)
      if (error.response?.status === 403) {
        alert(
          t.common.error,
          error.response?.data?.message ||
            t.profile?.emailVerificationRequired ||
            "Please verify your email address before adding payment information"
        );
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        t.profile?.paymentInfoUpdateFailed ||
        "Failed to update payment information. Please try again.";
      alert(t.common.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async () => {
    // Check email verification
    if (!user?.isVerified) {
      alert(
        t.common.error,
        t.profile?.emailVerificationRequired ||
          "Please verify your email address before managing payment information"
      );
      setShowDeleteAlert(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await deleteCardInfo();

      if (response.success && user) {
        // Refresh payment info from server to ensure consistency
        await refreshPaymentInfo();

        // Reset form fields
        setCardNumber("");
        setCardHolderName("");
        setExpiryMonth(0);
        setExpiryYear(0);
        setCVV("");
        setBillingAddress({
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
        });

        alert(
          t.common.success,
          t.profile?.paymentInfoDeleted ||
            "Card information deleted successfully"
        );
        setShowDeleteAlert(false);
        setIsEditing(false);
      } else {
        alert(
          t.common.error,
          response.message ||
            t.profile?.paymentInfoDeleteFailed ||
            "Failed to delete card information"
        );
      }
    } catch (error: any) {
      // Handle 403 Forbidden (email not verified)
      if (error.response?.status === 403) {
        alert(
          t.common.error,
          error.response?.data?.message ||
            t.profile?.emailVerificationRequired ||
            "Please verify your email address before managing payment information"
        );
        setShowDeleteAlert(false);
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        t.profile?.paymentInfoDeleteFailed ||
        "Failed to delete card information. Please try again.";
      alert(t.common.error, errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasCardInfo = user?.cardInfo && user.cardInfo.cardNumber;

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
        <Text style={styles.headerTitle}>
          {t.profile?.paymentInfo || "Payment Information"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View
          style={[
            styles.contentWrapper,
            { backgroundColor: colors.background },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await refreshPaymentInfo();
                  setRefreshing(false);
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
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
                    {t.profile?.emailVerificationRequiredTitle ||
                      "Email Verification Required"}
                  </Text>
                  <Text
                    style={[
                      styles.verificationWarningText,
                      { color: "#856404" },
                    ]}
                  >
                    {t.profile?.emailVerificationRequiredMessage ||
                      "Please verify your email address to add or manage payment information."}
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

            {/* Existing Payment Info Display */}
            {hasCardInfo && !isEditing && (
              <View
                style={[
                  styles.infoContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.infoHeader}>
                  <Ionicons name="card" size={24} color={colors.primary} />
                  <Text style={[styles.infoTitle, { color: colors.text }]}>
                    {t.subscription?.cardInfo || "Card Information"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    {t.subscription?.cardNumber || "Card Number"}
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {user.cardInfo?.cardNumber?.includes("*")
                      ? user.cardInfo.cardNumber
                      : maskCardNumber(user.cardInfo?.cardNumber || "")}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    {t.subscription?.cardHolderName || "Cardholder Name"}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      styles.cardHolderValue,
                      { color: colors.text },
                    ]}
                  >
                    {user.cardInfo?.cardHolderName || ""}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    {t.subscription?.expiryDate || "Expiry Date"}
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {user.cardInfo?.expiryMonth && user.cardInfo?.expiryYear
                      ? `${user.cardInfo.expiryMonth
                          .toString()
                          .padStart(2, "0")}/${user.cardInfo.expiryYear
                          .toString()
                          .slice(-2)}`
                      : ""}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    {t.subscription?.selectCardType || "Card Type"}
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {user.cardInfo?.cardType || ""}
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t.subscription?.billingAddress || "Billing Address"}
                  </Text>
                  {user.cardInfo?.billingAddress && (
                    <View style={styles.addressContainer}>
                      <Text
                        style={[styles.addressText, { color: colors.text }]}
                      >
                        {user.cardInfo.billingAddress.street}
                      </Text>
                      <Text
                        style={[styles.addressText, { color: colors.text }]}
                      >
                        {user.cardInfo.billingAddress.city},{" "}
                        {user.cardInfo.billingAddress.state}{" "}
                        {user.cardInfo.billingAddress.zip}
                      </Text>
                      <Text
                        style={[styles.addressText, { color: colors.text }]}
                      >
                        {user.cardInfo.billingAddress.country}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.editButton,
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
                          t.profile?.emailVerificationRequired ||
                            "Please verify your email address before editing payment information"
                        );
                        return;
                      }
                      setIsEditing(true);
                    }}
                    disabled={!user?.isVerified}
                  >
                    <Ionicons name="pencil" size={20} color="#fff" />
                    <Text style={styles.editButtonText}>
                      {t.common?.edit || "Edit"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      {
                        borderColor: user?.isVerified
                          ? "#FF3B30"
                          : colors.border,
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
                      setShowDeleteAlert(true);
                    }}
                    disabled={!user?.isVerified}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={
                        user?.isVerified ? "#FF3B30" : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.deleteButtonText,
                        {
                          color: user?.isVerified
                            ? "#FF3B30"
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {t.profile?.deletePaymentInfo || "Delete Card"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* No Payment Info State */}
            {!hasCardInfo && !isEditing && (
              <View
                style={[
                  styles.emptyContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t.profile?.noPaymentInfo || "No Payment Information"}
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Add your payment information to manage your account.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addButton,
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
                        t.profile?.emailVerificationRequired ||
                          "Please verify your email address before adding payment information"
                      );
                      return;
                    }
                    setIsEditing(true);
                  }}
                  disabled={!user?.isVerified}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>
                    {t.profile?.addPaymentInfo || "Add Payment Information"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Edit Mode - Credit Card Input */}
            {isEditing && user?.isVerified && (
              <>
                {/* Disclaimer */}
                <View
                  style={[
                    styles.disclaimerContainer,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.disclaimerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t.subscription?.noPaymentDisclaimer ||
                      "No payment will be charged. Card data is collected for account verification only."}
                  </Text>
                </View>

                {/* Credit Card Input */}
                <CreditCardInput
                  cardNumber={cardNumber}
                  cardHolderName={cardHolderName}
                  expiryMonth={expiryMonth}
                  expiryYear={expiryYear}
                  cvv={cvv}
                  billingAddress={billingAddress}
                  cardType={cardType}
                  onCardNumberChange={setCardNumber}
                  onCardHolderChange={setCardHolderName}
                  onExpiryMonthChange={setExpiryMonth}
                  onExpiryYearChange={setExpiryYear}
                  onCVVChange={setCVV}
                  onBillingAddressChange={setBillingAddress}
                  onCardTypeChange={setCardType}
                  errors={errors}
                />

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { backgroundColor: colors.primary },
                      loading && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#fff"
                        />
                        <Text style={styles.saveButtonText}>
                          {t.profile?.savePaymentInfo ||
                            "Save Payment Information"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      setIsEditing(false);
                      setErrors({});
                      // Reset form if canceling
                      if (user?.cardInfo) {
                        const cardInfo = user.cardInfo;
                        setCardNumber("");
                        setCardHolderName(cardInfo.cardHolderName || "");
                        setExpiryMonth(cardInfo.expiryMonth || 0);
                        setExpiryYear(cardInfo.expiryYear || 0);
                        setCVV("");
                        setCardType((cardInfo.cardType as CardType) || "Visa");
                        setBillingAddress(
                          cardInfo.billingAddress || {
                            street: "",
                            city: "",
                            state: "",
                            zip: "",
                            country: "",
                          }
                        );
                      }
                    }}
                    disabled={loading}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: colors.text }]}
                    >
                      {t.common.cancel || "Cancel"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        title={
          t.profile?.deletePaymentInfoConfirm || "Delete Card Information?"
        }
        message={
          t.profile?.deletePaymentInfoMessage ||
          "Are you sure you want to delete your card information? This action cannot be undone."
        }
        type="warning"
        buttons={[
          {
            text: t.common.cancel || "Cancel",
            style: "cancel",
            onPress: () => setShowDeleteAlert(false),
          },
          {
            text: t.profile?.deletePaymentInfo || "Delete Card",
            style: "destructive",
            onPress: handleDeleteCard,
          },
        ]}
        onDismiss={() => setShowDeleteAlert(false)}
      />
    </View>
  );
};

export default PaymentInfoScreen;

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
  keyboardView: {
    flex: 1,
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
  infoContainer: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 0,
    minWidth: 100,
    paddingRight: 8,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "left",
    flexWrap: "wrap",
  },
  cardHolderValue: {
    fontSize: 11,
    fontWeight: "500",
  },
  infoSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  addressContainer: {
    gap: 4,
    flex: 1,
  },
  addressText: {
    fontSize: 12,
    flexWrap: "wrap",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
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
  emptyContainer: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
