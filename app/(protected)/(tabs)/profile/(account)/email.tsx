import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { useAuth } from "../../../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { updateEmail } from "../../../../../api/user";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";

const HEADER_BG_COLOR = "#2c120c";

const EmailScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { user, updateUserState } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (!user?._id) return;
    if (!email.trim()) {
      showAlert(t.common.error, t.auth.emailRequired, "error");
      return;
    }

    if (!password) {
      showAlert(
        t.common.error,
        "Password is required to update email",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      // Backend expects: { email, password }
      // The updateEmail function signature in api/user.ts is: updateEmail(id, email, password)
      await updateEmail(user._id, email, password);

      // IMPORTANT:
      // When the email changes, verification should be considered invalid for the new email.
      // Backend should ideally set isVerified=false on email change, but we also enforce it client-side.
      updateUserState({ ...user, email, isVerified: false });

      // Do NOT auto-send verification code on email update.
      // User can manually request it from the Verify Email screen.
      showAlert(t.common.success, "Email updated successfully", "success", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error updating email:", error);
      const errorMessage =
        error.response?.data?.message || t.profile.updateFailed;
      showAlert(t.common.error, errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    // Code entry moved to a dedicated screen
    router.push({
      pathname: "/(protected)/(tabs)/profile/(account)/verifyEmail",
      params: { email },
    });
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
        <Text style={styles.headerTitle}>{t.profile.email}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Ensure your email address is up to date so you can receive important
            notifications and recover your account if needed.
          </Text>
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.email}
            </Text>
              {user?.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.verifiedText}>
                    {t.profile.emailVerified}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.notVerifiedBadge}
                  onPress={handleVerify}
                >
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notVerifiedText}>
                    {t.profile.verifyEmail}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder={t.profile.email}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.auth.password}
            </Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    color: colors.text,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.password}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
        </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t.common.save}</Text>
            )}
          </TouchableOpacity>

          {/* Verification status (under Save button) */}
          {user?.isVerified ? (
            <View style={styles.verificationContainer}>
              <Ionicons name="checkmark-circle" size={90} color="#4CAF50" />
              <View style={styles.verificationRow}>
                <View style={styles.verificationTextColumn}>
                  <Text style={styles.verificationOkText}>
                    {t.profile.emailVerified}
                  </Text>
                  <Text style={styles.verificationOkSubText}>
                    {t.profile.emailVerifiedSubtitle}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.verificationContainer}>
              <Ionicons name="alert-circle" size={90} color="#FF3B30" />
              <View style={styles.verificationRow}>
                <View style={styles.verificationTextColumn}>
                  <Text style={styles.verificationBadTitle}>
                    {t.profile.emailNotVerified}
                  </Text>
                  <Text style={styles.verificationBadSubText}>
                    {t.profile.verifyEmail}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.verifyBigButton}
                onPress={handleVerify}
              >
                <Text style={styles.verifyBigButtonText}>
                  {t.profile.verifyEmail}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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

export default EmailScreen;

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  notVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  notVerifiedText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  verificationContainer: {
    marginTop: 50,
    alignItems: "center",
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 5,
  },
  verificationTextColumn: {
    alignItems: "center",
  },
  verificationOkText: {
    color: "#4CAF50",
    fontSize: 35,
    fontWeight: "600",
  },
  verificationOkSubText: {
    color: "gray",
    opacity: 0.8,
    fontSize: 12,
    marginTop: 2,
  },
  verificationBadText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
  verificationBadTitle: {
    color: "#FF3B30",
    fontSize: 35,
    fontWeight: "600",
  },
  verificationBadSubText: {
    color: "gray",
    opacity: 0.8,
    fontSize: 12,
    marginTop: 2,
  },
  verifyInlineButton: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
  },
  verifyInlineButtonText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "700",
  },
  verifyBigButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
  },
  verifyBigButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "700",
  },
});
