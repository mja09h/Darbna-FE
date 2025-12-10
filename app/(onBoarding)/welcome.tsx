import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";

const Welcome = () => {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/(onBoarding)/getStarted");
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/darbna-logo.png')} style={styles.logo} />
      
      <Text style={styles.title}>{t.welcome.title}</Text>
      <Text style={styles.subtitle}>{t.welcome.subtitle}</Text>

      <View style={styles.languageContainer}>
        <Text style={styles.languageText}>{t.welcome.chooseLanguage}</Text>

        <View style={styles.languageButtonsRow}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === "en" && styles.languageButtonActive,
            ]}
            onPress={() => setLanguage("en")}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === "en" && styles.languageButtonTextActive,
              ]}
            >
              {t.welcome.english}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageButton,
              language === "ar" && styles.languageButtonActive,
            ]}
            onPress={() => setLanguage("ar")}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === "ar" && styles.languageButtonTextActive,
              ]}
            >
              {t.welcome.arabic}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>{t.welcome.getStarted}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c120c",
    paddingHorizontal: 30,
  },
  logo: {
    width: 300,
    height: 300,
    borderRadius: 300,
    margin: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 22,
    color: "#ad5410",
    marginTop: 5,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#ad5410",
    paddingVertical: 16,
    paddingHorizontal: 100,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: "#ad5410",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "#2c120c",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
  languageContainer: {
    alignItems: "center",
    width: "100%",
  },
  languageText: {
    fontSize: 16,
    color: "#a89080",
    marginBottom: 16,
  },
  languageButtonsRow: {
    flexDirection: "row",
    gap: 16,
  },
  languageButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 130,
  },
  languageButtonActive: {
    backgroundColor: "rgba(173, 84, 16, 0.2)",
    borderColor: "#ad5410",
  },
  languageButtonText: {
    color: "#a89080",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
  languageButtonTextActive: {
    color: "#f5e6d3",
  },
});
