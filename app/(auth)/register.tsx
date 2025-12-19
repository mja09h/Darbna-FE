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
// import { getCountries } from "../../data/Countries";
import Toast, { ToastType } from "../../components/Toast";
import CustomAlert, { AlertButton } from "../../components/CustomAlert";
import axios from "axios";
import { useAppleAuth } from "../../hooks/useAppleAuth";
import { requestVerificationCode } from "../../api/auth";

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
  phone?: string;
}

const Register = () => {
  // --- Hooks ---
  const router = useRouter();
  const { t, language } = useLanguage();
  const { register, appleLogin, isLoading, updateUserState } = useAuth();

  // --- Local State ---
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [oauthLoading, setOauthLoading] = useState<"apple" | null>(null);

  // --- Toast State ---
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("error");

  // --- Alert State ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: "success" | "error" | "warning" | "info";
  }>({ title: "", message: "" });

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

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
  // const countries = getCountries(language);
  // const filteredCountries = countries.filter((country) =>
  //   country.toLowerCase().includes(countrySearch.toLowerCase())
  // );

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

    if (value.length < 8) {
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

  const validatePhone = (value: string): string | undefined => {
    if (!value) {
      return t.auth.phoneRequired || "Phone number is required";
    }
    // Basic phone validation (can be improved)
    if (value.length < 5) {
      return t.auth.phoneTooShort || "Phone number is too short";
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

    const phoneError = validatePhone(phone);
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Event Handlers ---

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const user = await register(
        name.trim(),
        username.trim(),
        email.trim(),
        password,
        phone.trim()
      );

      // New backend flow: registration does not send email automatically
      // Request a verification code right after successful registration
      try {
        await requestVerificationCode(email.trim());
      } catch (e) {
        // If sending fails (e.g. mail server issue), still proceed to app
        // and let the user request again from the Email screen
        if (__DEV__) console.error("Request verification code failed:", e);
      }

      // Show verification email alert
      showAlert(t.auth.checkEmail, t.auth.verificationSent, "success", [
        {
          text: "OK",
          onPress: () => {
            setAlertVisible(false);
            // Update user state which triggers the redirect to home via AuthContext
            updateUserState(user);
          },
          style: "default",
        },
      ]);
    } catch (error) {
      let errorMessage = t.auth.registerFailed;

      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.response?.data?.msg;

        if (backendMessage) {
          errorMessage = Array.isArray(backendMessage)
            ? backendMessage.join(", ")
            : backendMessage;
        } else if (error.response?.status === 400) {
          errorMessage = t.auth.userExists;
        } else if (!error.response) {
          errorMessage = t.auth.networkError;
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

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (errors.phone) {
      const error = validatePhone(text);
      setErrors((prev) => ({ ...prev, phone: error }));
    }
  };

  // --- Render ---
  return (
    <View style={styles.wrapper}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={() => setAlertVisible(false)}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
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
              icon="person-outline"
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
              icon="at-outline"
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
              icon="mail-outline"
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
              icon="lock-closed-outline"
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
              icon="lock-closed-outline"
            />

            {/* Phone Input */}
            <AuthInput
              placeholder={t.auth.phone || "Phone Number"}
              value={phone}
              onChangeText={handlePhoneChange}
              onBlur={() => {
                if (phone) {
                  const error = validatePhone(phone);
                  setErrors((prev) => ({ ...prev, phone: error }));
                }
              }}
              error={errors.phone}
              isLoading={isLoading}
              keyboardType="phone-pad"
              icon="call-outline"
            />

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
});
