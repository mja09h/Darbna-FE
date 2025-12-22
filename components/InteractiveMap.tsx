import React, { useState, useRef, useEffect, useMemo } from "react";
import MapView, {
  Marker,
  Polyline,
  UrlTile,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMap } from "../context/MapContext";
import { useAuth } from "../context/AuthContext";
import { IGPSPoint } from "../types/route";
import { BASE_URL } from "../api/index";
import PinCreationModal from "./PinCreationModal";
import { CreatePinData, IPinnedPlace } from "../types/map";
import { useRouter } from "expo-router";
import { ILocation } from "../types/map";
import MapLayerSwitcher from "./MapLayerSwitcher";
import { useAlert } from "../context/AlertContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface InteractiveMapProps {
  userLocation: Location.LocationObject | null;
  currentRoute: {
    name: string;
    description: string;
    points: IGPSPoint[];
    startTime: Date | null;
    distance: number;
    duration: number;
    startPoint?: {
      latitude: number;
      longitude: number;
    };
    endPoint?: {
      latitude: number;
      longitude: number;
    };
  } | null;
  onCloseRoute?: () => void;
}

const InteractiveMap = ({
  userLocation,
  currentRoute,
  onCloseRoute,
}: InteractiveMapProps) => {
  const { locations, routes, pois, pinnedPlaces, createPin } = useMap();
  const { user } = useAuth();
  const { alert } = useAlert();
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [showRoutes, setShowRoutes] = useState(true);
  const [showPois, setShowPois] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapType, setMapType] = useState<
    "standard" | "satellite" | "terrain" | "hybrid"
  >("standard");
  const mapRef = useRef<MapView>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  const handlePinPress = (pin: IPinnedPlace) => {
    router.push({
      pathname: "/(protected)/(tabs)/home/pin-detail",
      params: { pinId: pin._id },
    });
  };

  // Filter pins based on search query
  const filteredPins = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return pinnedPlaces.filter((pin) => {
      const isOwner =
        user &&
        pin.userId &&
        typeof pin.userId === "object" &&
        pin.userId._id === user._id;
      const shouldShow = pin.isPublic || isOwner;

      if (!shouldShow) return false;

      return (
        pin.title.toLowerCase().includes(query) ||
        pin.description?.toLowerCase().includes(query) ||
        pin.category?.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, pinnedPlaces, user]);

  // Filter visible pins on map based on search
  const visiblePins = useMemo(() => {
    if (!searchQuery.trim()) {
      return pinnedPlaces;
    }
    return filteredPins;
  }, [searchQuery, pinnedPlaces, filteredPins]);

  // Determine if we should show labels (when zoomed in enough)
  // Normal map apps show labels when zoomed in close (latitudeDelta < 0.01 is very zoomed in)
  const shouldShowLabels = useMemo(() => {
    if (!currentRegion) return false;
    // Show labels only when zoomed in very close (like normal map apps)
    // Smaller latitudeDelta = more zoomed in
    // 0.01 is a good threshold for showing labels (very zoomed in)
    return currentRegion.latitudeDelta > 0.01;
  }, [currentRegion]);

  const handleSearchPinSelect = (pin: IPinnedPlace) => {
    setSearchQuery("");
    setIsSearchFocused(false);
    setShowSearchBar(false);
    // Center map on selected pin
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: pin.location.coordinates[1],
          longitude: pin.location.coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
    // Navigate to pin detail after a short delay
    setTimeout(() => {
      handlePinPress(pin);
    }, 500);
  };

  const handleCreatePin = async (pinData: CreatePinData) => {
    if (!user?._id) {
      alert("Error", "Please log in to create pins");
      return;
    }
    await createPin({ ...pinData, userId: user._id });
  };

  const osmTileUrl = `${BASE_URL}/map/tiles/{z}/{x}/{y}.png`;

  useEffect(() => {
    const startHeadingTracking = async () => {
      try {
        const hasHeading = await Location.hasServicesEnabledAsync();
        if (!hasHeading) {
          console.warn("Heading services not available");
          return;
        }

        headingSubscriptionRef.current = await Location.watchHeadingAsync(
          (headingData) => {
            if (headingData.trueHeading !== -1) {
              setHeading(headingData.trueHeading);
            } else if (headingData.magHeading !== -1) {
              setHeading(headingData.magHeading);
            }
          }
        );
      } catch (error) {
        console.error("Error starting heading tracking:", error);
        if (
          userLocation?.coords.heading !== undefined &&
          userLocation.coords.heading !== null
        ) {
          setHeading(userLocation.coords.heading);
        }
      }
    };

    startHeadingTracking();

    return () => {
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
      }
    };
  }, [userLocation]);

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }
  };

  const getCardinalDirection = (heading: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  const getInitialRegion = () => {
    if (currentRoute && currentRoute.points.length > 0) {
      // Use startPoint/endPoint if available, otherwise calculate from points
      if (currentRoute.startPoint && currentRoute.endPoint) {
        const midLatitude =
          (currentRoute.startPoint.latitude + currentRoute.endPoint.latitude) /
          2;
        const midLongitude =
          (currentRoute.startPoint.longitude +
            currentRoute.endPoint.longitude) /
          2;
        const latDelta =
          Math.abs(
            currentRoute.startPoint.latitude - currentRoute.endPoint.latitude
          ) * 1.5;
        const lonDelta =
          Math.abs(
            currentRoute.startPoint.longitude - currentRoute.endPoint.longitude
          ) * 1.5;

        return {
          latitude: midLatitude,
          longitude: midLongitude,
          latitudeDelta: latDelta,
          longitudeDelta: lonDelta,
        };
      } else {
        // Fallback: calculate bounds from points array
        const latitudes = currentRoute.points.map((p) => p.latitude);
        const longitudes = currentRoute.points.map((p) => p.longitude);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);

        return {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2,
          latitudeDelta: Math.abs(maxLat - minLat) * 1.5,
          longitudeDelta: Math.abs(maxLon - minLon) * 1.5,
        };
      }
    }
    if (userLocation) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return {
      latitude: 24.7136,
      longitude: 46.6753,
      latitudeDelta: 15,
      longitudeDelta: 15,
    };
  };

  // Initialize current region on mount
  useEffect(() => {
    if (!currentRegion) {
      const initialRegion = getInitialRegion();
      setCurrentRegion(initialRegion);
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        mapType={mapType === "standard" ? "standard" : mapType}
        initialRegion={getInitialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onRegionChange={(region) => {
          setCurrentRegion(region);
        }}
        onRegionChangeComplete={(region) => {
          setCurrentRegion(region);
        }}
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          console.log("📍 Long press detected at:", { latitude, longitude });
          setSelectedLocation({ latitude, longitude });
          setShowPinModal(true);
          console.log("📍 Pin modal should be visible now");
        }}
      >
        {mapType === "standard" && (
          <UrlTile key="standard-tiles" urlTemplate={osmTileUrl} />
        )}

        {locations.map((loc) => (
          <Marker
            key={loc._id}
            coordinate={{
              latitude: loc.location.coordinates[1],
              longitude: loc.location.coordinates[0],
            }}
            title={`User ${loc.userId}`}
          />
        ))}

        {currentRoute && currentRoute.points.length >= 2 && (
          <>
            <Polyline
              coordinates={currentRoute.points.map((point) => ({
                latitude: point.latitude,
                longitude: point.longitude,
              }))}
              strokeColor="#FF0000"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
            {currentRoute.startPoint && (
              <Marker coordinate={currentRoute.startPoint}>
                <Ionicons name="flag" size={20} color="green" />
              </Marker>
            )}
            {currentRoute.endPoint && (
              <Marker coordinate={currentRoute.endPoint}>
                <Ionicons name="flag-outline" size={20} color="black" />
              </Marker>
            )}
          </>
        )}

        {routes.map((route) => (
          <Polyline
            key={route._id}
            coordinates={route.path.coordinates.map((c) => ({
              latitude: c[1],
              longitude: c[0],
            }))}
            strokeColor="#FF0000"
            strokeWidth={3}
          />
        ))}

        {showPois &&
          pois.map((poi) => (
            <Marker
              key={poi._id}
              coordinate={{
                latitude: poi.location.coordinates[1],
                longitude: poi.location.coordinates[0],
              }}
              title={poi.name}
              description={poi.description}
              pinColor="blue"
            />
          ))}

        {visiblePins.map((pin) => {
          const isOwner =
            user &&
            pin.userId &&
            typeof pin.userId === "object" &&
            pin.userId._id === user._id;

          const shouldShow = pin.isPublic || isOwner;

          if (!shouldShow) return null;

          return (
            <Marker
              key={`${pin._id}-${shouldShowLabels}`}
              coordinate={{
                latitude: pin.location.coordinates[1],
                longitude: pin.location.coordinates[0],
              }}
              title={pin.title}
              description={pin.description}
              pinColor={pin.isPublic ? "#4CAF50" : "#C46F26"}
              onPress={() => handlePinPress(pin)}
              tracksViewChanges={false}
            >
              {shouldShowLabels ? (
                <View style={styles.pinLabelContainer}>
                  <View
                    style={[
                      styles.pinLabel,
                      {
                        backgroundColor: pin.isPublic
                          ? "rgba(76, 175, 80, 0.9)"
                          : "rgba(196, 111, 38, 0.9)",
                      },
                    ]}
                  >
                    <Text style={styles.pinLabelText} numberOfLines={1}>
                      {pin.title}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Marker>
          );
        })}
      </MapView>

      {heading !== null && (
        <View style={styles.compassContainer}>
          <Text style={styles.compassText}>
            {String(Math.round(heading)).padStart(3, "0")}°{" "}
            {getCardinalDirection(heading)}
          </Text>
        </View>
      )}

      {/* Search Icon Button - Show when search bar is hidden */}
      {!showSearchBar && (
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => {
            setShowSearchBar(true);
            setIsSearchFocused(true);
          }}
        >
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      )}

      {/* Search Bar - Show when search icon is clicked */}
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              placeholder={t.map?.searchPins || "Search pins..."}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setShowSearchBar(false);
                setIsSearchFocused(false);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {isSearchFocused && filteredPins.length > 0 && (
            <View style={styles.searchResults}>
              <FlatList
                data={filteredPins}
                keyExtractor={(item) => item._id}
                renderItem={({ item: pin }) => (
                  <TouchableOpacity
                    style={[
                      styles.searchResultItem,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                    onPress={() => handleSearchPinSelect(pin)}
                  >
                    <Ionicons
                      name="location"
                      size={20}
                      color={pin.isPublic ? "#4CAF50" : "#C46F26"}
                      style={styles.resultIcon}
                    />
                    <View style={styles.resultContent}>
                      <Text
                        style={[
                          styles.resultTitle,
                          { textAlign: isRTL ? "right" : "left" },
                        ]}
                      >
                        {pin.title}
                      </Text>
                      {pin.description && (
                        <Text
                          style={[
                            styles.resultDescription,
                            { textAlign: isRTL ? "right" : "left" },
                          ]}
                          numberOfLines={1}
                        >
                          {pin.description}
                        </Text>
                      )}
                      {pin.category && (
                        <Text
                          style={[
                            styles.resultCategory,
                            { textAlign: isRTL ? "right" : "left" },
                          ]}
                        >
                          {pin.category}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.searchResultsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {isSearchFocused &&
            searchQuery.trim() &&
            filteredPins.length === 0 && (
              <View style={styles.searchResults}>
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={32} color="#999" />
                  <Text
                    style={[
                      styles.noResultsText,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {t.map?.noPinsFound || "No pins found"}
                  </Text>
                </View>
              </View>
            )}
        </View>
      )}

      {/* Map Layer Switcher */}
      <MapLayerSwitcher currentMapType={mapType} onMapTypeChange={setMapType} />

      {userLocation && (
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={24} color="#4285F4" />
        </TouchableOpacity>
      )}

      {currentRoute && onCloseRoute && (
        <TouchableOpacity style={styles.closeButton} onPress={onCloseRoute}>
          <Ionicons name="close" size={20} color="black" />
        </TouchableOpacity>
      )}

      <PinCreationModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        location={selectedLocation}
        onCreate={handleCreatePin}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "white",
    borderRadius: 50,
    padding: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compassContainer: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: [{ translateX: -50 }],
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 5,
  },
  compassText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchIconButton: {
    position: "absolute",
    top: 70,
    left: 16,
    backgroundColor: "white",
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 10,
  },
  searchContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: 300,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultIcon: {
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  resultCategory: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  noResults: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  pinLabelContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -35,
  },
  pinLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pinLabelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default InteractiveMap;
