import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SocialButtonProps extends TouchableOpacityProps {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  title,
  iconName,
  isLoading,
  style,
  disabled,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonDisabled, style]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#f5e6d3" />
      ) : (
        <Ionicons name={iconName} size={20} color="#f5e6d3" />
      )}
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#f5e6d3",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default SocialButton;
