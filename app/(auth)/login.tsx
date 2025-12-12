import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import Toast, { ToastType } from "../../components/Toast";
import axios from "axios";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useAppleAuth, AppleUser } from "../../hooks/useAppleAuth";

interface FormErrors {
  identifier?: string;
  password?: string;
}

const Login = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, googleLogin, appleLogin, isLoading } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null
  );

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("error");

  const showToast = (message: string, type: ToastType = "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // TODO: DEV MODE - Bypass OAuth, using dummy handlers
  const isGoogleReady = true;
  const isAppleAvailable = true;
  const signInWithGoogle = () => router.replace("/(protected)/(tabs)/home");
  const signInWithApple = () => router.replace("/(protected)/(tabs)/home");

  // ORIGINAL GOOGLE AUTH (commented out for dev)
  // const { signInWithGoogle, isReady: isGoogleReady } = useGoogleAuth({
  //   onSuccess: async (idToken) => {
  //     setOauthLoading("google");
  //     try {
  //       await googleLogin(idToken);
  //     } catch (error) {
  //       showToast(t.auth.loginFailed, "error");
  //     } finally {
  //       setOauthLoading(null);
  //     }
  //   },
  //   onError: (error) => {
  //     showToast(error, "error");
  //   },
  // });

  // ORIGINAL APPLE AUTH (commented out for dev)
  // const { signInWithApple, isAvailable: isAppleAvailable } = useAppleAuth({
  //   onSuccess: async (identityToken, user) => {
  //     setOauthLoading("apple");
  //     try {
  //       await appleLogin({
  //         identityToken,
  //         email: user?.email,
  //         fullName: user?.fullName,
  //       });
  //     } catch (error) {
  //       showToast(t.auth.loginFailed, "error");
  //     } finally {
  //       setOauthLoading(null);
  //     }
  //   },
  //   onError: (error) => {
  //     showToast(error, "error");
  //   },
  // });

  // Validation helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateIdentifier = (value: string): string | undefined => {
    const trimmed = value.trim();

    if (!trimmed) {
      return t.auth.emailRequired;
    }

    // If it contains @, validate as email
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

    if (value.length < 6) {
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

  const handleLogin = async () => {
    // TODO: DEV MODE - Bypass login, go directly to home
    router.replace("/(protected)/(tabs)/home");
    return;

    // ORIGINAL LOGIN LOGIC (commented out for dev)
    // if (!validateForm()) return;
    //
    // try {
    //   await login(emailOrUsername.trim(), password);
    // } catch (error) {
    //   let errorMessage = t.auth.loginFailed;
    //
    //   if (axios.isAxiosError(error)) {
    //     if (error.response?.status === 401 || error.response?.status === 400) {
    //       errorMessage = t.auth.invalidCredentials;
    //     } else if (!error.response) {
    //       errorMessage = t.auth.networkError;
    //     } else if (error.response?.data?.message) {
    //       errorMessage = error.response.data.message;
    //     }
    //   }
    //
    //   showToast(errorMessage, "error");
    // }
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
          <Image
            source={require("../../assets/darbna-logo.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>{t.auth.welcomeBack}</Text>
          <Text style={styles.subtitle}>{t.auth.signInToContinue}</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.identifier && styles.inputError]}
                placeholder={t.auth.emailOrUsername}
                placeholderTextColor="#a89080"
                autoCapitalize="none"
                autoCorrect={false}
                value={emailOrUsername}
                onChangeText={handleIdentifierChange}
                onBlur={() => {
                  if (emailOrUsername) {
                    const error = validateIdentifier(emailOrUsername);
                    setErrors((prev) => ({ ...prev, identifier: error }));
                  }
                }}
                editable={!isLoading}
              />
              {errors.identifier && (
                <Text style={styles.errorText}>{errors.identifier}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    errors.password && styles.inputError,
                  ]}
                  placeholder={t.auth.password}
                  placeholderTextColor="#a89080"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={() => {
                    if (password) {
                      const error = validatePassword(password);
                      setErrors((prev) => ({ ...prev, password: error }));
                    }
                  }}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#a89080"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/(auth)/forgotPassoword")}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                {t.auth.forgotPassword}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2c120c" />
                  <Text style={styles.loginButtonText}>{t.auth.loggingIn}</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>{t.auth.login}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t.auth.or}</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtonsColumn}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                (!isGoogleReady || isLoading || oauthLoading) &&
                  styles.socialButtonDisabled,
              ]}
              disabled={!isGoogleReady || isLoading || !!oauthLoading}
              onPress={signInWithGoogle}
            >
              {oauthLoading === "google" ? (
                <ActivityIndicator size="small" color="#f5e6d3" />
              ) : (
                <Ionicons name="logo-google" size={20} color="#f5e6d3" />
              )}
              <Text style={styles.socialButtonText}>
                {t.auth.continueWithGoogle}
              </Text>
            </TouchableOpacity>
            {Platform.OS === "ios" && isAppleAvailable && (
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  (isLoading || oauthLoading) && styles.socialButtonDisabled,
                ]}
                disabled={isLoading || !!oauthLoading}
                onPress={signInWithApple}
              >
                {oauthLoading === "apple" ? (
                  <ActivityIndicator size="small" color="#f5e6d3" />
                ) : (
                  <Ionicons name="logo-apple" size={20} color="#f5e6d3" />
                )}
                <Text style={styles.socialButtonText}>
                  {t.auth.continueWithApple}
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#f5e6d3",
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#ff6b6b",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
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
  loginButton: {
    backgroundColor: "#ad5410",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#ad5410",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loginButtonText: {
    color: "#2c120c",
    fontWeight: "bold",
    fontSize: 18,
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
  socialButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    gap: 12,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    color: "#f5e6d3",
    fontWeight: "600",
    fontSize: 16,
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
