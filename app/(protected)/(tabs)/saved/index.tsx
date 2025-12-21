import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../../../context/ThemeContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { useSettings } from "../../../../context/SettingsContext";
import { useSavedRoutes } from "../../../../context/SavedRoutesContext";
import { useAuth } from "../../../../context/AuthContext";
import { useAlert } from "../../../../context/AlertContext";
import RouteDetailModal from "../../../../components/RouteDetailModal";
import api from "../../../../api/index";
import COLORS from "../../../../data/colors";

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
      // ADD THESE TWO LINES - Include start and end points
      startPoint: recordedRoute.startPoint,
      endPoint: recordedRoute.endPoint,
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
  const { alert } = useAlert();
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

      // Log the routes to verify startPoint and endPoint are present
      console.log("Fetched routes:", JSON.stringify(recorded, null, 2));

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
    console.log("Selected route:", JSON.stringify(route, null, 2));
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
        alert(t.savedRoutes.title, t.savedRoutes.deleteSuccess);
      } catch (error) {
        alert(t.savedRoutes.title, t.savedRoutes.deleteFailed);
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
        activeOpacity={0.7}
        onPress={() => handleRoutePress(item)}
      >
        <View style={styles.routeCard}>
          {/* Route Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getRouteIcon(item.routeId?.routeType) as any}
              size={28}
              color={COLORS.white}
            />
          </View>

          {/* Route Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.routeName} numberOfLines={1}>
              {item.routeId?.name}
            </Text>
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <Ionicons
                  name="resize-outline"
                  size={14}
                  color={COLORS.lightText}
                />
                <Text style={styles.metadataText}>
                  {formatDistance(item.routeId?.distance)}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={COLORS.lightText}
                />
                <Text style={styles.metadataText}>
                  {formatDate(item.savedAt)}
                </Text>
              </View>
            </View>
            {folderName && (
              <View style={styles.folderBadge}>
                <Ionicons
                  name="folder-outline"
                  size={12}
                  color={COLORS.desertOrange}
                />
                <Text style={styles.folderText}>{folderName}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleFavoriteToggle(item._id);
              }}
              style={[
                styles.actionButton,
                item.isFavorite && styles.actionButtonActive,
              ]}
            >
              <Ionicons
                name={item.isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={item.isFavorite ? COLORS.white : COLORS.lightText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRouteDeleted(item._id);
              }}
              style={styles.actionButton}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={COLORS.lightText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.desertOrange} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t.savedRoutes?.title || "Saved Routes"}
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Routes List */}
        {filteredRoutes.length > 0 ? (
          <FlatList
            data={filteredRoutes}
            renderItem={renderRouteItem}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.desertOrange}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="map-outline" size={80} color={COLORS.lightText} />
            </View>
            <Text style={styles.emptyTitle}>
              {t.savedRoutes?.noRoutes || "No routes yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              Start recording routes to see them here
            </Text>
          </View>
        )}
      </View>

      {/* Route Detail Modal */}
      {selectedRoute && (
        <RouteDetailModal
          visible={showRouteModal}
          onClose={handleCloseRouteModal}
          route={selectedRoute}
          onRouteUpdated={handleRouteUpdated}
          onRouteDeleted={handleRouteDeleted}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhiteDesert,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.offWhiteDesert,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: HEADER_BG_COLOR,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  routeItemContainer: {
    marginBottom: 16,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.desertOrange,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 2,
    shadowColor: COLORS.desertOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  infoContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  folderBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.offWhiteDesert,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.sandBeige,
  },
  folderText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.desertOrange,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.offWhiteDesert,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.sandBeige,
  },
  actionButtonActive: {
    backgroundColor: COLORS.desertOrange,
    borderColor: COLORS.desertOrange,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.sandBeige,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.lightText,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default SavedRoutesScreen;
