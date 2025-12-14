import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss: () => void;
  type?: "success" | "error" | "warning" | "info";
  scrollable?: boolean;
  monospace?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: "OK", style: "default", onPress: () => {} }],
  onDismiss,
  type = "info",
  scrollable = false,
  monospace = false,
}) => {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        scaleAnim.setValue(0.9);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle", color: "#4CAF50" };
      case "error":
        return { name: "alert-circle", color: "#F44336" };
      case "warning":
        return { name: "warning", color: "#FF9800" };
      default:
        return { name: "information-circle", color: "#ad5410" };
    }
  };

  const iconInfo = getIcon();
  const isVertical = buttons.length > 2;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: "#2c120c", // Dark background like header
              borderColor: "#ad5410", // Primary color border
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.contentContainer}>
            <View
              style={[styles.iconContainer, { borderColor: iconInfo.color }]}
            >
              <Ionicons
                name={iconInfo.name as any}
                size={32}
                color={iconInfo.color}
              />
            </View>

            <Text style={[styles.title, { color: "#f5e6d3" }]}>{title}</Text>
            {scrollable ? (
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
              >
                <Text
                  style={[
                    styles.message,
                    { color: "#a89080" },
                    monospace && styles.monospace,
                  ]}
                >
                  {message}
                </Text>
              </ScrollView>
            ) : (
              <Text
                style={[
                  styles.message,
                  { color: "#a89080" },
                  monospace && styles.monospace,
                ]}
              >
                {message}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.buttonContainer,
              isVertical ? styles.verticalButtons : styles.horizontalButtons,
              { borderTopColor: "rgba(173, 84, 16, 0.3)" }, // subtle primary border
            ]}
          >
            {buttons.map((btn, index) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";

              let textColor = "#f5e6d3"; // Default text color
              if (isCancel) textColor = "#a89080";
              if (isDestructive) textColor = "#F44336";
              if (!isCancel && !isDestructive) textColor = "#ad5410"; // Primary color for default action

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isVertical
                      ? styles.verticalButton
                      : styles.horizontalButton,
                    // Add border separator for horizontal buttons (except last)
                    !isVertical &&
                      index < buttons.length - 1 && {
                        borderRightWidth: 1,
                        borderRightColor: "rgba(173, 84, 16, 0.3)",
                      },
                    // Add border separator for vertical buttons (except last)
                    isVertical &&
                      index < buttons.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(173, 84, 16, 0.3)",
                      },
                  ]}
                  onPress={() => {
                    onDismiss();
                    btn.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: textColor,
                        fontWeight: isCancel ? "400" : "600",
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)", // Darker overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  alertContainer: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 2,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    overflow: "hidden",
  },
  contentContainer: {
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  scrollContainer: {
    maxHeight: 300,
    width: "100%",
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  monospace: {
    fontFamily: "Courier",
    fontSize: 12,
    textAlign: "left",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
    borderTopWidth: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  horizontalButtons: {
    flexDirection: "row",
  },
  verticalButtons: {
    flexDirection: "column",
  },
  button: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalButton: {
    flex: 1,
  },
  verticalButton: {
    width: "100%",
  },
  buttonText: {
    fontSize: 17,
  },
});
