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
import { updateUsername } from "../../../../../api/user";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";

const HEADER_BG_COLOR = "#2c120c";

const UsernameScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { user, updateUserState } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
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
    if (!username.trim()) {
      showAlert(t.common.error, t.auth.usernameRequired, "error");
      return;
    }
    if (!password) {
      showAlert(
        t.common.error,
        "Password is required to change username",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      await updateUsername(user._id, username, password);

      // Optimistic update
      const updatedUser = { ...user, username };
      updateUserState(updatedUser);

      showAlert(t.common.success, t.profile.profileUpdated, "success", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error updating username:", error);
      // login failed is not relevant anymore as updateUsername handles password check
      if (error.response?.status === 400 || error.response?.status === 401) {
        showAlert(
          t.common.error,
          error.response?.data?.message || "Invalid password",
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
        <Text style={styles.headerTitle}>{t.profile.username}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Choose a unique username for your account. This is how other users
            will see you.
          </Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.profile.username}
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
              value={username}
              onChangeText={setUsername}
              placeholder={t.profile.username}
              placeholderTextColor={colors.textSecondary}
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

export default UsernameScreen;

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
