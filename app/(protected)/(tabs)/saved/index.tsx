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
              {item.routeId?.name}
            </Text>
            <Text style={[styles.metadata, { color: colors.textSecondary }]}>
              {formatDistance(item.routeId?.distance)} •{" "}
              {formatDate(item.savedAt)}
            </Text>
            {folderName && (
              <Text style={[styles.folder, { color: colors.primary }]}>
                {folderName}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={() => handleFavoriteToggle(item._id)}
              style={styles.actionButton}
            >
              <Ionicons
                name={item.isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={item.isFavorite ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRouteDeleted(item._id)}
              style={styles.actionButton}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: HEADER_BG_COLOR }]}>
          <Text style={styles.headerTitle}>
            {t.savedRoutes?.title || "Saved Routes"}
          </Text>
          <TouchableOpacity onPress={() => setShowSearchModal(true)}>
            <Ionicons name="search" size={24} color="#fff" />
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
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="map-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t.savedRoutes?.noRoutes || "No routes yet"}
            </Text>
          </View>
        )}
      </SafeAreaView>

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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routeItemContainer: {
    marginBottom: 12,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
  },
  infoContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  metadata: {
    fontSize: 13,
    marginBottom: 4,
  },
  folder: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default SavedRoutesScreen;
