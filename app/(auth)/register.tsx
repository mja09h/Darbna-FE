import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { getCountries } from "../../data/Countries";
import Toast, { ToastType } from "../../components/Toast";
import axios from "axios";
import { useAppleAuth } from "../../hooks/useAppleAuth";

// --- Components ---
import AuthInput from "../../components/AuthInput";
import AuthButton from "../../components/AuthButton";
import SocialButton from "../../components/SocialButton";

// --- Types ---
interface FormErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  country?: string;
}

const Register = () => {
  // --- Hooks ---
  const router = useRouter();
  const { t, language } = useLanguage();
  const { register, appleLogin, isLoading } = useAuth();

  // --- Local State ---
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [oauthLoading, setOauthLoading] = useState<"apple" | null>(
    null
  );

  // --- Toast State ---
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("error");

  const showToast = (message: string, type: ToastType = "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // --- OAuth Handlers ---

  // Apple Authentication
  const { signInWithApple, isAvailable: isAppleAvailable } = useAppleAuth({
    onSuccess: async (identityToken, user) => {
      setOauthLoading("apple");
      try {
        await appleLogin({
          identityToken,
          email: user?.email,
          fullName: user?.fullName,
        });
      } catch (error) {
        showToast(t.auth.registerFailed, "error");
      } finally {
        setOauthLoading(null);
      }
    },
    onError: (error) => {
      showToast(error, "error");
    },
  });

  // --- Data & Helpers ---
  const countries = getCountries(language);
  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // --- Validation Helpers ---
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidName = (name: string): boolean => {
    // Allow letters (including Arabic, etc.), spaces, and common name characters
    const nameRegex = /^[\p{L}\s'-]+$/u;
    return nameRegex.test(name);
  };

  const isValidUsername = (username: string): boolean => {
    // Only letters, numbers, and underscores
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
  };

  const hasLetterAndNumber = (password: string): boolean => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
  };

  // Individual field validators
  const validateName = (value: string): string | undefined => {
    const trimmed = value.trim();

    if (!trimmed) {
      return t.auth.nameRequired;
    }

    if (trimmed.length < 2) {
      return t.auth.nameTooShort;
    }

    if (!isValidName(trimmed)) {
      return t.auth.nameInvalid;
    }

    return undefined;
  };

  const validateUsername = (value: string): string | undefined => {
    const trimmed = value.trim();

    if (!trimmed) {
      return t.auth.usernameRequired;
    }

    if (trimmed.includes(" ")) {
      return t.auth.usernameNoSpaces;
    }

    if (trimmed.length < 3) {
      return t.auth.usernameTooShort;
    }

    if (trimmed.length > 20) {
      return t.auth.usernameTooLong;
    }

    if (!isValidUsername(trimmed)) {
      return t.auth.usernameInvalid;
    }

    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    const trimmed = value.trim();

    if (!trimmed) {
      return t.auth.emailRequired;
    }

    if (!isValidEmail(trimmed)) {
      return t.auth.emailInvalid;
    }

    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return t.auth.passwordRequired;
    }

    if (value.length < 6) {
      return t.auth.passwordTooShort;
    }

    if (!hasLetterAndNumber(value)) {
      return t.auth.passwordWeak;
    }

    return undefined;
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) {
      return t.auth.passwordRequired;
    }

    if (value !== password) {
      return t.auth.passwordsDoNotMatch;
    }

    return undefined;
  };

  const validateCountry = (): string | undefined => {
    if (!selectedCountry) {
      return t.auth.countryRequired;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const usernameError = validateUsername(username);
    if (usernameError) newErrors.username = usernameError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    const countryError = validateCountry();
    if (countryError) newErrors.country = countryError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Event Handlers ---

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setCountryModalVisible(false);
    setCountrySearch("");
    if (errors.country) {
      setErrors((prev) => ({ ...prev, country: undefined }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register(
        name.trim(),
        username.trim(),
        email.trim(),
        password,
        selectedCountry
      );
    } catch (error) {
      let errorMessage = t.auth.registerFailed;

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          errorMessage = t.auth.userExists;
        } else if (!error.response) {
          errorMessage = t.auth.networkError;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      showToast(errorMessage, "error");
    }
  };

  // Field change handlers with real-time validation
  const handleNameChange = (text: string) => {
    setName(text);
    if (errors.name) {
      const error = validateName(text);
      setErrors((prev) => ({ ...prev, name: error }));
    }
  };

  const handleUsernameChange = (text: string) => {
    // Remove spaces as user types
    const noSpaces = text.replace(/\s/g, "");
    setUsername(noSpaces);
    if (errors.username) {
      const error = validateUsername(noSpaces);
      setErrors((prev) => ({ ...prev, username: error }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text.trim());
    if (errors.email) {
      const error = validateEmail(text.trim());
      setErrors((prev) => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      const error = validatePassword(text);
      setErrors((prev) => ({ ...prev, password: error }));
    }
    // Also revalidate confirm password if it's filled
    if (confirmPassword && errors.confirmPassword) {
      const confirmError =
        text !== confirmPassword ? t.auth.passwordsDoNotMatch : undefined;
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errors.confirmPassword) {
      const error = text !== password ? t.auth.passwordsDoNotMatch : undefined;
      setErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  };

  // --- Render ---
  return (
    <View style={styles.wrapper}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Image
            source={require("../../assets/darbna-logo.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>{t.auth.createAccount}</Text>
          <Text style={styles.subtitle}>{t.auth.joinUsToday}</Text>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <AuthInput
              placeholder={t.auth.name}
              value={name}
              onChangeText={handleNameChange}
              onBlur={() => {
                if (name) {
                  const error = validateName(name);
                  setErrors((prev) => ({ ...prev, name: error }));
                }
              }}
              error={errors.name}
              isLoading={isLoading}
            />

            {/* Username Input */}
            <AuthInput
              placeholder={t.auth.username}
              value={username}
              onChangeText={handleUsernameChange}
              onBlur={() => {
                if (username) {
                  const error = validateUsername(username);
                  setErrors((prev) => ({ ...prev, username: error }));
                }
              }}
              error={errors.username}
              isLoading={isLoading}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Email Input */}
            <AuthInput
              placeholder={t.auth.email}
              value={email}
              onChangeText={handleEmailChange}
              onBlur={() => {
                if (email) {
                  const error = validateEmail(email);
                  setErrors((prev) => ({ ...prev, email: error }));
                }
              }}
              error={errors.email}
              isLoading={isLoading}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            {/* Password Input */}
            <AuthInput
              placeholder={t.auth.password}
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={() => {
                if (password) {
                  const error = validatePassword(password);
                  setErrors((prev) => ({ ...prev, password: error }));
                }
              }}
              error={errors.password}
              isLoading={isLoading}
              isPassword
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            {/* Confirm Password Input */}
            <AuthInput
              placeholder={t.auth.confirmPassword}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              onBlur={() => {
                if (confirmPassword) {
                  const error = validateConfirmPassword(confirmPassword);
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: error,
                  }));
                }
              }}
              error={errors.confirmPassword}
              isLoading={isLoading}
              isPassword
              showPassword={showConfirmPassword}
              onTogglePassword={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            />

            {/* Country Selector */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={[
                  styles.countrySelector,
                  errors.country && styles.inputError,
                ]}
                onPress={() => setCountryModalVisible(true)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.countrySelectorText,
                    !selectedCountry && styles.countrySelectorPlaceholder,
                  ]}
                >
                  {selectedCountry || t.auth.selectCountry}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#a89080" />
              </TouchableOpacity>
              {errors.country && (
                <Text style={styles.errorText}>{errors.country}</Text>
              )}
            </View>

            {/* Register Button */}
            <AuthButton
              title={t.auth.signUp}
              loadingTitle={t.auth.creatingAccount}
              onPress={handleRegister}
              isLoading={isLoading}
              style={{ marginTop: 10 }}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t.auth.or}</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsColumn}>
            {/* Apple Login */}
            {Platform.OS === "ios" && isAppleAvailable && (
              <SocialButton
                title={t.auth.continueWithApple}
                iconName="logo-apple"
                onPress={signInWithApple}
                isLoading={oauthLoading === "apple"}
                disabled={isLoading || !!oauthLoading}
              />
            )}
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t.auth.haveAccount}</Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>{t.auth.login}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Country Selection Modal */}
        <Modal
          visible={countryModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.auth.selectCountry}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCountryModalVisible(false);
                    setCountrySearch("");
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#a89080" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder={t.auth.searchCountry}
                placeholderTextColor="#a89080"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
              />

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.countryItem,
                      selectedCountry === item && styles.countryItemSelected,
                    ]}
                    onPress={() => handleSelectCountry(item)}
                  >
                    <Text
                      style={[
                        styles.countryItemText,
                        selectedCountry === item &&
                          styles.countryItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {selectedCountry === item && (
                      <Ionicons name="checkmark" size={20} color="#ad5410" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResults}>
                    {t.auth.noCountriesFound}
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#2c120c",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 120,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#ad5410",
    marginTop: 5,
    marginBottom: 25,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 12,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: "#ff6b6b",
  },
  countrySelector: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countrySelectorText: {
    fontSize: 16,
    color: "#f5e6d3",
  },
  countrySelectorPlaceholder: {
    color: "#a89080",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20,
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(168, 144, 128, 0.3)",
  },
  dividerText: {
    color: "#a89080",
    fontSize: 14,
    marginHorizontal: 15,
  },
  socialButtonsColumn: {
    width: "100%",
    gap: 12,
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 25,
    alignItems: "center",
    gap: 6,
  },
  loginText: {
    color: "#a89080",
    fontSize: 15,
  },
  loginLink: {
    color: "#ad5410",
    fontSize: 15,
    fontWeight: "bold",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2c120c",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(168, 144, 128, 0.2)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  modalCloseButton: {
    padding: 4,
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#f5e6d3",
    marginVertical: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  countryItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countryItemSelected: {
    backgroundColor: "rgba(173, 84, 16, 0.2)",
  },
  countryItemText: {
    fontSize: 16,
    color: "#f5e6d3",
  },
  countryItemTextSelected: {
    color: "#ad5410",
    fontWeight: "600",
  },
  noResults: {
    color: "#a89080",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
