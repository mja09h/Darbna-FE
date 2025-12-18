import React, { useEffect, useState } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { useSettings } from "../../../../context/SettingsContext";
import {
  SavedRoutesProvider,
  useSavedRoutes,
} from "../../../../context/SavedRoutesContext";
import { ISavedRoute } from "../../../../context/SavedRoutesContext";

// Darbna Brand Colors
const COLORS = {
  desertOrange: "#C46F26",
  darkSandBrown: "#3A1D1A",
  palmBrown: "#7D4828",
  sandBeige: "#E9DCCF",
  offWhiteDesert: "#F4EEE7",
  white: "#FFFFFF",
  text: "#333333",
  lightText: "#666666",
  darkBackground: "#1a1a1a",
  darkCard: "#2a2a2a",
};

// ==================== HEADER COMPONENT ====================
const HeaderComponent = ({ onSearchPress }: { onSearchPress: () => void }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Saved Routes</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={onSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== FOLDER LIST COMPONENT ====================
const FolderListComponent = () => {
  const { folders, selectedFolder, setSelectedFolder } = useSavedRoutes();

  if (!folders || folders.length === 0) {
    return null;
  }

  return (
    <View style={styles.folderListContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.folderScrollView}
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

// ==================== ROUTE ITEM COMPONENT ====================
const RouteItem = ({ route }: { route: ISavedRoute }) => {
  const { deleteSavedRoute, toggleFavorite } = useSavedRoutes();
  const { units } = useSettings();

  const formatDistance = (km: number): string => {
    if (units === "miles") {
      const miles = km * 0.621371;
      return miles < 1
        ? `${(miles * 5280).toFixed(0)} ft`
        : `${miles.toFixed(2)} mi`;
    }
    return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this saved route?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavedRoute(route._id);
            } catch (error) {
              // Error handled silently
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(route._id);
    } catch (error) {
      // Error handled silently
    }
  };

  const getRouteIcon = (routeType?: string): string => {
    switch (routeType) {
      case "Running":
        return "fitness-outline";
      case "Cycling":
        return "bicycle-outline";
      case "Walking":
        return "walk-outline";
      case "Hiking":
        return "trail-sign-outline";
      default:
        return "map-outline";
    }
  };

  return (
    <TouchableOpacity style={styles.routeItemContainer} activeOpacity={0.8}>
      <View style={styles.routeCard}>
        {/* Route Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={getRouteIcon(route.routeId.routeType) as any}
            size={26}
            color={COLORS.desertOrange}
          />
        </View>

        {/* Route Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.routeName} numberOfLines={1}>
            {route.routeId.name}
          </Text>
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Ionicons
                name="navigate-outline"
                size={14}
                color={COLORS.lightText}
              />
              <Text style={styles.metadata}>
                {formatDistance(route.routeId.distance)}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.lightText}
              />
              <Text style={styles.metadata}>{formatDate(route.savedAt)}</Text>
            </View>
          </View>
          {route.folderId && (
            <View style={styles.folderBadge}>
              <Ionicons
                name="folder-outline"
                size={12}
                color={COLORS.desertOrange}
              />
              <Text style={styles.folder}>{route.folderId.name}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={[
              styles.actionButton,
              route.isFavorite && styles.actionButtonActive,
            ]}
          >
            <Ionicons
              name={route.isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={route.isFavorite ? COLORS.desertOrange : COLORS.lightText}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ==================== ROUTE LIST COMPONENT ====================
const RouteListComponent = () => {
  const {
    savedRoutes,
    loading,
    fetchSavedRoutes,
    selectedFolder,
    searchQuery,
  } = useSavedRoutes();

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        await fetchSavedRoutes(selectedFolder?._id);
      } catch (error) {
        // Silently handle error
      }
    };

    loadRoutes();
  }, [selectedFolder]);

  const filteredRoutes = savedRoutes.filter((route) =>
    route.routeId.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.desertOrange} />
      </View>
    );
  }

  if (filteredRoutes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="map-outline" size={80} color={COLORS.desertOrange} />
        </View>
        <Text style={styles.emptyText}>No saved routes</Text>
        <Text style={styles.emptySubText}>
          {searchQuery
            ? "No routes match your search"
            : "Start by saving your first route"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredRoutes}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <RouteItem route={item} />}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

// ==================== SEARCH MODAL COMPONENT ====================
const SearchModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { searchQuery, setSearchQuery } = useSavedRoutes();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
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
                placeholderTextColor="#666"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==================== MAIN CONTENT COMPONENT ====================
const SavedRoutesContent = () => {
  const { fetchFolders } = useSavedRoutes();
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        await fetchFolders();
      } catch (error) {
        // Silently handle error
      }
    };

    loadFolders();
  }, []);

  return (
    <View style={styles.container}>
      <HeaderComponent onSearchPress={() => setShowSearchModal(true)} />
      <FolderListComponent />
      <RouteListComponent />
      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </View>
  );
};

// ==================== MAIN SCREEN COMPONENT ====================
const SavedRoutesScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <SavedRoutesProvider>
        <SavedRoutesContent />
      </SavedRoutesProvider>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkSandBrown,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },

  // Header Styles
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: COLORS.darkSandBrown,
    borderBottomWidth: 0,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  searchIconButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: COLORS.offWhiteDesert,
    justifyContent: "center",
    alignItems: "center",
  },
  // Search Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-start",
  },
  modalContent: {
    backgroundColor: COLORS.darkSandBrown,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 60,
    paddingBottom: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkCard,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#404040",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "500",
  },
  closeButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: "#404040",
  },

  // Folder List Styles
  folderListContainer: {
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.darkBackground,
  },
  folderScrollView: {
    paddingHorizontal: 20,
  },
  folderButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: "#404040",
  },
  folderButtonActive: {
    backgroundColor: COLORS.desertOrange,
    borderColor: COLORS.desertOrange,
    elevation: 2,
    shadowColor: COLORS.desertOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  folderText: {
    fontSize: 14,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  folderTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },

  // Route List Styles
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.darkCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    marginTop: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 15,
    color: COLORS.lightText,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },

  // Route Item Styles
  routeItemContainer: {
    marginBottom: 16,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#404040",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sandBeige + "20",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.desertOrange + "30",
  },
  infoContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadata: {
    fontSize: 13,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  folderBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.desertOrange + "20",
    marginTop: 4,
  },
  folder: {
    fontSize: 12,
    color: COLORS.desertOrange,
    fontWeight: "600",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 8,
  },
  actionButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.darkBackground,
  },
  actionButtonActive: {
    backgroundColor: COLORS.desertOrange + "20",
  },
});

export default SavedRoutesScreen;
