import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Keyboard,
} from "react-native";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { requestPasswordResetCode } from "../../api/auth";
import CustomAlert, { AlertButton } from "../../components/CustomAlert";

const HEADER_BG_COLOR = "#2c120c";
const OTP_LENGTH = 6;

const EnterResetCodeScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();

  const email = useMemo(() => {
    const fromParams = typeof params.email === "string" ? params.email : "";
    return fromParams.toLowerCase().trim();
  }, [params.email]);

  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => "")
  );
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [hasRequestedCode, setHasRequestedCode] = useState(false);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  // Update combined code string whenever digits change
  useEffect(() => {
    setCode(digits.join(""));
  }, [digits]);

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

  const handleSendCode = async () => {
    if (!email) {
      showAlert(t.common.error, t.auth.emailRequired, "error");
      return;
    }

    setSending(true);
    try {
      await requestPasswordResetCode(email);
      showAlert(t.common.success, t.auth.resetCodeSent, "success");
      setHasRequestedCode(true);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || t.auth.passwordResetFailed;
      showAlert(t.common.error, errorMessage, "error");
    } finally {
      setSending(false);
    }
  };

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleVerify = () => {
    if (!email) {
      showAlert(t.common.error, t.auth.emailRequired, "error");
      return;
    }

    const finalCode = code.trim();
    if (!finalCode || finalCode.length !== OTP_LENGTH) {
      showAlert(t.common.error, t.profile.codeRequired, "error");
      return;
    }

    // Navigate to reset password screen with email and code
    router.push({
      pathname: "/(auth)/resetPasswordCode",
      params: { email, code: finalCode },
    });
  };

  const updateDigits = (next: string[]) => {
    setDigits(next);
    const joined = next.join("");
    const isComplete =
      next.every((d) => d.length === 1) && joined.length === OTP_LENGTH;
    if (isComplete) {
      // Auto-submit once all boxes are filled
      handleVerify();
      Keyboard.dismiss();
    }
  };

  const onChangeDigit = (index: number, text: string) => {
    const onlyDigits = (text || "").replace(/\D/g, "");

    // Paste support: distribute across boxes
    if (onlyDigits.length > 1) {
      const chars = onlyDigits.slice(0, OTP_LENGTH - index).split("");
      const next = [...digits];
      for (let i = 0; i < chars.length; i++) {
        if (index + i < OTP_LENGTH) {
          next[index + i] = chars[i];
        }
      }
      updateDigits(next);
      focusIndex(Math.min(index + chars.length, OTP_LENGTH - 1));
      return;
    }

    const next = [...digits];
    next[index] = onlyDigits.slice(0, 1);
    updateDigits(next);

    if (onlyDigits.length === 1 && index < OTP_LENGTH - 1) {
      focusIndex(index + 1);
    }
  };

  const onKeyPressDigit = (index: number, key: string) => {
    if (key !== "Backspace") return;

    if (digits[index]) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    if (index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      focusIndex(index - 1);
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
        <Text style={styles.headerTitle}>{t.auth.enterResetCode}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t.auth.resetCodeSubtitle}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.email}
            </Text>
            <View
              style={[
                styles.readonlyBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: colors.text }}>{email || "-"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleSendCode}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                style={[styles.secondaryButtonText, { color: colors.primary }]}
              >
                {hasRequestedCode ? t.profile.resendCode : t.profile.sendCode}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.verificationCode}
            </Text>
            <View style={styles.otpContainer}>
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputsRef.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                    digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(text) => onChangeDigit(index, text)}
                  onKeyPress={({ nativeEvent: { key } }) =>
                    onKeyPressDigit(index, key)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  caretHidden={true}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              code.length !== OTP_LENGTH && styles.primaryButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={code.length !== OTP_LENGTH}
          >
            <Text style={styles.primaryButtonText}>
              {t.common.continue}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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

export default EnterResetCodeScreen;

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
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  readonlyBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  otpInputFilled: {
    borderColor: "#ad5410",
    backgroundColor: "rgba(173, 84, 16, 0.1)",
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

