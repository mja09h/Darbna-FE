import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface RouteNameModalProps {
  visible: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  distance: number;
  duration: number;
}

const RouteNameModal: React.FC<RouteNameModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  distance,
  duration,
}) => {
  const { colors } = useTheme();
  const [routeName, setRouteName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal is closed
  useEffect(() => {
    if (!visible) {
      setRouteName("");
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!routeName.trim()) {
      Alert.alert("Error", "Please enter a route name");
      return;
    }

    if (routeName.trim().length > 50) {
      Alert.alert("Error", "Route name must not exceed 50 characters");
      return;
    }

    setIsLoading(true);
    try {
      onConfirm(routeName.trim());
      setRouteName("");
    } catch (error) {
      Alert.alert("Error", "Failed to confirm route name");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setRouteName("");
    onCancel();
  };

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)}m`;
    }
    return `${km.toFixed(2)}km`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.overlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Name Your Route
                </Text>
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={isLoading}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Route Stats */}
              <View
                style={[
                  styles.statsContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Distance
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatDistance(distance)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Duration
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatTime(duration)}
                  </Text>
                </View>
              </View>

              {/* Subtitle */}
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter a name for this route:
              </Text>

              {/* Input Field */}
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="My Route"
                placeholderTextColor={colors.textSecondary}
                value={routeName}
                onChangeText={setRouteName}
                maxLength={50}
                editable={!isLoading}
                selectionColor={colors.primary}
              />

              {/* Character Count */}
              <Text
                style={[styles.characterCount, { color: colors.textSecondary }]}
              >
                {routeName.length}/50
              </Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleConfirm}
                  disabled={isLoading || !routeName.trim()}
                >
                  <Text
                    style={[styles.buttonText, { color: colors.background }]}
                  >
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  statsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  characterCount: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 20,
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RouteNameModal;
