import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSOSAlert, resolveSOSAlert } from "../api/sos";
import ActiveAlertsList from "./ActiveAlertsList";
import CountdownTimer from "./CountdownTimer";

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
}

const SOSModal = ({ visible, onClose }: SOSModalProps) => {
  const [activeTab, setActiveTab] = useState("send");
  const [isSending, setIsSending] = useState(false);
  const [sosExpiry, setSosExpiry] = useState<number | null>(null);
  const [cooldownExpiry, setCooldownExpiry] = useState<number | null>(null);
  const [activeSosAlertId, setActiveSosAlertId] = useState<string | null>(null);

  console.log("SOSModal", visible);

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Permission denied");
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const alert = await createSOSAlert({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // FIXED: Set 2-hour timer
      const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      setSosExpiry(expiry);
      setActiveSosAlertId(alert._id);
      await AsyncStorage.setItem("sosExpiry", String(expiry));
      await AsyncStorage.setItem("activeSosAlertId", alert._id);

      Alert.alert("SOS Sent", "Your alert has been broadcast.");
    } catch (error: any) {
      if (error.response?.status === 429) {
        Alert.alert("Rate Limit", error.response.data.message);
        // FIXED: Set cooldown timer if rate limited
        const timeLeftMatch =
          error.response.data.message.match(/(\d+)\s+minute/);
        if (timeLeftMatch) {
          const minutesLeft = parseInt(timeLeftMatch[1]);
          const expiry = Date.now() + minutesLeft * 60 * 1000;
          setCooldownExpiry(expiry);
          await AsyncStorage.setItem("cooldownExpiry", String(expiry));
        }
      } else {
        Alert.alert("Error", "Could not send SOS alert.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelSOS = async () => {
    if (!activeSosAlertId) {
      Alert.alert("Error", "No active SOS to cancel");
      return;
    }

    Alert.alert(
      "Cancel SOS",
      "Are you sure you want to cancel your SOS alert?",
      [
        { text: "No" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              // Verify token exists before making request
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                Alert.alert(
                  "Error",
                  "Authentication required. Please log in again."
                );
                return;
              }

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

              Alert.alert("Success", "Your SOS alert has been canceled.");
            } catch (error: any) {
              console.error("Error canceling SOS:", error);

              // Handle specific error cases
              let errorMessage = "Could not cancel SOS alert.";

              if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 403) {
                  errorMessage =
                    data?.message ||
                    "You don't have permission to cancel this SOS. It may have already been cancelled or you're not the owner.";
                } else if (status === 404) {
                  errorMessage = "SOS alert not found or already cancelled.";
                } else if (status === 401) {
                  errorMessage = "Authentication failed. Please log in again.";
                } else if (data?.message) {
                  errorMessage = data.message;
                }
              } else if (error.message) {
                errorMessage = error.message;
              }

              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
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
      <SafeAreaView style={styles.container}>
        {/* Header with Title and Close Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SOS Alert</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "send" && styles.activeTab]}
            onPress={() => setActiveTab("send")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "send" && styles.activeTabText,
              ]}
            >
              Send SOS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "alerts" && styles.activeTab]}
            onPress={() => setActiveTab("alerts")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "alerts" && styles.activeTabText,
              ]}
            >
              Active Alerts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "send" ? (
          <View style={styles.sendContainer}>
            <View style={styles.sendContent}>
              <Ionicons name="warning" size={64} color="#D9534F" />
              <Text style={styles.sendTitle}>Emergency SOS</Text>
              <Text style={styles.sendDescription}>
                Press the button below to send an emergency alert to nearby
                users
              </Text>

              {/* FIXED: Show 2-hour countdown timer when SOS is active */}
              {sosExpiry && sosExpiry > Date.now() ? (
                <View style={styles.timerContainer}>
                  <CountdownTimer
                    expiryTimestamp={sosExpiry}
                    onExpire={handleSosExpire}
                    label="SOS Active - Time Remaining"
                  />
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelSOS}
                  >
                    <Text style={styles.cancelButtonText}>Cancel SOS</Text>
                  </TouchableOpacity>
                </View>
              ) : cooldownExpiry && cooldownExpiry > Date.now() ? (
                // FIXED: Show 30-minute cooldown timer
                <View style={styles.timerContainer}>
                  <CountdownTimer
                    expiryTimestamp={cooldownExpiry}
                    onExpire={handleCooldownExpire}
                    label="Cooldown - Try Again In"
                  />
                  <Text style={styles.cooldownMessage}>
                    You must wait before sending another SOS
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    isSending && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendSOS}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>SEND SOS</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.alertsContainer}>
            <ActiveAlertsList />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#D9534F",
  },
  tabText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#D9534F",
    fontWeight: "700",
  },
  sendContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sendContent: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  sendTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginTop: 20,
    marginBottom: 12,
  },
  sendDescription: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  sendButton: {
    backgroundColor: "#D9534F",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  cancelButton: {
    backgroundColor: "#666666",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cooldownMessage: {
    fontSize: 14,
    color: "#666666",
    marginTop: 12,
    textAlign: "center",
  },
  alertsContainer: {
    flex: 1,
  },
});

export default SOSModal;
