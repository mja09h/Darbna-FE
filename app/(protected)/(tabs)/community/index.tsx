import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import api from "../../../../api/index";
import { IRecordedRoute } from "../../../../types/route";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { useSettings } from "../../../../context/SettingsContext";
import RouteDetailModal from "../../../../components/RouteDetailModal";

const HEADER_BG_COLOR = "#2c120c";

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Convert IRecordedRoute to ISavedRoute format for the modal
const convertToSavedRoute = (route: IRecordedRoute): any => {
  return {
    _id: route._id,
    routeId: {
      _id: route._id,
      name: route.name,
      distance: route.distance,
      duration: route.duration,
      routeType: route.routeType,
      description: route.description,
      screenshot: route.screenshot,
      images: route.images,
      path: route.path,
      points: route.points,
      // Add default values for modal fields
      elevationGain: 0,
      estimatedTime: undefined,
      difficulty: "Moderate",
      rating: 4.0,
      location: "Community Route",
      terrain: "trail",
    },
    folderId: {
      _id: "community",
      name: "Community",
    },
    isFavorite: false,
    savedAt: route.createdAt,
  };
};

const CommunityPage = () => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { units } = useSettings();

  const [routes, setRoutes] = useState<IRecordedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    loadPublicRoutes();
  }, []);

  // Reset modal when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setShowRouteModal(false);
      setSelectedRoute(null);
    }, [])
  );

  const loadPublicRoutes = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("/routes/public", {
        params: { page, limit: 10 },
      });

      if (response.data.routes) {
        setRoutes(response.data.routes);
        setPagination(response.data.pagination);
      } else {
        // Fallback if backend returns array directly
        const publicRoutes = Array.isArray(response.data)
          ? response.data.filter((r: IRecordedRoute) => r.isPublic === true)
          : [];
        setRoutes(publicRoutes);
        setPagination({
          total: publicRoutes.length,
          page: 1,
          limit: 10,
          pages: 1,
        });
      }
    } catch (error: any) {
      // Silently fail for network errors
      if (
        __DEV__ &&
        !(
          error?.code === "ERR_NETWORK" ||
          error?.message?.includes("Network Error")
        )
      ) {
        console.warn("Error loading public routes:", error?.message || error);
      }
      // Set empty state on error
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPublicRoutes(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      loadPublicRoutes(pagination.page + 1);
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

  const handleRoutePress = (route: IRecordedRoute) => {
    const convertedRoute = convertToSavedRoute(route);
    setSelectedRoute(convertedRoute);
    setShowRouteModal(true);
  };

  const handleCloseRouteModal = () => {
    setShowRouteModal(false);
    setSelectedRoute(null);
  };

  const renderRouteCard = ({ item }: { item: IRecordedRoute }) => {
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
              name={getRouteIcon(item.routeType) as any}
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
              {item.name}
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
                  {formatDistance(item.distance)}
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
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
            {/* User Badge */}
            {item.user && (
              <View
                style={[
                  styles.userBadge,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="person-circle"
                  size={12}
                  color={colors.primary}
                />
                <Text style={[styles.username, { color: colors.primary }]}>
                  {item.user.username || "Unknown User"}
                </Text>
              </View>
            )}
          </View>

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

  if (loading && routes.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Routes</Text>
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
        <Text style={styles.headerTitle}>Community Routes</Text>
        <Text style={styles.headerSubtitle}>
          {pagination.total} route{pagination.total !== 1 ? "s" : ""}
        </Text>
      </View>

      {routes.length === 0 ? (
        <View
          style={[
            styles.emptyContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <Ionicons name="globe-outline" size={80} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Public Routes Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Be the first to share a route with the community
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <FlatList
            data={routes}
            renderItem={renderRouteCard}
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
            onEndReachedThreshold={0.5}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.footerLoader}
                />
              ) : null
            }
          />
        </View>
      )}

      <RouteDetailModal
        visible={showRouteModal}
        onClose={handleCloseRouteModal}
        route={selectedRoute}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f5e6d3",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#a89080",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Route Item Styles (matching saved page)
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
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: "600",
  },
  chevronContainer: {
    marginLeft: 8,
  },

  // Empty State
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
  footerLoader: {
    marginVertical: 20,
  },
});

export default CommunityPage;
