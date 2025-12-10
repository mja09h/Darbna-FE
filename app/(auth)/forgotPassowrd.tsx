import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#f5e6d3" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/darbna-logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password
        </Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#a89080"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => setEmail(text.trim())}
          />

          <TouchableOpacity style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.backToLoginContainer}>
          <Ionicons name="arrow-back" size={16} color="#ad5410" />
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c120c",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#a89080",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 24,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#f5e6d3",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  resetButton: {
    backgroundColor: "#ad5410",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#ad5410",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonText: {
    color: "#2c120c",
    fontWeight: "bold",
    fontSize: 18,
  },
  backToLoginContainer: {
    flexDirection: "row",
    marginTop: 40,
    alignItems: "center",
    gap: 6,
  },
  backToLoginText: {
    color: "#ad5410",
    fontSize: 15,
    fontWeight: "600",
  },
});
