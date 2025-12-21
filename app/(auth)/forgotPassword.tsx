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
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import AuthInput from "../../components/AuthInput";
import AuthButton from "../../components/AuthButton";
import CustomAlert, { AlertButton } from "../../components/CustomAlert";
import { requestPasswordResetCode } from "../../api/auth";

const ForgotPassword = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();

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

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmail = (): boolean => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t.auth.emailRequired);
      return false;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError(t.auth.emailInvalid);
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleRequestReset = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await requestPasswordResetCode(normalizedEmail);
      showAlert(t.auth.checkEmail, t.auth.resetCodeSent, "success", [
        {
          text: "OK",
          onPress: () => {
            setAlertVisible(false);
            router.push({
              pathname: "/(auth)/enterResetCode",
              params: { email: normalizedEmail },
            });
          },
          style: "default",
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || t.auth.passwordResetFailed;
      showAlert(t.common.error, errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={24}
            color="#f5e6d3"
          />
        </TouchableOpacity>

        <Image
          source={require("../../assets/darbna-logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>{t.auth.forgotPasswordTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.resetCodeDescription}</Text>

        <View style={styles.formContainer}>
          {/* Email Input */}
          <AuthInput
            placeholder={t.auth.email}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) {
                setEmailError(undefined);
              }
            }}
            onBlur={validateEmail}
            error={emailError}
            isLoading={loading}
            autoCapitalize="none"
            keyboardType="email-address"
            icon="mail-outline"
          />

          {/* Send Code Button */}
          <AuthButton
            title={t.auth.sendResetCode}
            loadingTitle={t.common.loading}
            onPress={handleRequestReset}
            isLoading={loading}
          />
        </View>

        <View style={styles.backToLoginContainer}>
          <Ionicons name="arrow-back" size={16} color="#ad5410" />
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.backToLoginText}>{t.auth.backToLogin}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c120c",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 1,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#a89080",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 24,
  },
  formContainer: {
    width: "100%",
    marginTop: 10,
  },
  backToLoginContainer: {
    flexDirection: "row",
    marginTop: 40,
    alignItems: "center",
    gap: 6,
  },
  backToLoginText: {
    color: "#ad5410",
    fontSize: 15,
    fontWeight: "600",
  },
});
