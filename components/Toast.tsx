import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ToastType = "error" | "success" | "warning" | "info";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "error",
  onDismiss,
  duration = 4000,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "rgba(34, 139, 34, 0.95)",
          borderColor: "#2d8a2d",
          icon: "checkmark-circle" as const,
          iconColor: "#90EE90",
        };
      case "warning":
        return {
          backgroundColor: "rgba(204, 133, 0, 0.95)",
          borderColor: "#cc8500",
          icon: "warning" as const,
          iconColor: "#FFE4B5",
        };
      case "info":
        return {
          backgroundColor: "rgba(30, 90, 130, 0.95)",
          borderColor: "#1e5a82",
          icon: "information-circle" as const,
          iconColor: "#87CEEB",
        };
      case "error":
      default:
        return {
          backgroundColor: "rgba(139, 35, 35, 0.95)",
          borderColor: "#8b2323",
          icon: "close-circle" as const,
          iconColor: "#ffb3b3",
        };
    }
  };

  if (!visible) return null;

  const typeStyles = getTypeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: typeStyles.backgroundColor,
          borderColor: typeStyles.borderColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={typeStyles.icon}
            size={24}
            color={typeStyles.iconColor}
          />
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});
