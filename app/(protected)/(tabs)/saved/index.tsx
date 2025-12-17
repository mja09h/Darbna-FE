import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import MapView, {
  Polyline,
  UrlTile,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import { useSettings } from "../../../../context/SettingsContext";
import { useRouteRecording } from "../../../../context/RouteRecordingContext";
import CustomAlert, { AlertButton } from "../../../../components/CustomAlert";
import { IRecordedRoute, IGPSPoint, RouteType } from "../../../../types/route";
import { BASE_URL } from "../../../../api/index";
import { getRouteDirections } from "../../../../api/routes";

const HEADER_BG_COLOR = "#2c120c";

const SavedRoutesScreen = () => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { units } = useSettings();
  const { recordedRoutes, deleteRoute, fetchUserRoutes } = useRouteRecording();

  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: "success" | "error" | "warning" | "info";
  }>({ title: "", message: "" });
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRefs = useRef<{ [key: string]: MapView | null }>({});

  // Filter to only show private routes (isPublic === false)
  // Backend should already filter, but we ensure it here too
  const routes = useMemo(
    () => recordedRoutes.filter((route) => route.isPublic === false),
    [recordedRoutes]
  );

  useEffect(() => {
    const loadRoutes = async () => {
      setLoading(true);
      try {
        await fetchUserRoutes();
      } catch (error: any) {
        // Silently fail for network errors - backend may not be running
        // Only log in development mode, not in production
        if (__DEV__) {
          // Check if it's a network error (backend not available)
          if (
            error?.code === "ERR_NETWORK" ||
            error?.message?.includes("Network Error")
          ) {
            // Backend is not available - this is expected in development
            // Don't log as error, just silently fail
          } else {
            // Other errors should be logged
            console.warn("Error fetching routes:", error?.message || error);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const handleRoutePress = (routeId: string) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(routeId);
    }
  };

  const handleDeletePress = (routeId: string) => {
    setRouteToDelete(routeId);
    showAlert(
      t.savedRoutes.deleteRoute,
      t.savedRoutes.deleteConfirm,
      "warning",
      [
        {
          text: t.common.cancel,
          style: "cancel",
          onPress: () => {
            setRouteToDelete(null);
          },
        },
        {
          text: t.common.delete,
          style: "destructive",
          onPress: async () => {
            try {
              // Ensure deleteRoute is awaited
              await deleteRoute(routeId);

              // Collapse the card if it was expanded
              if (expandedRouteId === routeId) {
                setExpandedRouteId(null);
              }

              // Show success message
              showAlert(
                t.common.success,
                t.savedRoutes.deleteSuccess,
                "success"
              );

              setRouteToDelete(null);

              // Refresh routes after deletion
              await fetchUserRoutes();
            } catch (error: any) {
              console.error("Delete error:", error);

              const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                t.savedRoutes.deleteFailed;

              showAlert(t.common.error, errorMessage, "error");
              setRouteToDelete(null);
            }
          },
        },
      ]
    );
  };

  const formatDistance = (km: number): string => {
    if (units === "miles") {
      const miles = km * 0.621371;
      if (miles < 1) {
        return `${(miles * 5280).toFixed(0)} ft`;
      }
      return `${miles.toFixed(2)} mi`;
    }
    if (km < 1) {
      return `${(km * 1000).toFixed(0)} m`;
    }
    return `${km.toFixed(2)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString(isRTL ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAverageSpeed = (
    distance: number,
    duration: number
  ): number => {
    if (duration === 0) return 0;
    const hours = duration / 3600;
    return distance / hours;
  };

  // Calculate elevation gain from GPS points
  const calculateElevationGain = (points: IGPSPoint[]): number => {
    let totalGain = 0;
    for (let i = 1; i < points.length; i++) {
      const elevationDiff =
        (points[i].elevation || 0) - (points[i - 1].elevation || 0);
      if (elevationDiff > 0) {
        totalGain += elevationDiff;
      }
    }
    return Math.round(totalGain);
  };

  const getRouteBounds = useCallback((route: IRecordedRoute) => {
    if (route.path.coordinates.length === 0) {
      return {
        latitude: 24.7136,
        longitude: 46.6753,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = route.path.coordinates.map((c) => c[1]);
    const lngs = route.path.coordinates.map((c) => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, []);

  // Center map on route when expanded
  useEffect(() => {
    if (expandedRouteId) {
      const route = routes.find((r) => r._id === expandedRouteId);
      if (route && route.path.coordinates.length > 0) {
        const mapRef = mapRefs.current[expandedRouteId];
        if (mapRef) {
          const routeBounds = getRouteBounds(route);
          mapRef.animateToRegion(routeBounds, 500);
        }
      }
    }
  }, [expandedRouteId, routes, getRouteBounds]);

  const getRouteTypeLabel = (routeType?: string | RouteType): string => {
    if (!routeType) return t.savedRoutes.routeTypes.Other;
    const routeTypes = t.savedRoutes.routeTypes;
    const type = routeType as RouteType;
    return (
      (type === "Running" && routeTypes.Running) ||
      (type === "Cycling" && routeTypes.Cycling) ||
      (type === "Walking" && routeTypes.Walking) ||
      (type === "Hiking" && routeTypes.Hiking) ||
      routeTypes.Other
    );
  };

  const getRouteTypeIcon = (routeType?: string | RouteType): string => {
    const type = routeType as RouteType;
    switch (type) {
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

  const renderRouteCard = (route: IRecordedRoute) => {
    const isExpanded = expandedRouteId === route._id;
    const averageSpeed = calculateAverageSpeed(route.distance, route.duration);
    const routeBounds = getRouteBounds(route);
    const handleGetDirections = async () => {
      try {
        // Get user's current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        // Try to get directions from backend (optional enhancement)
        try {
          const directionsData = await getRouteDirections(
            route._id,
            location.coords.latitude,
            location.coords.longitude
          );

          const mapsUrl =
            directionsData?.googleMapsUrl ||
            directionsData?.url ||
            directionsData?.link;

          if (mapsUrl) {
            const canOpen = await Linking.canOpenURL(mapsUrl);
            if (canOpen) {
              await Linking.openURL(mapsUrl);
              return;
            }
          }
        } catch (err: any) {
          // If the backend endpoint is not implemented (404), fall back to client‑side URL
          if (err?.response?.status && err.response.status !== 404 && __DEV__) {
            console.warn("Directions API error:", err?.message || err);
          }
        }

        // Fallback: open Google Maps directions from current location to route start
        if (!route.path.coordinates.length) {
          showAlert(
            t.common.error,
            "This route has no coordinates to navigate to.",
            "error"
          );
          return;
        }

        const [startLng, startLat] = route.path.coordinates[0];
        const origin = `${location.coords.latitude},${location.coords.longitude}`;
        const destination = `${startLat},${startLng}`;
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(destination)}&travelmode=walking`;

        const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
        if (canOpenFallback) {
          await Linking.openURL(fallbackUrl);
        } else {
          showAlert(
            t.common.error,
            "No maps application is available to open directions.",
            "error"
          );
        }
      } catch (error: any) {
        if (__DEV__) {
          console.warn("Error getting directions:", error?.message || error);
        }
        showAlert(
          t.common.error,
          error?.message || "Could not get directions",
          "error"
        );
      }
    };
    const elevationGain = calculateElevationGain(route.points);

    // Get all images (screenshot + additional images, max 4 total)
    const allImages: Array<{ url: string; uploadedAt: Date | string }> = [];
    if (route.screenshot?.url) {
      allImages.push(route.screenshot);
    }
    if (route.images && route.images.length > 0) {
      const remainingSlots = 4 - allImages.length;
      allImages.push(...route.images.slice(0, remainingSlots));
    }

    return (
      <View
        key={route._id}
        style={[
          styles.routeCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          isExpanded && styles.routeCardExpanded,
        ]}
      >
        {/* Collapsed Card Header */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => handleRoutePress(route._id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderContent}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons
                name={getRouteTypeIcon(route.routeType) as any}
                size={24}
                color={colors.primary}
                style={styles.routeIcon}
              />
              <View style={styles.cardHeaderText}>
                <Text style={[styles.routeName, { color: colors.text }]}>
                  {route.name}
                </Text>
                <View style={styles.routeMeta}>
                  {route.routeType && (
                    <>
                      <Text
                        style={[
                          styles.routeMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {getRouteTypeLabel(route.routeType)}
                      </Text>
                      <Text
                        style={[
                          styles.routeMetaSeparator,
                          { color: colors.textSecondary },
                        ]}
                      >
                        •
                      </Text>
                    </>
                  )}
                  <Text
                    style={[
                      styles.routeMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDistance(route.distance)}
                  </Text>
                  <Text
                    style={[
                      styles.routeMetaSeparator,
                      { color: colors.textSecondary },
                    ]}
                  >
                    •
                  </Text>
                  <Text
                    style={[
                      styles.routeMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDuration(route.duration)}
                  </Text>
                  <Text
                    style={[
                      styles.routeMetaSeparator,
                      { color: colors.textSecondary },
                    ]}
                  >
                    •
                  </Text>
                  <Text
                    style={[
                      styles.routeMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDate(route.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Card Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Route Media Section */}
            {allImages.length > 0 && (
              <View style={styles.mediaContainer}>
                {/* Screenshot (Primary) */}
                {route.screenshot?.url && (
                  <View style={styles.screenshotContainer}>
                    <Image
                      source={{ uri: route.screenshot.url }}
                      style={styles.screenshot}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Additional Images */}
                {route.images && route.images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagesScroll}
                    contentContainerStyle={styles.imagesScrollContent}
                  >
                    {route.images
                      .slice(0, route.screenshot?.url ? 3 : 4)
                      .map((image, index) => (
                        <View
                          key={`${image.url}-${index}`}
                          style={styles.imageThumbnailContainer}
                        >
                          <Image
                            source={{ uri: image.url }}
                            style={styles.imageThumbnail}
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                  </ScrollView>
                )}

                {/* Placeholder if no images */}
                {allImages.length === 0 && (
                  <View
                    style={[
                      styles.mediaPlaceholder,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={48}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.mediaPlaceholderText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No images available
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Interactive Map */}
            <View style={styles.mapContainer}>
              <MapView
                ref={(ref) => {
                  mapRefs.current[route._id] = ref;
                }}
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                initialRegion={routeBounds}
                scrollEnabled={true}
                zoomEnabled={true}
                showsUserLocation={false}
                showsMyLocationButton={false}
              >
                <UrlTile
                  urlTemplate={`${BASE_URL}/map/tiles/{z}/{x}/{y}.png`}
                />
                {route.path.coordinates.length >= 2 && (
                  <Polyline
                    coordinates={route.path.coordinates.map((c) => ({
                      latitude: c[1],
                      longitude: c[0],
                    }))}
                    strokeColor={colors.primary}
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
              </MapView>
            </View>

            {/* Route Information */}
            <View
              style={[styles.infoContainer, { backgroundColor: colors.card }]}
            >
              {/* Description */}
              {route.description && (
                <View style={styles.infoSection}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    {t.savedRoutes.description}
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: colors.text }]}
                    numberOfLines={3}
                  >
                    {route.description}
                  </Text>
                </View>
              )}

              {/* Route Type */}
              {route.routeType && (
                <View style={styles.infoSection}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    {t.savedRoutes.routeType}
                  </Text>
                  <View style={styles.infoValueRow}>
                    <Ionicons
                      name={getRouteTypeIcon(route.routeType) as any}
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {getRouteTypeLabel(route.routeType)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Statistics Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.statContent}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t.savedRoutes.distance}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatDistance(route.distance)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.statContent}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t.savedRoutes.duration}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatDuration(route.duration)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name="speedometer-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.statContent}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t.savedRoutes.averageSpeed}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatDistance(averageSpeed)}/h
                    </Text>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name="ellipse-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.statContent}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t.savedRoutes.points}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {route.points.length}
                    </Text>
                  </View>
                </View>

                {elevationGain > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons
                      name="trending-up-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.statContent}>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Elevation
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {elevationGain}m
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Start Time */}
              <View style={styles.infoSection}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  {t.savedRoutes.startTime}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatDateTime(route.startTime)}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.directionButton,
                  { borderColor: colors.primary },
                ]}
                onPress={handleGetDirections}
              >
                <Ionicons name="navigate" size={20} color={colors.primary} />
                <Text
                  style={[styles.actionButtonText, { color: colors.primary }]}
                >
                  {t.savedRoutes.viewFullMap}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.deleteButton,
                  { borderColor: "#FF3B30" },
                ]}
                onPress={() => handleDeletePress(route._id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.actionButtonText, { color: "#FF3B30" }]}>
                  {t.savedRoutes.deleteRoute}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: HEADER_BG_COLOR }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG_COLOR} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.savedRoutes.title}</Text>
      </View>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t.common.loading}
            </Text>
          </View>
        ) : routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="map-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t.savedRoutes.noRoutes}
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.textSecondary }]}
            >
              {t.savedRoutes.noRoutesDescription}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {routes.map((route) => renderRouteCard(route))}
          </ScrollView>
        )}
      </View>

      {/* Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default SavedRoutesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  routeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeCardExpanded: {
    marginBottom: 8,
  },
  cardHeader: {
    padding: 16,
  },
  cardHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  routeIcon: {
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  routeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeMetaText: {
    fontSize: 14,
  },
  routeMetaSeparator: {
    fontSize: 14,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  mediaContainer: {
    gap: 12,
    marginTop: 8,
  },
  screenshotContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  screenshot: {
    width: "100%",
    height: "100%",
  },
  imagesScroll: {
    marginTop: 8,
  },
  imagesScrollContent: {
    gap: 8,
  },
  imageThumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
  },
  mediaPlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  mediaPlaceholderText: {
    fontSize: 14,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  infoSection: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: "45%",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  directionButton: {
    backgroundColor: "rgba(0, 122, 255, 0.08)",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
