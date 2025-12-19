import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../../../context/ThemeContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { useSettings } from "../../../../context/SettingsContext";
import { useSavedRoutes } from "../../../../context/SavedRoutesContext";
import { useAuth } from "../../../../context/AuthContext";
import RouteDetailModal from "../../../../components/RouteDetailModal";
import api from "../../../../api/index";



const HEADER_BG_COLOR = "#2c120c";

// Convert recorded route to saved route format
const convertRecordedToSaved = (recordedRoute: any): any => {
  return {
    _id: `recorded_${recordedRoute._id}`,
    routeId: {
      _id: recordedRoute._id,
      name: recordedRoute.name,
      distance: recordedRoute.distance,
      duration: recordedRoute.duration,
      routeType: recordedRoute.routeType,
      description: recordedRoute.description,
      screenshot: recordedRoute.screenshot,
      images: recordedRoute.images,
      path: recordedRoute.path,
      points: recordedRoute.points,
      elevationGain: recordedRoute.elevationGain || 0,
      estimatedTime: recordedRoute.estimatedTime,
      difficulty: recordedRoute.difficulty || "Moderate",
      rating: recordedRoute.rating || 4.0,
      location: recordedRoute.location || "",
      terrain: recordedRoute.terrain || "trail",
      isPublic: recordedRoute.isPublic,
      userId: recordedRoute.userId,
    },
    folderId: {
      _id: recordedRoute.isPublic ? "public_routes" : "my_routes",
      name: recordedRoute.isPublic ? "Public Routes" : "My Routes",
    },
    isFavorite: false,
    savedAt: recordedRoute.createdAt,
    isRecordedRoute: true, // Flag to identify recorded routes
  };
};

const SavedRoutesScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const { units } = useSettings();
  const { user } = useAuth();
  const {
    savedRoutes: contextSavedRoutes,
    folders,
    loading: contextLoading,
    fetchSavedRoutes,
    toggleFavorite,
    deleteSavedRoute,
  } = useSavedRoutes();

  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [recordedRoutes, setRecordedRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [contextSavedRoutes]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await fetchUserRecordedRoutes();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecordedRoutes = async () => {
    try {
      const response = await api.get("/routes");
      const recorded = response.data || [];
      setRecordedRoutes(recorded);

      // Combine saved routes from context with recorded routes
      const convertedRecorded = recorded.map(convertRecordedToSaved);
      const combined = [...contextSavedRoutes, ...convertedRecorded];
      setAllRoutes(combined);
    } catch (error: any) {
      console.error("Error fetching recorded routes:", error);
      // If error, just use context saved routes
      setAllRoutes([...contextSavedRoutes]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSavedRoutes();
    await fetchUserRecordedRoutes();
    setRefreshing(false);
  };

  const handleRoutePress = (route: any) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const handleCloseRouteModal = () => {
    setShowRouteModal(false);
    setSelectedRoute(null);
  };

  const handleRouteUpdated = async () => {
    // Refresh data after route is updated
    await handleRefresh();
  };

  const handleRouteDeleted = async (routeId: string) => {
    // Check if it's a recorded route
    if (routeId.startsWith("recorded_")) {
      const actualId = routeId.replace("recorded_", "");
      try {
        await api.delete(`/routes/${actualId}`);
        await handleRefresh();
        Alert.alert(t.savedRoutes.title, t.savedRoutes.deleteSuccess);
      } catch (error) {
        Alert.alert(t.savedRoutes.title, t.savedRoutes.deleteFailed);
      }
    } else {
      // It's a saved route from context
      await deleteSavedRoute(routeId);
      await handleRefresh();
    }
    handleCloseRouteModal();
  };

  const handleFavoriteToggle = async (routeId: string) => {
    // Only works for saved routes, not recorded routes
    if (!routeId.startsWith("recorded_")) {
      await toggleFavorite(routeId);
      await handleRefresh();
    }
  };

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
    return d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const filteredRoutes = allRoutes.filter((route) => {
    const matchesSearch = route.routeId?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder
      ? route.folderId?._id === selectedFolder
      : true;
    return matchesSearch && matchesFolder;
  });

  const renderRouteItem = ({ item }: { item: any }) => {
    const isRecorded = item.isRecordedRoute;
    const folderName = item.folderId?.name || "Uncategorized";

    return (
      <TouchableOpacity
        style={styles.routeItemContainer}
        activeOpacity={0.8}
        onPress={() => handleRoutePress(item)}
      >
        <View
          style={[
            styles.routeCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Route Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
          >
            <Ionicons
              name={getRouteIcon(item.routeId?.routeType) as any}
              size={26}
              color={colors.primary}
            />
          </View>

          {/* Route Info */}
          <View style={styles.infoContainer}>
            <Text
              style={[styles.routeName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.routeId?.name || "Unnamed Route"}
            </Text>
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.metadata, { color: colors.textSecondary }]}
                >
                  {formatDistance(item.routeId?.distance || 0)}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.metadata, { color: colors.textSecondary }]}
                >
                  {formatDate(item.savedAt)}
                </Text>
              </View>
            </View>
            {/* Folder Badge */}
            <View
              style={[
                styles.folderBadge,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons
                name="folder-outline"
                size={12}
                color={colors.primary}
              />
              <Text style={[styles.folderName, { color: colors.primary }]}>
                {folderName}
              </Text>
              {item.routeId?.isPublic && (
                <Ionicons
                  name="globe-outline"
                  size={12}
                  color={colors.primary}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>

          {/* Favorite Icon */}
          {!isRecorded && (
            <TouchableOpacity
              onPress={() => handleFavoriteToggle(item._id)}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={item.isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={item.isFavorite ? "#e74c3c" : colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {/* Chevron Icon */}
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFolderList = () => {
    const allFolders = [
      { _id: null, name: t.savedRoutes.title, count: allRoutes.length },
      ...folders.map((folder) => ({
        ...folder,
        count: allRoutes.filter((r) => r.folderId?._id === folder._id).length,
      })),
    ];

    return (
      <View style={styles.folderListContainer}>
        <FlatList
          horizontal
          data={allFolders}
          keyExtractor={(item) => item._id || "all"}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.folderChip,
                {
                  backgroundColor:
                    selectedFolder === item._id
                      ? colors.primary
                      : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedFolder(item._id)}
            >
              <Text
                style={[
                  styles.folderChipText,
                  {
                    color:
                      selectedFolder === item._id
                        ? colors.background
                        : colors.text,
                  },
                ]}
              >
                {item.name} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.folderListContent}
        />
      </View>
    );
  };

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={styles.searchModalOverlay}>
        <View
          style={[
            styles.searchModalContent,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.searchModalHeader}>
            <Text style={[styles.searchModalTitle, { color: colors.text }]}>
              Search Routes
            </Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by route name..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowSearchModal(false)}
          >
            <Text
              style={[styles.searchButtonText, { color: colors.background }]}
            >
              Apply Search
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && allRoutes.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.savedRoutes.title}</Text>
        </View>
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.savedRoutes.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search-outline" size={24} color="#f5e6d3" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderFolderList()}

        {filteredRoutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons
                name="bookmark-outline"
                size={80}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? "No routes found" : t.savedRoutes.noRoutes}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery
                ? "Try a different search term"
                : t.savedRoutes.noRoutesDescription}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRoutes}
            renderItem={renderRouteItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      {renderSearchModal()}

      <RouteDetailModal
        visible={showRouteModal}
        onClose={handleCloseRouteModal}
        route={selectedRoute}
        onRouteUpdated={handleRouteUpdated}
        onRouteDeleted={handleRouteDeleted}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f5e6d3",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  folderListContainer: {
    paddingVertical: 16,
  },
  folderListContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  folderChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  folderChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  routeItemContainer: {
    marginBottom: 16,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  infoContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 17,
    fontWeight: "700",
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
  },
  folderName: {
    fontSize: 12,
    fontWeight: "600",
  },
  favoriteButton: {
    padding: 8,
    marginRight: 4,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },

  // Search Modal Styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  searchModalContent: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  searchModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  searchModalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default SavedRoutesScreen;
