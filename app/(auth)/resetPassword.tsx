import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useState, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import AuthInput from "../../components/AuthInput";
import AuthButton from "../../components/AuthButton";
import CustomAlert, { AlertButton } from "../../components/CustomAlert";
import { resetPassword } from "../../api/auth";

const HEADER_BG_COLOR = "#2c120c";

const ResetPasswordScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const params = useLocalSearchParams<{ token?: string }>();

  const token = useMemo(() => {
    return typeof params.token === "string" ? params.token : "";
  }, [params.token]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >();

  // Alert State
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

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return t.auth.passwordRequired;
    }
    if (password.length < 5) {
      return t.auth.passwordTooShort;
    }
    return undefined;
  };

  const validateConfirmPassword = (
    password: string,
    confirm: string
  ): string | undefined => {
    if (!confirm) {
      return t.auth.passwordRequired;
    }
    if (password !== confirm) {
      return t.auth.passwordsDoNotMatch;
    }
    return undefined;
  };

  const handleResetPassword = async () => {
    const passwordErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(newPassword, confirmPassword);

    if (passwordErr) {
      setPasswordError(passwordErr);
    }
    if (confirmErr) {
      setConfirmPasswordError(confirmErr);
    }

    if (passwordErr || confirmErr) {
      return;
    }

    if (!token) {
      showAlert(
        t.common.error,
        t.auth.invalidOrExpiredToken,
        "error",
        [
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              router.push("/(auth)/forgotPassword");
            },
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      showAlert(
        t.common.success,
        t.auth.passwordResetSuccess,
        "success",
        [
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              router.replace("/(auth)/login");
            },
            style: "default",
          },
        ]
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        t.auth.invalidOrExpiredToken ||
        t.auth.passwordResetFailed;
      showAlert(t.common.error, errorMessage, "error", [
        {
          text: "OK",
          onPress: () => {
            setAlertVisible(false);
            router.push("/(auth)/forgotPassword");
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{t.auth.invalidOrExpiredToken}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(auth)/forgotPassword")}
          >
            <Text style={styles.backButtonText}>{t.common.back}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButtonHeader}
            >
              <Ionicons
                name={isRTL ? "chevron-forward" : "chevron-back"}
                size={28}
                color="#f5e6d3"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.auth.resetPassword}</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              {t.auth.resetPassword} - {t.auth.newPassword}
            </Text>

            {/* New Password Input */}
            <AuthInput
              placeholder={t.auth.newPassword}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (passwordError) {
                  setPasswordError(undefined);
                }
              }}
              onBlur={() => {
                if (newPassword) {
                  const error = validatePassword(newPassword);
                  setPasswordError(error);
                }
              }}
              error={passwordError}
              isLoading={loading}
              isPassword
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              icon="lock-closed-outline"
            />

            {/* Confirm Password Input */}
            <AuthInput
              placeholder={t.auth.confirmNewPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) {
                  setConfirmPasswordError(undefined);
                }
              }}
              onBlur={() => {
                if (confirmPassword) {
                  const error = validateConfirmPassword(
                    newPassword,
                    confirmPassword
                  );
                  setConfirmPasswordError(error);
                }
              }}
              error={confirmPasswordError}
              isLoading={loading}
              isPassword
              showPassword={showConfirmPassword}
              onTogglePassword={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              icon="lock-closed-outline"
            />

            {/* Reset Button */}
            <AuthButton
              title={t.auth.resetPassword}
              loadingTitle={t.auth.resettingPassword}
              onPress={handleResetPassword}
              isLoading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButtonHeader: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  description: {
    fontSize: 16,
    color: "#a89080",
    marginBottom: 24,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#f5e6d3",
    marginTop: 16,
    textAlign: "center",
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#ad5410",
    borderRadius: 12,
  },
  backButtonText: {
    color: "#f5e6d3",
    fontSize: 16,
    fontWeight: "600",
  },
});

