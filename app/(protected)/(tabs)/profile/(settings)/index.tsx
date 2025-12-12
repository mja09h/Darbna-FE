import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { useSettings } from "../../../../../context/SettingsContext";
import { useAuth } from "../../../../../context/AuthContext";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert, {
  AlertButton,
} from "../../../../../components/CustomAlert";

const SettingsScreen = () => {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { theme, setTheme, colors, isDark } = useTheme();
  const { units, setUnits } = useSettings();
  const { logout } = useAuth();
  const router = useRouter();

  const [locationStatus, setLocationStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [notificationStatus, setNotificationStatus] =
    useState<Notifications.PermissionStatus | null>(null);

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: "success" | "error" | "warning" | "info";
  }>({ title: "", message: "" });

  const version = Constants.expoConfig?.version ?? "1.0.0";

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationStatus(status);
    } catch (error) {
      console.log("Error checking location permission:", error);
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationStatus(status);
    } catch (error) {
      console.log("Error checking notification permission:", error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(status);
      if (status !== "granted") {
        showAlert(
          t.common.error,
          "Location permission is required for this feature.",
          "error"
        );
      }
    } catch (error) {
      console.log("Error requesting location permission:", error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationStatus(status);
      if (status !== "granted") {
        showAlert(
          t.common.error,
          "Notification permission is required for this feature.",
          "error"
        );
      }
    } catch (error) {
      console.log("Error requesting notification permission:", error);
    }
  };

  const handleLogout = () => {
    showAlert(t.profile.logout, t.profile.logoutConfirm, "warning", [
      {
        text: t.common.cancel,
        style: "cancel",
      },
      {
        text: t.profile.logout,
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout error:", error);
            showAlert(
              t.common.error,
              "Failed to logout. Please try again.",
              "error"
            );
          }
        },
      },
    ]);
  };

  const getPermissionStatusText = (status: string | null) => {
    if (!status) return t.settings.permissionNotDetermined;
    if (status === "granted") return t.settings.permissionGranted;
    if (status === "denied") return t.settings.permissionDenied;
    return t.settings.permissionNotDetermined;
  };

  const renderSection = (
    title: string,
    children: React.ReactNode,
    isLast: boolean = false
  ) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      {children}
      {!isLast && (
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      )}
    </View>
  );

  const renderSettingItem = (
    label: string,
    value: string,
    onPress: () => void,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.settingValueContainer}>
        <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
          {value}
        </Text>
        {showArrow && (
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color={colors.textSecondary}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderLanguageSelector = () => (
    <View style={styles.selectorContainer}>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor:
              language === "en" ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setLanguage("en")}
      >
        <Text
          style={[
            styles.selectorButtonText,
            {
              color: language === "en" ? colors.primaryLight : colors.text,
            },
          ]}
        >
          {t.welcome.english}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor:
              language === "ar" ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setLanguage("ar")}
      >
        <Text
          style={[
            styles.selectorButtonText,
            {
              color: language === "ar" ? colors.primaryLight : colors.text,
            },
          ]}
        >
          {t.welcome.arabic}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderUnitsSelector = () => (
    <View style={styles.selectorContainer}>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor: units === "km" ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setUnits("km")}
      >
        <Text
          style={[
            styles.selectorButtonText,
            {
              color: units === "km" ? colors.primaryLight : colors.text,
            },
          ]}
        >
          {t.settings.kilometers}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor:
              units === "miles" ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setUnits("miles")}
      >
        <Text
          style={[
            styles.selectorButtonText,
            {
              color: units === "miles" ? colors.primaryLight : colors.text,
            },
          ]}
        >
          {t.settings.miles}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderThemeSelector = () => (
    <View style={styles.selectorContainer}>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor:
              theme === "light" ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setTheme("light")}
      >
        <Text
          style={[
            styles.selectorButtonText,
            {
              color: theme === "light" ? colors.primaryLight : colors.text,
            },
          ]}
        >
          {t.settings.lightMode}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor: theme === "dark" ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setTheme("dark")}
      >
        <Text
          style={[
            styles.selectorButtonText,
            {
              color: theme === "dark" ? colors.primaryLight : colors.text,
            },
          ]}
        >
          {t.settings.darkMode}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor:
              theme === "system" ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setTheme("system")}
      >
        <Text
          style={[
            styles.selectorButtonText,
            {
              color: theme === "system" ? colors.primaryLight : colors.text,
            },
          ]}
        >
          {t.settings.systemDefault}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.settings.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderSection(
          t.profile.account,
          <View>
            {renderSettingItem(t.profile.accountInfo, "", () =>
              router.push("/(protected)/(tabs)/profile/(account)")
            )}
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={handleLogout}
            >
              <Text style={[styles.settingLabel, { color: "#FF3B30" }]}>
                {t.profile.logout}
              </Text>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}

        {renderSection(t.settings.language, renderLanguageSelector())}

        {renderSection(t.settings.units, renderUnitsSelector())}

        {renderSection(t.settings.appearance, renderThemeSelector())}

        {renderSection(
          t.settings.permissions,
          <View>
            <View
              style={[styles.permissionItem, { backgroundColor: colors.card }]}
            >
              <View style={styles.permissionInfo}>
                <Text style={[styles.permissionLabel, { color: colors.text }]}>
                  {t.settings.location}
                </Text>
                <Text
                  style={[
                    styles.permissionStatus,
                    { color: colors.textSecondary },
                  ]}
                >
                  {getPermissionStatusText(locationStatus)}
                </Text>
              </View>
              {locationStatus !== "granted" && (
                <TouchableOpacity
                  style={[
                    styles.permissionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={requestLocationPermission}
                >
                  <Text
                    style={[
                      styles.permissionButtonText,
                      { color: colors.primaryLight },
                    ]}
                  >
                    {t.settings.requestPermission}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.permissionItem,
                { backgroundColor: colors.card, marginTop: 12 },
              ]}
            >
              <View style={styles.permissionInfo}>
                <Text style={[styles.permissionLabel, { color: colors.text }]}>
                  {t.settings.notifications}
                </Text>
                <Text
                  style={[
                    styles.permissionStatus,
                    { color: colors.textSecondary },
                  ]}
                >
                  {getPermissionStatusText(notificationStatus)}
                </Text>
              </View>
              {notificationStatus !== "granted" && (
                <TouchableOpacity
                  style={[
                    styles.permissionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={requestNotificationPermission}
                >
                  <Text
                    style={[
                      styles.permissionButtonText,
                      { color: colors.primaryLight },
                    ]}
                  >
                    {t.settings.requestPermission}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {renderSection(
          t.settings.legal,
          <View>
            {renderSettingItem(t.settings.about, "", () =>
              router.push("/(protected)/(tabs)/profile/(settings)/about")
            )}
            {renderSettingItem(t.settings.termsOfService, "", () =>
              router.push("/(protected)/(tabs)/profile/(settings)/terms")
            )}
            {renderSettingItem(
              t.settings.privacyPolicy,
              "",
              () =>
                router.push("/(protected)/(tabs)/profile/(settings)/privacy"),
              true
            )}
          </View>,
          true
        )}

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            v{version}
          </Text>
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
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginTop: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  selectorContainer: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  selectorButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 90,
    alignItems: "center",
    flex: 1,
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  permissionItem: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  permissionStatus: {
    fontSize: 14,
  },
  permissionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FFE5E5",
    gap: 8,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
  },
});
