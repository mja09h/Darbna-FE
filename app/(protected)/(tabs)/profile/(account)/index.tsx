import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { useAuth } from "../../../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";
import { deleteUser } from "../../../../../api/user";
import { maskCardNumber } from "../../../../../utils/cardValidation";

const HEADER_BG_COLOR = "#2c120c";

const AccountScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: "success" | "error" | "warning" | "info";
  }>({ title: "", message: "" });

  // Delete Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const handleDeleteAccount = async () => {
    if (!user?._id) return;

    if (deleteConfirmation !== "DELETE") {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUser(user._id);
      await logout();
      // Router will handle redirect in AuthContext
    } catch (error) {
      console.error("Delete account error:", error);
      setIsDeleting(false);
      setDeleteModalVisible(false);
      showAlert(
        t.common.error,
        "Failed to delete account. Please try again.",
        "error"
      );
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const renderItem = (
    icon: string,
    label: string,
    value: string | undefined,
    onPress: () => void,
    showArrow: boolean = true,
    isDestructive: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        styles.item,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isDestructive ? "#FFE5E5" : colors.surface },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={isDestructive ? "#FF3B30" : colors.primary}
          />
        </View>
        <View>
          <Text
            style={[
              styles.itemLabel,
              { color: isDestructive ? "#FF3B30" : colors.text },
            ]}
          >
            {label}
          </Text>
          {value && (
            <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
              {value}
            </Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Ionicons
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={20}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>{t.profile.accountInfo}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderSection(
            t.profile.personalInfo,
            <View>
              {renderItem(
                "person-outline",
                t.profile.username,
                user?.username,
                () =>
                  router.push("/(protected)/(tabs)/profile/(account)/username")
              )}
              {renderItem("mail-outline", t.profile.email, user?.email, () =>
                router.push("/(protected)/(tabs)/profile/(account)/email")
              )}
              {renderItem(
                "call-outline",
                t.profile.phone,
                user?.phone || t.profile.noPhone,
                () => router.push("/(protected)/(tabs)/profile/(account)/phone")
              )}
            </View>
          )}

          {renderSection(
            t.profile.securityConnections || "Security & Connections",
            <View>
              {renderItem(
                "lock-closed-outline",
                t.profile.changePassword,
                "",
                () =>
                  router.push(
                    "/(protected)/(tabs)/profile/(account)/changePassword"
                  )
              )}
            </View>
          )}

          {renderSection(
            "Subscription",
            <View>
              {renderItem("card-outline", "My Subscriptions", "Free Plan", () =>
                router.push(
                  "/(protected)/(tabs)/profile/(account)/subscriptions"
                )
              )}
            </View>
          )}

          {renderSection(
            t.profile?.paymentInfo || "Payment Information",
            <View>
              {renderItem(
                "card-outline",
                t.profile?.paymentInfo || "Payment Information",
                user?.cardInfo?.cardNumber
                  ? maskCardNumber(user.cardInfo.cardNumber)
                  : t.profile?.noPaymentInfo || "Not set",
                () =>
                  router.push(
                    "/(protected)/(tabs)/profile/(account)/paymentInfo"
                  )
              )}
            </View>
          )}

          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                { backgroundColor: "#FFE5E5", borderColor: "#FF3B30" },
              ]}
              onPress={() => {
                setDeleteConfirmation("");
                setDeleteModalVisible(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.logoutText, { color: "#FF3B30" }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={40} color="#FF3B30" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Delete Account
              </Text>
            </View>

            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </Text>

            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Type "DELETE" to confirm
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor:
                    deleteConfirmation === "DELETE" ? "#FF3B30" : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="DELETE"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      deleteConfirmation === "DELETE"
                        ? "#FF3B30"
                        : colors.border,
                    borderColor:
                      deleteConfirmation === "DELETE"
                        ? "#FF3B30"
                        : colors.border,
                    opacity: deleteConfirmation === "DELETE" ? 1 : 0.5,
                  },
                ]}
                onPress={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

export default AccountScreen;

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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemValue: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  modalText: {
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    alignSelf: "flex-start",
    width: "100%",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
