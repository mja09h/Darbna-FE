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
  Modal,
  FlatList,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COUNTRIES } from "../../data/Countries";

const Register = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setCountryModalVisible(false);
    setCountrySearch("");
  };

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

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#a89080"
            value={name}
            onChangeText={(text) => setName(text.trim())}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#a89080"
            autoCapitalize="none"
            value={username}
            onChangeText={(text) => setUsername(text.trim())}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#a89080"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => setEmail(text.trim())}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#a89080"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#a89080"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setCountryModalVisible(true)}
          >
            <Text
              style={[
                styles.countrySelectorText,
                !selectedCountry && styles.countrySelectorPlaceholder,
              ]}
            >
              {selectedCountry || "Select Country"}
            </Text>
            <Text style={styles.countrySelectorArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Sign Up</Text>
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

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => {
                  setCountryModalVisible(false);
                  setCountrySearch("");
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              placeholderTextColor="#a89080"
              value={countrySearch}
              onChangeText={(text) => setCountrySearch(text.trim())}
              autoFocus
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry === item && styles.countryItemSelected,
                  ]}
                  onPress={() => handleSelectCountry(item)}
                >
                  <Text
                    style={[
                      styles.countryItemText,
                      selectedCountry === item &&
                        styles.countryItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noResults}>No countries found</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default Register;

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
    width: 140,
    height: 140,
    borderRadius: 140,
    marginBottom: 15,
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
    marginBottom: 25,
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
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  countrySelector: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countrySelectorText: {
    fontSize: 16,
    color: "#f5e6d3",
  },
  countrySelectorPlaceholder: {
    color: "#a89080",
  },
  countrySelectorArrow: {
    color: "#a89080",
    fontSize: 12,
  },
  registerButton: {
    backgroundColor: "#ad5410",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#ad5410",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonText: {
    color: "#2c120c",
    fontWeight: "bold",
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
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
  loginContainer: {
    flexDirection: "row",
    marginTop: 30,
    alignItems: "center",
    gap: 6,
  },
  loginText: {
    color: "#a89080",
    fontSize: 15,
  },
  loginLink: {
    color: "#ad5410",
    fontSize: 15,
    fontWeight: "bold",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2c120c",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(168, 144, 128, 0.2)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  modalClose: {
    fontSize: 20,
    color: "#a89080",
    padding: 5,
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#f5e6d3",
    marginVertical: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  countryItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  countryItemSelected: {
    backgroundColor: "rgba(173, 84, 16, 0.2)",
  },
  countryItemText: {
    fontSize: 16,
    color: "#f5e6d3",
  },
  countryItemTextSelected: {
    color: "#ad5410",
    fontWeight: "600",
  },
  noResults: {
    color: "#a89080",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
