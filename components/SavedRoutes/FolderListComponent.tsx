import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useSavedRoutes } from "../../context/SavedRoutesContext";
import { useTheme } from "../../context/ThemeContext";

const FolderListComponent = () => {
  const { folders, selectedFolder, setSelectedFolder } = useSavedRoutes();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {folders.map((folder) => (
          <TouchableOpacity
            key={folder._id}
            onPress={() => setSelectedFolder(folder)}
            style={[
              styles.folderButton,
              selectedFolder?._id === folder._id && styles.folderButtonActive,
            ]}
          >
            <Text
              style={[
                styles.folderText,
                selectedFolder?._id === folder._id && styles.folderTextActive,
              ]}
            >
              {folder.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  scrollView: {
    paddingHorizontal: 10,
  },
  folderButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  folderButtonActive: {
    backgroundColor: "#C46F26",
  },
  folderText: {
    fontSize: 14,
    color: "#666",
  },
  folderTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default FolderListComponent;
