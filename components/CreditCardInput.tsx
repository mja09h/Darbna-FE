import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { 
  formatCardNumber,
  getCardType,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  CardType,
  formatExpiryDate,
} from "../utils/cardValidation";
import { BillingAddress } from "../types/subscription";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 220; // Reduced height for more compact card

interface CreditCardInputProps {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  billingAddress: BillingAddress;
  cardType?: CardType; // Allow manual selection
  onCardNumberChange: (value: string) => void;
  onCardHolderChange: (value: string) => void;
  onExpiryMonthChange: (value: number) => void;
  onExpiryYearChange: (value: number) => void;
  onCVVChange: (value: string) => void;
  onBillingAddressChange: (address: BillingAddress) => void;
  onCardTypeChange?: (type: CardType) => void;
  errors?: {
    cardNumber?: string;
    cardHolderName?: string;
    expiryDate?: string;
    cvv?: string;
    billingAddress?: string;
  };
}

const CreditCardInput: React.FC<CreditCardInputProps> = ({
  cardNumber,
  cardHolderName,
  expiryMonth,
  expiryYear,
  cvv,
  billingAddress,
  cardType: propCardType,
  onCardNumberChange,
  onCardHolderChange,
  onExpiryMonthChange,
  onExpiryYearChange,
  onCVVChange,
  onBillingAddressChange,
  onCardTypeChange,
  errors,
}) => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [internalCardType, setInternalCardType] = useState<CardType>("Visa");
  const [showCardTypePicker, setShowCardTypePicker] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [monthInput, setMonthInput] = useState("");
  const [yearInput, setYearInput] = useState("");
  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);

  // Use prop cardType if provided, otherwise use internal state
  const cardType = propCardType || internalCardType;

  useEffect(() => {
    // Auto-detect card type from card number and update design
    if (cardNumber) {
      const detectedType = getCardType(cardNumber);
      if (detectedType !== "Unknown") {
        // If no manual selection, auto-detect
        if (!propCardType) {
          setInternalCardType(detectedType);
          onCardTypeChange?.(detectedType);
        }
      }
    }
  }, [cardNumber, propCardType]);

  useEffect(() => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 180 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    onCardNumberChange(formatted);
  };

  const handleCVVFocus = () => {
    setIsFlipped(true);
  };

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    opacity: frontOpacity,
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    opacity: backOpacity,
  };

  const getCardTypeColors = () => {
    switch (cardType) {
      case "Visa":
        return {
          primary: "#1A1F71",
          secondary: "#1434CB",
          gradient: ["#1A1F71", "#1434CB", "#0D2A9E"],
        };
      case "Mastercard":
        return {
          primary: "#EB001B",
          secondary: "#F79E1B",
          gradient: ["#EB001B", "#F79E1B", "#FF6B35"],
        };
      case "Amex":
        return {
          primary: "#006FCF",
          secondary: "#00A8E8",
          gradient: ["#006FCF", "#00A8E8", "#0096D6"],
        };
      case "Discover":
        return {
          primary: "#FF6000",
          secondary: "#FF8C42",
          gradient: ["#FF6000", "#FF8C42", "#FF7A2E"],
        };
      default:
        return {
          primary: "#2c120c",
          secondary: "#3d1a0f",
          gradient: ["#2c120c", "#3d1a0f", "#4d2412"],
        };
    }
  };

  const cardColors = getCardTypeColors();

  const renderCardLogo = () => {
    switch (cardType) {
      case "Visa":
        return (
          <View style={styles.visaLogo}>
            <Text style={styles.visaText}>VISA</Text>
          </View>
        );
      case "Mastercard":
        return (
          <View style={styles.mastercardLogo}>
            <View style={styles.mastercardCircle1} />
            <View style={styles.mastercardCircle2} />
          </View>
        );
      case "Amex":
        return (
          <View style={styles.amexLogo}>
            <Text style={styles.amexText}>AMEX</Text>
          </View>
        );
      case "Discover":
        return (
          <View style={styles.discoverLogo}>
            <View style={styles.discoverCircle} />
            <Text style={styles.discoverText}>DISCOVER</Text>
          </View>
        );
      default:
        return <Ionicons name="card-outline" size={40} color="#fff" />;
    }
  };

  const handleCardTypeSelect = (type: CardType) => {
    setInternalCardType(type);
    onCardTypeChange?.(type);
    setShowCardTypePicker(false);
  };

  const cardTypes: CardType[] = ["Visa", "Mastercard", "Amex", "Discover"];

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

  return (
    <View style={styles.container}>
      {/* Card Type Selector */}
      <View style={styles.cardTypeSelector}>
        <Text style={[styles.cardTypeLabel, { color: colors.text }]}>
          {t.subscription?.selectCardType || "Card Type"}
        </Text>
        <TouchableOpacity
          style={[
            styles.selectButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowCardTypePicker(true)}
        >
          <Text style={[styles.selectButtonText, { color: colors.text }]}>
            {cardType}
          </Text>
          <Ionicons
            name={showCardTypePicker ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Dropdown Modal */}
        <Modal
          visible={showCardTypePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCardTypePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCardTypePicker(false)}
          >
            <View
              style={[
                styles.dropdownContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <FlatList
                data={cardTypes}
                keyExtractor={(item) => item}
                renderItem={({ item: type }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      {
                        backgroundColor:
                          cardType === type
                            ? cardColors.primary
                            : "transparent",
                      },
                    ]}
                    onPress={() => handleCardTypeSelect(type)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          color: cardType === type ? "#fff" : colors.text,
                          fontWeight: cardType === type ? "600" : "400",
                        },
                      ]}
                    >
                      {type}
                    </Text>
                    {cardType === type && (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        {/* Front of Card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            { backgroundColor: cardColors.primary },
            frontAnimatedStyle,
          ]}
        >
          <View style={styles.cardContent}>
            {/* Background Pattern/Gradient */}
            <View
              style={[
                styles.cardBackgroundPattern,
                {
                  backgroundColor: cardColors.secondary,
                  opacity: 0.15,
                },
              ]}
            />

            {/* Subtle gradient overlay */}
            <View
              style={[
                styles.gradientOverlay,
                {
                  backgroundColor: cardColors.secondary,
                  opacity: 0.2,
                },
              ]}
            />

            {/* Top Section: Chip and Logo */}
            <View style={styles.cardTopSection}>
              {/* Chip */}
              <View style={styles.chipContainer}>
                <View style={styles.chip}>
                  {/* EMV Chip Contacts */}
                  <View style={styles.chipContacts}>
                    <View style={styles.chipContactRow}>
                      <View style={styles.chipContact} />
                      <View style={styles.chipContact} />
                      <View style={styles.chipContact} />
                    </View>
                    <View style={styles.chipContactRow}>
                      <View style={styles.chipContact} />
                      <View style={styles.chipContact} />
                      <View style={styles.chipContact} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Card Type Logo */}
              <View style={styles.cardLogoContainer}>{renderCardLogo()}</View>
            </View>

            {/* Card Number - Large and Prominent */}
            <View style={styles.cardNumberContainer}>
              <TextInput
                style={styles.cardNumberInput}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                placeholder={
                  t.subscription?.cardNumber || "0000 0000 0000 0000"
                }
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
                maxLength={19}
                returnKeyType="next"
              />
            </View>

            {/* Bottom Section: Cardholder Name and Expiry */}
            <View style={styles.cardBottomSection}>
              {/* Cardholder Name */}
              <View style={styles.cardHolderContainer}>
                <Text style={styles.cardLabel}>
                  {t.subscription?.cardHolderName || "CARDHOLDER NAME"}
                </Text>
                <TextInput
                  style={styles.cardHolderInput}
                  value={cardHolderName}
                  onChangeText={onCardHolderChange}
                  placeholder={t.subscription?.cardHolderName || "JOHN DOE"}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              </View>

              {/* Expiry Date */}
              <View style={styles.expiryContainer}>
                <Text style={styles.cardLabel}>
                  {t.subscription?.expiryDate || "EXPIRES"}
                </Text>
                <View style={styles.monthYearContainer}>
                  <TextInput
                    ref={monthInputRef}
                    style={styles.expiryInput}
                    value={monthInput}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, "");
                      setMonthInput(cleaned);

                      if (cleaned === "") {
                        onExpiryMonthChange(0);
                        return;
                      }

                      const num = parseInt(cleaned, 10);
                      if (!isNaN(num) && num >= 0) {
                        if (cleaned.length === 1) {
                          // Single digit: 0-9
                          onExpiryMonthChange(num);
                        } else if (cleaned.length === 2) {
                          // Two digits: 00-99, validate month
                          if (num >= 1 && num <= 12) {
                            // Valid month: 01-12
                            onExpiryMonthChange(num);
                          } else if (num > 12 && num < 20) {
                            // 13-19: use first digit
                            onExpiryMonthChange(Math.floor(num / 10));
                            setMonthInput(Math.floor(num / 10).toString());
                          } else if (num >= 20 && num <= 99) {
                            // 20-99: use first digit
                            onExpiryMonthChange(Math.floor(num / 10));
                            setMonthInput(Math.floor(num / 10).toString());
                          } else if (num === 0) {
                            // Allow "00" to stay as 0
                            onExpiryMonthChange(0);
                          }
                        }
                      }
                    }}
                    placeholder="MM"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    maxLength={2}
                    selectTextOnFocus={false}
                  />
                  <Text style={styles.expirySeparator}>/</Text>
                  <TextInput
                    ref={yearInputRef}
                    style={styles.expiryInput}
                    value={yearInput}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, "");
                      setYearInput(cleaned);

                      if (cleaned === "") {
                        onExpiryYearChange(0);
                        return;
                      }

                      const num = parseInt(cleaned, 10);
                      if (!isNaN(num) && num >= 0) {
                        if (cleaned.length === 1) {
                          // Single digit: 0-9
                          const fullYear = 2000 + num;
                          onExpiryYearChange(fullYear);
                        } else if (cleaned.length === 2) {
                          // Two digits: 00-99
                          const fullYear = 2000 + (num % 100);
                          onExpiryYearChange(fullYear);
                        }
                      }
                    }}
                    placeholder="YY"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    maxLength={2}
                    selectTextOnFocus={false}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Back of Card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { backgroundColor: cardColors.primary },
            backAnimatedStyle,
          ]}
          pointerEvents={!isFlipped ? "none" : "auto"}
        >
          <View style={styles.cardContent}>
            {/* Gradient Overlay */}
            <View
              style={[
                styles.gradientOverlay,
                {
                  backgroundColor: cardColors.secondary,
                  opacity: 0.3,
                },
              ]}
            />

            {/* Magnetic Strip */}
            <View style={styles.magneticStrip}>
              <View style={styles.magneticStripPattern}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.magneticStripBar,
                      {
                        height: Math.random() * 20 + 10,
                        opacity: 0.6 + Math.random() * 0.4,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* CVV Section */}
            <View style={styles.cvvSection}>
              <View style={styles.cvvLabelContainer}>
                <Text style={styles.cvvLabel}>
                  {t.subscription?.cvv || "CVV"}
                </Text>
              </View>
              <View style={styles.cvvInputContainer}>
                <TextInput
                  style={styles.cvvInput}
                  value={cvv}
                  onChangeText={onCVVChange}
                  placeholder="000"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="numeric"
                  maxLength={cardType === "Amex" ? 4 : 3}
                  onFocus={handleCVVFocus}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Signature Strip */}
            <View style={styles.signatureStrip}>
              <View style={styles.signatureStripPattern}>
                {[...Array(40)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.signatureLine,
                      {
                        width: Math.random() * 30 + 10,
                        opacity: 0.3 + Math.random() * 0.3,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Card Type Logo on Back - Left Side */}
            <View style={styles.cardLogoContainerBack}>{renderCardLogo()}</View>
          </View>
        </Animated.View>
      </View>

      {/* Flip Button */}
      <TouchableOpacity
        style={styles.flipButton}
        onPress={handleCardFlip}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFlipped ? "eye-off" : "eye"}
          size={20}
          color={colors.textSecondary}
        />
        <Text style={[styles.flipButtonText, { color: colors.textSecondary }]}>
          {isFlipped
            ? t.subscription?.showFront || "Show Front"
            : t.subscription?.showBack || "Show Back"}
        </Text>
      </TouchableOpacity>

      {/* Billing Address Fields */}
      <View style={styles.billingContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.subscription?.billingAddress || "Billing Address"}
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
            errors?.billingAddress && styles.inputError,
          ]}
          value={billingAddress.street}
          onChangeText={(text) =>
            onBillingAddressChange({ ...billingAddress, street: text })
          }
          placeholder={t.subscription?.street || "Street Address"}
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              styles.halfInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={billingAddress.city}
            onChangeText={(text) =>
              onBillingAddressChange({ ...billingAddress, city: text })
            }
            placeholder={t.subscription?.city || "City"}
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[
              styles.input,
              styles.halfInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={billingAddress.state}
            onChangeText={(text) =>
              onBillingAddressChange({ ...billingAddress, state: text })
            }
            placeholder={t.subscription?.state || "State"}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              styles.halfInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={billingAddress.zip}
            onChangeText={(text) =>
              onBillingAddressChange({ ...billingAddress, zip: text })
            }
            placeholder={t.subscription?.zip || "ZIP Code"}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
          <TextInput
            style={[
              styles.input,
              styles.halfInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={billingAddress.country}
            onChangeText={(text) =>
              onBillingAddressChange({ ...billingAddress, country: text })
            }
            placeholder={t.subscription?.country || "Country"}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Error Messages */}
      {errors && (
        <View style={styles.errorsContainer}>
          {errors.cardNumber && (
            <Text style={styles.errorText}>{errors.cardNumber}</Text>
          )}
          {errors.cardHolderName && (
            <Text style={styles.errorText}>{errors.cardHolderName}</Text>
          )}
          {errors.expiryDate && (
            <Text style={styles.errorText}>{errors.expiryDate}</Text>
          )}
          {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
          {errors.billingAddress && (
            <Text style={styles.errorText}>{errors.billingAddress}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  cardTypeSelector: {
    width: "100%",
    marginBottom: 20,
  },
  cardTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    width: "80%",
    maxWidth: 300,
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dropdownItemText: {
    fontSize: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 30,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    overflow: "hidden",
  },
  cardFront: {
    backgroundColor: "#2c120c",
  },
  cardBack: {
    backgroundColor: "#2c120c",
  },
  cardContent: {
    flex: 1,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 18,
    justifyContent: "space-between",
    position: "relative",
  },
  cardBackgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  cardTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    zIndex: 1,
  },
  chipContainer: {
    alignItems: "flex-start",
  },
  chip: {
    width: 50,
    height: 40,
    backgroundColor: "#FFD700",
    borderRadius: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipContacts: {
    flex: 1,
    padding: 6,
    justifyContent: "space-between",
  },
  chipContactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  chipContact: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 2,
  },
  cardNumberContainer: {
    marginTop: 6,
    marginBottom: 8,
    zIndex: 1,
  },
  cardNumberInput: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    fontFamily: "monospace",
  },
  cardBottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 1,
    marginTop: 10,
  },
  cardHolderContainer: {
    flex: 1,
    marginRight: 12,
    minWidth: 0, // Allow flex to shrink
  },
  cardLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.8,
    marginBottom: 2,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  cardHolderInput: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
  },
  expiryContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
    marginLeft: 12, /////////////// 12
  },
  monthYearContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  expiryInput: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
    minWidth: 30,
    width: 34,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  expirySeparator: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
    marginHorizontal: 2,
  },
  cardLogoContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  // Visa Logo
  visaLogo: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  visaText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1F71",
    letterSpacing: 2,
  },
  // Mastercard Logo
  mastercardLogo: {
    width: 50,
    height: 32,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  mastercardCircle1: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EB001B",
    left: 0,
    opacity: 0.9,
  },
  mastercardCircle2: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F79E1B",
    right: 0,
    opacity: 0.9,
  },
  // Amex Logo
  amexLogo: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  amexText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#006FCF",
    letterSpacing: 1.5,
  },
  // Discover Logo
  discoverLogo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    gap: 4,
  },
  discoverCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6000",
  },
  discoverText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.5,
  },
  magneticStrip: {
    width: "100%",
    height: 60,
    backgroundColor: "#000",
    marginTop: 20,
    borderRadius: 0,
    overflow: "hidden",
    zIndex: 1,
  },
  magneticStripPattern: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 2,
  },
  magneticStripBar: {
    width: 1.5,
    backgroundColor: "#fff",
    borderRadius: 0.5,
  },
  cvvSection: {
    marginTop: 20,
    alignItems: "flex-end",
    zIndex: 1,
  },
  cvvLabelContainer: {
    marginBottom: 8,
  },
  cvvLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  cvvInputContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cvvInput: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 3,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: "monospace",
  },
  signatureStrip: {
    marginTop: 20,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
    zIndex: 1,
  },
  signatureStripPattern: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 8,
    gap: 4,
  },
  signatureLine: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
  },
  cardLogoContainerBack: {
    position: "absolute",
    bottom: 24,
    left: 24,
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 4,
  },
  flipButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  flipButtonText: {
    fontSize: 14,
  },
  billingContainer: {
    width: "100%",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorsContainer: {
    width: "100%",
    marginTop: 12,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginBottom: 4,
  },
});

export default CreditCardInput;
