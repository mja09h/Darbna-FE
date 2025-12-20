import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSOSAlert, resolveSOSAlert } from "../api/sos";
import ActiveAlertsList from "./ActiveAlertsList";
import CountdownTimer from "./CountdownTimer";
import { useTheme } from "../context/ThemeContext";
import CustomAlert, { AlertButton } from "./CustomAlert";

// Darbna Brand Colors
const COLORS = {
  desertOrange: "#C46F26",
  darkSandBrown: "#3A1D1A",
  sandBeige: "#E9DCCF",
  offWhiteDesert: "#F4EEE7",
  white: "#FFFFFF",
  red: "#FF3B30", // iOS system red for emergency
};

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  userLocation: Location.LocationObject | null;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  type: "success" | "error" | "warning" | "info";
}

const SOSModal = ({ visible, onClose, userLocation }: SOSModalProps) => {
  const [activeTab, setActiveTab] = useState("send");
  const [isSending, setIsSending] = useState(false);
  const [sosExpiry, setSosExpiry] = useState<number | null>(null);
  const [cooldownExpiry, setCooldownExpiry] = useState<number | null>(null);
  const [activeSosAlertId, setActiveSosAlertId] = useState<string | null>(null);

  const { isDark } = useTheme();

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[] = [{ text: "OK", onPress: () => closeAlert() }],
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
      type,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Load timers from AsyncStorage when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadTimers();
    }
  }, [visible]);

  const loadTimers = async () => {
    try {
      const sosExpiryStr = await AsyncStorage.getItem("sosExpiry");
      if (sosExpiryStr) {
        const expiry = Number(sosExpiryStr);
        if (expiry > Date.now()) {
          setSosExpiry(expiry);
        } else {
          await AsyncStorage.removeItem("sosExpiry");
        }
      }

      const cooldownExpiryStr = await AsyncStorage.getItem("cooldownExpiry");
      if (cooldownExpiryStr) {
        const expiry = Number(cooldownExpiryStr);
        if (expiry > Date.now()) {
          setCooldownExpiry(expiry);
        } else {
          await AsyncStorage.removeItem("cooldownExpiry");
        }
      }

      const sosAlertIdStr = await AsyncStorage.getItem("activeSosAlertId");
      if (sosAlertIdStr) {
        setActiveSosAlertId(sosAlertIdStr);
      }
    } catch (error) {
      console.error("Error loading timers:", error);
    }
  };

    const handleSendSOS = async () => {
      setIsSending(true);
      try {
        // Check if location is available from props
        if (!userLocation) {
          throw new Error(
            "Location not available. Please wait a moment and try again."
          );
        }

        const alert = await createSOSAlert({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });

        // Set 2-hour timer
        const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
        setSosExpiry(expiry);
        setActiveSosAlertId(alert._id);
        await AsyncStorage.setItem("sosExpiry", String(expiry));
        await AsyncStorage.setItem("activeSosAlertId", alert._id);

        showAlert(
          "SOS Sent",
          "Your alert has been broadcast.",
          undefined,
          "success"
        );
      } catch (error: any) {
        if (error.response?.status === 429) {
          showAlert(
            "Rate Limit",
            error.response.data.message,
            undefined,
            "warning"
          );
          const timeLeftMatch =
            error.response.data.message.match(/(\d+)\s+minute/);
          if (timeLeftMatch) {
            const minutesLeft = parseInt(timeLeftMatch[1]);
            const expiry = Date.now() + minutesLeft * 60 * 1000;
            setCooldownExpiry(expiry);
            await AsyncStorage.setItem("cooldownExpiry", String(expiry));
          }
        } else {
          showAlert(
            "Error",
            error.message || "Could not send SOS alert.",
            undefined,
            "error"
          );
        }
      } finally {
        setIsSending(false);
      }
    };
  const handleCancelSOS = async () => {
    if (!activeSosAlertId) {
      showAlert("Error", "No active SOS to cancel", undefined, "error");
      return;
    }

    showAlert(
      "Cancel SOS",
      "Are you sure you want to cancel your SOS alert?",
      [
        { text: "No", style: "cancel", onPress: () => closeAlert() },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            closeAlert(); // Close confirmation alert
            try {
              await resolveSOSAlert(activeSosAlertId);

              // Clear SOS timer and set cooldown
              setSosExpiry(null);
              setActiveSosAlertId(null);
              await AsyncStorage.removeItem("sosExpiry");
              await AsyncStorage.removeItem("activeSosAlertId");

              // Set 30-minute cooldown timer
              const expiry = Date.now() + 30 * 60 * 1000; // 30 minutes
              setCooldownExpiry(expiry);
              await AsyncStorage.setItem("cooldownExpiry", String(expiry));

              // Show success alert after a brief delay to allow modal transition
              setTimeout(() => {
                showAlert(
                  "Success",
                  "Your SOS alert has been canceled.",
                  undefined,
                  "success"
                );
              }, 300);
            } catch (error: any) {
              setTimeout(() => {
                showAlert(
                  "Error",
                  "Could not cancel SOS alert.",
                  undefined,
                  "error"
                );
              }, 300);
              console.error("Error canceling SOS:", error);
            }
          },
        },
      ],
      "warning"
    );
  };

  const handleSosExpire = async () => {
    setSosExpiry(null);
    setActiveSosAlertId(null);
    await AsyncStorage.removeItem("sosExpiry");
    await AsyncStorage.removeItem("activeSosAlertId");

    // Set 30-minute cooldown after SOS expires
    const expiry = Date.now() + 30 * 60 * 1000;
    setCooldownExpiry(expiry);
    await AsyncStorage.setItem("cooldownExpiry", String(expiry));
  };

  const handleCooldownExpire = async () => {
    setCooldownExpiry(null);
    await AsyncStorage.removeItem("cooldownExpiry");
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="chevron-down"
                  size={32}
                  color={COLORS.sandBeige}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>SOS Center</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "send" && styles.activeTab]}
              onPress={() => setActiveTab("send")}
            >
              <Ionicons
                name="radio-outline"
                size={20}
                color={activeTab === "send" ? COLORS.desertOrange : "#888"}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "send" && styles.activeTabText,
                ]}
              >
                Broadcast
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "alerts" && styles.activeTab]}
              onPress={() => setActiveTab("alerts")}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color={activeTab === "alerts" ? COLORS.desertOrange : "#888"}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "alerts" && styles.activeTabText,
                ]}
              >
                Nearby Alerts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={styles.contentContainer}>
            {activeTab === "send" ? (
              <View style={styles.sendContainer}>
                <View style={styles.statusCard}>
                  <Ionicons
                    name="warning"
                    size={48}
                    color={COLORS.desertOrange}
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={styles.sendTitle}>Emergency Assistance</Text>
                  <Text style={styles.sendDescription}>
                    Broadcast your location to nearby desert travelers. Use only
                    in real emergencies.
                  </Text>
                </View>

                {sosExpiry && sosExpiry > Date.now() ? (
                  <View style={styles.activeStateContainer}>
                    <View style={styles.pulseRing} />
                    <View style={styles.timerWrapper}>
                      <CountdownTimer
                        expiryTimestamp={sosExpiry}
                        onExpire={handleSosExpire}
                        label="SOS SIGNAL ACTIVE"
                        textStyle={styles.timerText}
                      />
                      <Text style={styles.timerSubtext}>
                        Broadcasting location...
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelSOS}
                    >
                      <Text style={styles.cancelButtonText}>CANCEL SOS</Text>
                    </TouchableOpacity>
                  </View>
                ) : cooldownExpiry && cooldownExpiry > Date.now() ? (
                  <View style={styles.cooldownContainer}>
                    <Ionicons
                      name="hourglass-outline"
                      size={64}
                      color={COLORS.sandBeige}
                    />
                    <CountdownTimer
                      expiryTimestamp={cooldownExpiry}
                      onExpire={handleCooldownExpire}
                      label="System Cooldown"
                      textStyle={styles.cooldownText}
                    />
                    <Text style={styles.cooldownMessage}>
                      Please wait before sending another signal.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.actionContainer}>
                    <TouchableOpacity
                      style={[
                        styles.sosButton,
                        isSending && styles.sosButtonDisabled,
                      ]}
                      onPress={handleSendSOS}
                      disabled={isSending}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sosButtonInner}>
                        {isSending ? (
                          <ActivityIndicator size="large" color="#FFF" />
                        ) : (
                          <>
                            <Text style={styles.sosButtonText}>SOS</Text>
                            <Text style={styles.sosButtonSubtext}>
                              PRESS TO SEND
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.alertsContainer}>
                <ActiveAlertsList />
              </View>
            )}
          </View>
        </View>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={closeAlert}
          type={alertConfig.type}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkSandBrown,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhiteDesert,
  },
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.darkSandBrown,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: COLORS.offWhiteDesert,
    borderWidth: 1,
    borderColor: "rgba(196, 111, 38, 0.2)",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  activeTabText: {
    color: COLORS.desertOrange,
    fontWeight: "700",
  },
  // Content Area
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  sendContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 20,
  },
  sendTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.darkSandBrown,
    marginBottom: 8,
    textAlign: "center",
  },
  sendDescription: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  // SOS Button Styles
  actionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.red,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.3)",
  },
  sosButtonInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sosButtonDisabled: {
    backgroundColor: "#999",
    shadowOpacity: 0,
    elevation: 0,
  },
  sosButtonText: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 2,
  },
  sosButtonSubtext: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 1,
  },
  // Active State Styles
  activeStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  timerWrapper: {
    alignItems: "center",
    marginBottom: 40,
  },
  timerText: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.desertOrange,
    marginBottom: 8,
  },
  timerSubtext: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: "#999",
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 1,
  },
  // Cooldown Styles
  cooldownContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.8,
  },
  cooldownText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    marginTop: 20,
    marginBottom: 8,
  },
  cooldownMessage: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  alertsContainer: {
    flex: 1,
    width: "100%",
  },
  pulseRing: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: COLORS.desertOrange,
    opacity: 0.1,
  },
});

export default SOSModal;
