import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSavedRoutes } from "../../context/SavedRoutesContext";
import { useTheme } from "../../context/ThemeContext";

interface HeaderComponentProps {
  onFilterPress?: () => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ onFilterPress }) => {
  const { searchQuery, setSearchQuery } = useSavedRoutes();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background || "#fff" },
      ]}
    >
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search saved routes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#ccc"
        />
      </View>

      <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
        <Ionicons name="funnel" size={20} color="#C46F26" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: "#333",
  },
  filterButton: {
    padding: 8,
  },
});

export default HeaderComponent;
