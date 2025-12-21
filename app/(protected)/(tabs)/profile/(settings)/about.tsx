import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../../../context/LanguageContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../../../../data/colors";

const HEADER_BG_COLOR = "#2c120c";

// Team members data - Update with actual images and names
interface TeamMember {
  id: string;
  name: string;
  image: any; // Will be require() for local images or URI string
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Member 1", // Replace with actual name
    image: null, // Replace with require("./path/to/image1.jpg") or image URI
  },
  {
    id: "2",
    name: "Member 2", // Replace with actual name
    image: null, // Replace with require("./path/to/image2.jpg") or image URI
  },
  {
    id: "3",
    name: "Member 3", // Replace with actual name
    image: null, // Replace with require("./path/to/image3.jpg") or image URI
  },
  {
    id: "4",
    name: "Member 4", // Replace with actual name
    image: null, // Replace with require("./path/to/image4.jpg") or image URI
  },
  {
    id: "5",
    name: "Member 5", // Replace with actual name
    image: null, // Replace with require("./path/to/image5.jpg") or image URI
  },
];

const AboutScreen = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={28}
            color="#f5e6d3"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings.about}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[styles.contentWrapper, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.content, { color: colors.text }]}>
            Welcome to Darbna, your trusted companion for exploring and
            navigating your journey. Our mission is to provide you with the best
            experience as you discover new places and create lasting memories.
          </Text>
          <Text style={[styles.content, { color: colors.text }]}>
            Darbna is designed to help you find your way, connect with
            communities, and make the most of your adventures. We are committed
            to providing a seamless and intuitive experience for all our users.
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Our Mission
          </Text>
          <Text style={[styles.content, { color: colors.text }]}>
            To empower travelers and explorers with the tools they need to
            navigate confidently and discover amazing places around them.
          </Text>
          {/* Team 5 Section */}
          <View style={styles.teamSection}>
            <View style={styles.teamHeader}>
              <View style={styles.teamHeaderIcon}>
                <Ionicons name="people" size={28} color={COLORS.desertOrange} />
              </View>
              <View style={styles.teamHeaderText}>
                <Text style={[styles.teamSectionTitle, { color: colors.text }]}>
                  Team Members
                </Text>
                <Text
                  style={[
                    styles.teamSectionSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  The talented developers behind Darbna
                </Text>
              </View>
            </View>

            {/* Team Members Grid */}
            <View style={styles.teamGrid}>
              {TEAM_MEMBERS.map((member, index) => (
                <View key={member.id} style={styles.teamMemberCard}>
                  <View style={styles.memberImageWrapper}>
                    <View style={styles.memberImageContainer}>
                      {member.image ? (
                        <Image
                          source={
                            typeof member.image === "string"
                              ? { uri: member.image }
                              : member.image
                          }
                          style={styles.memberImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.memberImagePlaceholder}>
                          <Ionicons
                            name="person"
                            size={50}
                            color={COLORS.lightText}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.memberBadge}>
                      <Text style={styles.memberBadgeText}>{index + 1}</Text>
                    </View>
                  </View>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {member.name}
                  </Text>
                  <View style={styles.memberRole}>
                    <Ionicons
                      name="code-working"
                      size={12}
                      color={COLORS.desertOrange}
                    />
                    <Text style={styles.memberRoleText}>Developer</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Version
          </Text>
          <Text style={[styles.content, { color: colors.textSecondary }]}>
            1.0.0
          </Text>
        </ScrollView>
      </View>
    </View>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  headerSpacer: {
    width: 40,
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  teamSection: {
    marginTop: 32,
    marginBottom: 8,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.sandBeige,
  },
  teamHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.offWhiteDesert,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.desertOrange,
  },
  teamHeaderText: {
    flex: 1,
  },
  teamSectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.darkSandBrown,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  teamSectionSubtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  teamMemberCard: {
    width: "48%",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    paddingTop: 24,
    borderWidth: 2,
    borderColor: COLORS.sandBeige,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  memberImageWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  memberImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    backgroundColor: COLORS.offWhiteDesert,
    borderWidth: 4,
    borderColor: COLORS.desertOrange,
    elevation: 4,
    shadowColor: COLORS.desertOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  memberImage: {
    width: "100%",
    height: "100%",
  },
  memberImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.sandBeige,
  },
  memberBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.desertOrange,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },
  memberName: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.darkSandBrown,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  memberRole: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.offWhiteDesert,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.sandBeige,
  },
  memberRoleText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.desertOrange,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
