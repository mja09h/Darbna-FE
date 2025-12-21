import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import Toast, { ToastType } from "../../components/Toast";
import axios from "axios";

// --- Components ---
import AuthInput from "../../components/AuthInput";
import AuthButton from "../../components/AuthButton";
import CustomAlert from "../../components/CustomAlert";

// --- Types ---
interface FormErrors {
  identifier?: string;
  password?: string;
}

const Login = () => {
  // --- Hooks ---
  const router = useRouter();
  const { t } = useLanguage();
  const { login, isLoading } = useAuth();

  // --- Local State ---
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // --- Toast State ---
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("error");

  // --- Debug Alert State ---
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");

  const showToast = (message: string, type: ToastType = "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // --- Validation Helpers ---

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateIdentifier = (value: string): string | undefined => {
    const trimmed = value.trim();

    if (!trimmed) {
      return t.auth.emailRequired;
    }

    // If it contains @, validate as email to give specific feedback
    if (trimmed.includes("@")) {
      if (!isValidEmail(trimmed)) {
        return t.auth.emailInvalid;
      }
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

    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const identifierError = validateIdentifier(emailOrUsername);
    if (identifierError) {
      newErrors.identifier = identifierError;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Event Handlers ---

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      // Ensure password doesn't have accidental leading/trailing whitespace
      // but preserve intentional spaces in the middle
      const trimmedPassword = password.trim();

      // Normalize identifier: trim and lowercase if it's an email
      let normalizedIdentifier = emailOrUsername.trim();
      if (normalizedIdentifier.includes("@")) {
        // It's an email, convert to lowercase
        normalizedIdentifier = normalizedIdentifier.toLowerCase();
      }

      // Log for debugging
      if (__DEV__) {
        console.log("🔐 Attempting login with:", {
          originalIdentifier: emailOrUsername,
          normalizedIdentifier: normalizedIdentifier,
          identifierLength: normalizedIdentifier.length,
          passwordLength: trimmedPassword.length,
          originalPasswordLength: password.length,
          passwordHasWhitespace: password !== trimmedPassword,
          isEmail: normalizedIdentifier.includes("@"),
        });
      }

      await login(normalizedIdentifier, trimmedPassword);
    } catch (error: any) {
      let errorMessage = t.auth.loginFailed;

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 500) {
          const debugInfo = {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
          };
          setDebugMessage(JSON.stringify(debugInfo, null, 2));
          setDebugVisible(true);
          return;
        }

        if (error.response?.status === 401 || error.response?.status === 400) {
          // Try to get the actual error message from the backend
          const backendMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.response?.data?.msg;

          if (backendMessage) {
            errorMessage = backendMessage;
          } else {
            errorMessage = t.auth.invalidCredentials;
          }
        } else if (!error.response) {
          errorMessage = t.auth.networkError;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      // Log the full error for debugging
      if (__DEV__) {
        console.error("❌ Login failed:", {
          errorMessage,
          error: error?.response?.data || error?.message,
        });
      }

      showToast(errorMessage, "error");
    }
  };

  const handleIdentifierChange = (text: string) => {
    setEmailOrUsername(text.trim());
    if (errors.identifier) {
      const error = validateIdentifier(text.trim());
      setErrors((prev) => ({ ...prev, identifier: error }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      const error = validatePassword(text);
      setErrors((prev) => ({ ...prev, password: error }));
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

      <CustomAlert
        visible={debugVisible}
        title="Server Error (500)"
        message={debugMessage}
        type="error"
        scrollable
        monospace
        onDismiss={() => setDebugVisible(false)}
        buttons={[
          {
            text: "Close",
            style: "cancel",
            onPress: () => setDebugVisible(false),
          },
        ]}
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

          <Text style={styles.title}>{t.auth.welcomeBack}</Text>
          <Text style={styles.subtitle}>{t.auth.signInToContinue}</Text>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Email/Username Input */}
            <AuthInput
              placeholder={t.auth.emailOrUsername}
              value={emailOrUsername}
              onChangeText={handleIdentifierChange}
              onBlur={() => {
                if (emailOrUsername) {
                  const error = validateIdentifier(emailOrUsername);
                  setErrors((prev) => ({ ...prev, identifier: error }));
                }
              }}
              error={errors.identifier}
              isLoading={isLoading}
              autoCapitalize="none"
              autoCorrect={false}
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

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/(auth)/forgotPassword")}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                {t.auth.forgotPassword}
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <AuthButton
              title={t.auth.login}
              loadingTitle={t.auth.loggingIn}
              onPress={handleLogin}
              isLoading={isLoading}
            />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>{t.auth.noAccount}</Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              disabled={isLoading}
            >
              <Text style={styles.signUpLink}>{t.auth.signUp}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;

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
    width: 180,
    height: 180,
    borderRadius: 180,
    marginBottom: 20,
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
    marginBottom: 30,
  },
  formContainer: {
    width: "100%",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#ad5410",
    fontSize: 14,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 35,
    marginBottom: 25,
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
  signUpContainer: {
    flexDirection: "row",
    marginTop: 35,
    alignItems: "center",
    gap: 6,
  },
  signUpText: {
    color: "#a89080",
    fontSize: 15,
  },
  signUpLink: {
    color: "#ad5410",
    fontSize: 15,
    fontWeight: "bold",
  },
});
