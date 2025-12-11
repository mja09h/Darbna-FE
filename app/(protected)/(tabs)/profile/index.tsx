import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";

const index = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();

  const handleSettingsPress = () => {
    router.push("/(protected)/(tabs)/profile/(settings)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t.tabs.profile}
      </Text>

      <TouchableOpacity
        style={[styles.settingsButton, { backgroundColor: colors.primary }]}
        onPress={handleSettingsPress}
      >
        <Text
          style={[styles.settingsButtonText, { color: colors.primaryLight }]}
        >
          {t.settings.title}
        </Text>
        <Text style={[styles.arrow, { color: colors.primaryLight }]}>
          {isRTL ? "←" : "→"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  settingsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  arrow: {
    fontSize: 18,
  },
});
