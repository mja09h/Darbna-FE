import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "../../../../api/index";
import { IRecordedRoute } from "../../../../types/route";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { useSettings } from "../../../../context/SettingsContext";
import { useRouteRecording } from "../../../../context/RouteRecordingContext";
import { useAuth } from "../../../../context/AuthContext";

const HEADER_BG_COLOR = "#2c120c";

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const CommunityPage = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { units } = useSettings();

  const [routes, setRoutes] = useState<IRecordedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    loadPublicRoutes();
  }, []);

  // Reset expanded state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setExpandedRouteId(null);
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

  const formatDistance = (km: number) => {
    if (units === "miles") {
      const miles = km * 0.621371;
      if (miles < 1) {
        return `${(miles * 5280).toFixed(0)} ft`;
      }
      return `${miles.toFixed(2)} mi`;
    }
    if (km < 1) {
      return `${(km * 1000).toFixed(0)}m`;
    }
    return `${km.toFixed(2)}km`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRouteTypeLabel = (routeType?: string): string => {
    if (!routeType) return t.savedRoutes.routeTypes.Other;
    return (
      t.savedRoutes.routeTypes[
        routeType as keyof typeof t.savedRoutes.routeTypes
      ] || routeType
    );
  };

  const handleRoutePress = (routeId: string) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(routeId);
    }
  };


  const renderRouteCard = ({ item }: { item: IRecordedRoute }) => {
    const isExpanded = expandedRouteId === item._id;

    return (
      <View
        style={[
          styles.routeCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isExpanded && styles.routeCardExpanded,
        ]}
      >
        {/* Collapsed Card Header */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => handleRoutePress(item._id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderContent}>
            <Text style={[styles.routeName, { color: colors.text }]}>
              {item.name}
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Card Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Screenshot */}
            {item.screenshot && (
              <Image
                source={{ uri: item.screenshot.url }}
                style={styles.routeImage}
              />
            )}

            {/* Route Info */}
            <View style={styles.routeInfo}>
              <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.routeType, { color: colors.primary }]}>
                    {getRouteTypeLabel(item.routeType)}
                  </Text>
                </View>
                <View style={styles.userBadge}>
                  <Ionicons
                    name="person-circle"
                    size={24}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.usernameText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.user?.username || "Unknown User"}
                  </Text>
                </View>
              </View>

              {item.description && (
                <Text
                  style={[
                    styles.routeDescription,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}

              {/* Stats */}
              <View
                style={[styles.statsContainer, { borderColor: colors.border }]}
              >
                <View style={styles.statItem}>
                  <Ionicons
                    name="navigate-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {formatDistance(item.distance)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {formatTime(item.duration)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.viewButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    // TODO: Navigate to route detail page
                    Alert.alert("View Route", "Route detail page coming soon");
                  }}
                >
                  <Text
                    style={[styles.viewButtonText, { color: colors.background }]}
                  >
                    {t.savedRoutes.viewFullMap}
                  </Text>
                  <Ionicons
                    name={isRTL ? "arrow-back" : "arrow-forward"}
                    size={14}
                    color={colors.background}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && routes.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}
      >
        <View style={styles.loadingContainer}>
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
          <Ionicons
            name="globe-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Public Routes Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Be the first to share a route with the community
          </Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRouteCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
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
      )}
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
    fontWeight: "bold",
    color: "#f5e6d3",
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
    padding: 20,
    paddingTop: 30,
    gap: 16,
  },
  routeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeCardExpanded: {
    marginBottom: 8,
  },
  cardHeader: {
    padding: 12,
  },
  cardHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  routeImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#E9DCCF",
    borderRadius: 12,
    overflow: "hidden",
  },
  routeInfo: {
    padding: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  routeType: {
    fontSize: 12,
    fontWeight: "600",
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 6,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: "500",
    maxWidth: 120,
  },
  routeDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    fontWeight: "600",
    marginRight: 6,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  footerLoader: {
    marginVertical: 20,
  },
});

export default CommunityPage;
