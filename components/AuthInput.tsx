import React from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AuthInputProps extends TextInputProps {
  error?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  isLoading?: boolean;
}

const AuthInput: React.FC<AuthInputProps> = ({
  error,
  isPassword,
  showPassword,
  onTogglePassword,
  isLoading,
  style,
  ...props
}) => {
  return (
    <View style={styles.inputWrapper}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            isPassword && styles.passwordInput,
            style,
          ]}
          placeholderTextColor="#a89080"
          secureTextEntry={isPassword && !showPassword}
          editable={!isLoading}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={onTogglePassword}
            disabled={isLoading}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#a89080"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#f5e6d3",
    borderWidth: 2,
    borderColor: "transparent",
  },
  passwordInput: {
    paddingRight: 50,
  },
  inputError: {
    borderColor: "#ff6b6b",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default AuthInput;
