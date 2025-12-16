// components/SOSModal.tsx
import React, { useState } from "react";
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
import { createSOSAlert } from "../api/sos";
import ActiveAlertsList from "./ActiveAlertsList";

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
}

const SOSModal = ({ visible, onClose }: SOSModalProps) => {
  const [activeTab, setActiveTab] = useState("send");
  const [isSending, setIsSending] = useState(false);
  console.log("SOSModal", visible);
  const handleSendSOS = async () => {
    setIsSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Permission denied");
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await createSOSAlert({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert("SOS Sent", "Your alert has been broadcast.");
      onClose();
    } catch (error: any) {
      if (error.response?.status === 429) {
        Alert.alert("Rate Limit", error.response.data.message);
      } else {
        Alert.alert("Error", "Could not send SOS alert.");
      }
    } finally {
      setIsSending(false);
    }
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
  alertsContainer: {
    flex: 1,
  },
});

export default SOSModal;
