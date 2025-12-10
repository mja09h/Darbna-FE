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

const Login = () => {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/darbna-logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor="#a89080"
            autoCapitalize="none"
            value={emailOrUsername}
            onChangeText={(text) => setEmailOrUsername(text.trim())}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#a89080"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/(auth)/forgotPassowrd")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtonsColumn}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={20} color="#f5e6d3" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={20} color="#f5e6d3" />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

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
  logo: {
    width: 180,
    height: 180,
    borderRadius: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#ad5410",
    marginTop: 5,
    marginBottom: 30,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#f5e6d3",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#ad5410",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
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
  loginButtonText: {
    color: "#2c120c",
    fontWeight: "bold",
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 35,
    marginBottom: 25,
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(168, 144, 128, 0.3)",
  },
  dividerText: {
    color: "#a89080",
    fontSize: 14,
    marginHorizontal: 15,
  },
  socialButtonsColumn: {
    width: "100%",
    gap: 12,
  },
  socialButton: {
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
  socialButtonText: {
    color: "#f5e6d3",
    fontWeight: "600",
    fontSize: 16,
  },
  signUpContainer: {
    flexDirection: "row",
    marginTop: 35,
    alignItems: "center",
    gap: 6,
  },
  signUpText: {
    color: "#a89080",
    fontSize: 15,
  },
  signUpLink: {
    color: "#ad5410",
    fontSize: 15,
    fontWeight: "bold",
  },
});
