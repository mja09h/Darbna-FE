import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const TermsScreen = () => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.settings.termsOfService}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t.settings.termsOfService}
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          1. Acceptance of Terms
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          By accessing and using Darbna, you accept and agree to be bound by the
          terms and provision of this agreement. If you do not agree to abide by
          the above, please do not use this service.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          2. Use License
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          Permission is granted to temporarily download one copy of Darbna for
          personal, non-commercial transitory viewing only. This is the grant of
          a license, not a transfer of title, and under this license you may
          not: modify or copy the materials; use the materials for any
          commercial purpose; attempt to decompile or reverse engineer any
          software contained in Darbna; remove any copyright or other
          proprietary notations from the materials.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          3. Disclaimer
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          The materials on Darbna are provided on an 'as is' basis. Darbna makes
          no warranties, expressed or implied, and hereby disclaims and negates
          all other warranties including without limitation, implied warranties
          or conditions of merchantability, fitness for a particular purpose, or
          non-infringement of intellectual property or other violation of
          rights.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          4. Limitations
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          In no event shall Darbna or its suppliers be liable for any damages
          (including, without limitation, damages for loss of data or profit, or
          due to business interruption) arising out of the use or inability to
          use Darbna, even if Darbna or a Darbna authorized representative has
          been notified orally or in writing of the possibility of such damage.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          5. Revisions
        </Text>
        <Text style={[styles.content, { color: colors.text }]}>
          Darbna may revise these terms of service for its app at any time
          without notice. By using Darbna you are agreeing to be bound by the
          then current version of these terms of service.
        </Text>
      </ScrollView>
    </View>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
});
