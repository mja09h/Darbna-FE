import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CreditCardInput from "../../../../../components/CreditCardInput";
import {
  upgradeToPremium,
  updateCardInfo,
} from "../../../../../api/subscriptions";
import {
  UpgradeRequest,
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

const HEADER_BG_COLOR = "#2c120c";

const UpgradeScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { alert } = useAlert();
  const { user } = useAuth();

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
    const cardType = getCardType(cardNumber);
    if (!cvv) {
      newErrors.cvv = t.subscription?.cvvRequired || "CVV is required";
    } else if (!validateCVV(cvv, cardType)) {
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

  const handleSubmit = async () => {
    // Check email verification
    if (!user?.isVerified) {
      alert(
        t.common.error,
        t.subscription?.emailVerificationRequired ||
          "Please verify your email address before upgrading to Premium"
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cleanedCardNumber = cardNumber.replace(/\s+/g, "");

      const upgradeData: UpgradeRequest = {
        cardNumber: cleanedCardNumber,
        cardHolderName: cardHolderName.trim(),
        expiryMonth,
        expiryYear,
        cvv,
        billingAddress,
      };
      await upgradeToPremium(upgradeData);
      alert(
        t.common.success,
        t.subscription?.upgradeSuccess || "Successfully upgraded to Premium!"
      );

      // Navigate back to subscriptions screen
      router.back();
    } catch (error: any) {
      // Handle 403 Forbidden (email not verified)
      if (error.response?.status === 403) {
        alert(
          t.common.error,
          error.response?.data?.message ||
            t.subscription?.emailVerificationRequired ||
            "Please verify your email address before upgrading to Premium"
        );
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        t.subscription?.upgradeFailed ||
        "Failed to process request. Please try again.";
      alert(t.common.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          {t.subscription?.upgradeToPremium || "Upgrade to Premium"}
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
          >
            {/* Disclaimer */}
            <View
              style={[
                styles.disclaimerContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.disclaimerText, { color: colors.textSecondary }]}
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="star" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {t.subscription?.upgrade || "Upgrade to Premium"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default UpgradeScreen;

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
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
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
