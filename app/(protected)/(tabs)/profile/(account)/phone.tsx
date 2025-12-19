import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { useAuth } from "../../../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { updatePhone } from "../../../../../api/user";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";

const HEADER_BG_COLOR = "#2c120c";

const PhoneScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { user, updateUserState } = useAuth();
  const [phone, setPhone] = useState(user?.phone || "");
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
    if (!phone.trim()) {
      showAlert(t.common.error, "Phone number is required", "error");
      return;
    }

    if (!password) {
      showAlert(
        t.common.error,
        "Password is required to update phone",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      // Backend expects: { phone, password }
      // Backend returns: { message: "Phone updated successfully", success: true }
      // It does NOT return the updated user object in the response body directly as 'data' or 'user'
      // based on the provided backend code: res.status(200).json({ message: "Phone updated successfully", success: true });
      // So we might need to fetch the updated user profile or manually update local state if we trust the input.

      await updatePhone(user._id, phone, password);

      // Since backend doesn't return the user, we should probably fetch it again or optimistically update
      // Let's optimistically update for now, or assume the API might change to return it.
      // Actually, looking at other endpoints, usually they return data.
      // But updatePhone in user's code only returns message.
      // So let's construct the updated user object manually for local state.
      const updatedUser = { ...user, phone };
      updateUserState(updatedUser);

      showAlert(t.common.success, t.profile.profileUpdated, "success", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error updating phone:", error);
      if (error.response?.status === 400 || error.response?.status === 401) {
        showAlert(
          t.common.error,
          error.response?.data?.message || "Invalid password or input",
          "error"
        );
      } else {
        showAlert(t.common.error, t.profile.updateFailed, "error");
      }
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>{t.profile.phone}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Add a phone number to your account for better security and easier
            recovery.
          </Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.phone}
            </Text>
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
              value={phone}
              onChangeText={setPhone}
              placeholder={t.profile.phone}
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
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

export default PhoneScreen;

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
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
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
});
