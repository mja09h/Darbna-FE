import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CreditCardInput from "./CreditCardInput";
import { upgradeToPremium, updateCardInfo } from "../api/subscriptions";
import {
  UpgradeRequest,
  UpdateCardRequest,
  BillingAddress,
} from "../types/subscription";
import {
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  getCardType,
} from "../utils/cardValidation";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useAlert } from "../context/AlertContext";

interface UpgradeToPremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isUpdating?: boolean; // If true, this is for updating existing card
  existingCardData?: {
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    billingAddress: BillingAddress;
  };
}

const UpgradeToPremiumModal: React.FC<UpgradeToPremiumModalProps> = ({
  visible,
  onClose,
  onSuccess,
  isUpdating = false,
  existingCardData,
}) => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { alert } = useAlert();

  const [cardNumber, setCardNumber] = useState(
    existingCardData?.cardNumber || ""
  );
  const [cardHolderName, setCardHolderName] = useState(
    existingCardData?.cardHolderName || ""
  );
  const [expiryMonth, setExpiryMonth] = useState(
    existingCardData?.expiryMonth || 0
  );
  const [expiryYear, setExpiryYear] = useState(
    existingCardData?.expiryYear || 0
  );
  const [cvv, setCVV] = useState("");
  const [billingAddress, setBillingAddress] = useState<BillingAddress>(
    existingCardData?.billingAddress || {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    }
  );

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
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cleanedCardNumber = cardNumber.replace(/\s+/g, "");

      if (isUpdating) {
        const updateData: UpdateCardRequest = {
          cardNumber: cleanedCardNumber,
          cardHolderName: cardHolderName.trim(),
          expiryMonth,
          expiryYear,
          cvv,
          billingAddress,
        };
        await updateCardInfo(updateData);
        alert(
          t.common.success,
          t.subscription?.cardUpdatedSuccess ||
            "Card information updated successfully"
        );
      } else {
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
      }

      // Reset form
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
      setErrors({});

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        t.subscription?.upgradeFailed ||
        "Failed to process request. Please try again.";
      alert(t.common.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setCardNumber(existingCardData?.cardNumber || "");
      setCardHolderName(existingCardData?.cardHolderName || "");
      setExpiryMonth(existingCardData?.expiryMonth || 0);
      setExpiryYear(existingCardData?.expiryYear || 0);
      setCVV("");
      setBillingAddress(
        existingCardData?.billingAddress || {
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
        }
      );
      setErrors({});
      onClose();
    }
  };

  // Debug log
  React.useEffect(() => {
    if (visible) {
      console.log("UpgradeToPremiumModal is now visible");
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isUpdating
                ? t.subscription?.updateCard || "Update Card"
                : t.subscription?.upgradeToPremium || "Upgrade to Premium"}
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

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
              onCardNumberChange={setCardNumber}
              onCardHolderChange={setCardHolderName}
              onExpiryMonthChange={setExpiryMonth}
              onExpiryYearChange={setExpiryYear}
              onCVVChange={setCVV}
              onBillingAddressChange={setBillingAddress}
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
                <Text style={styles.submitButtonText}>
                  {isUpdating
                    ? t.common.save || "Save"
                    : t.subscription?.upgrade || "Upgrade to Premium"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UpgradeToPremiumModal;
