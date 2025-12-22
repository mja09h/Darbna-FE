import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import api from "../../../../api/index";
import { IRecordedRoute } from "../../../../types/route";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { useSettings } from "../../../../context/SettingsContext";
import RouteDetailModal from "../../../../components/RouteDetailModal";
import COLORS from "../../../../data/colors";
import RouteCard from "../../../../components/RouteCard"; 

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
      userId: route.user?._id, // Pass the user ID from the populated user object
      isPublic: route.isPublic,

      // Add start and end points for map/directions functionality
      startPoint: route.startPoint,
      endPoint: route.endPoint,

      // Provide default values for fields not on IRecordedRoute
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
    isRecordedRoute: true, // Flag for the modal
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

  const loadPublicRoutes = async (page: number = 1, isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const response = await api.get("/routes/public", {
        params: { page, limit: 10 },
      });

      if (response.data.routes) {
        if (page === 1) {
          setRoutes(response.data.routes);
        } else {
          setRoutes((prevRoutes) => [...prevRoutes, ...response.data.routes]);
        }
        setPagination(response.data.pagination);
      } else {
        // Fallback for older backend versions
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
      // ... (error handling remains the same)
    } finally {
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };

 const handleRefresh = async () => {
   setRefreshing(true);
   await loadPublicRoutes(1, true); // Pass true to indicate a refresh
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
      <RouteCard
        name={item.name}
        distance={formatDistance(item.distance)}
        location={item.user?.username || "Unknown User"} // Using username as location for now
        routeType={item.routeType}
        onPress={() => handleRoutePress(item)}
      />
    );
  };


  if (loading && routes.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Routes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.desertOrange} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Routes</Text>
        <Text style={styles.headerSubtitle}>
          {pagination.total} route{pagination.total !== 1 ? "s" : ""}
        </Text>
      </View>

      {routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="globe-outline" size={80} color={COLORS.lightText} />
          </View>
          <Text style={styles.emptyTitle}>No Public Routes Yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share a route with the community
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.desertOrange}
            />
          }
        >
          <FlatList
            data={routes}
            renderItem={renderRouteCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false} // Disable FlatList scrolling
            onEndReachedThreshold={0.5}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              loading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.desertOrange}
                  style={styles.footerLoader}
                />
              ) : null
            }
          />
        </ScrollView>
      )}

      <RouteDetailModal
        visible={showRouteModal}
        onClose={handleCloseRouteModal}
        route={selectedRoute}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhiteDesert,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
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
  headerSubtitle: {
    fontSize: 14,
    color: "#a89080",
    marginTop: 6,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.offWhiteDesert,
  },
  listWrapper: {
    flex: 1,
    backgroundColor: COLORS.offWhiteDesert,
  },
  listContainer: {
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
    gap: 16,
    marginBottom: 8,
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
  userBadge: {
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
    marginTop: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.desertOrange,
  },
  chevronContainer: {
    marginLeft: 8,
    padding: 4,
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
  footerLoader: {
    marginVertical: 20,
  },
});

export default CommunityPage;
