import React, { useState, useRef, useEffect } from "react";
import MapView, {
  Marker,
  Polyline,
  Heatmap,
  UrlTile,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMap } from "../context/MapContext";
import { useAuth } from "../context/AuthContext";
import { IGPSPoint } from "../types/route";
import { BASE_URL } from "../api/index";
import PinCreationModal from "./PinCreationModal";
import { CreatePinData, IPinnedPlace } from "../types/map";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

interface InteractiveMapProps {
  userLocation: Location.LocationObject | null;
  currentRoute: {
    name: string;
    description: string;
    points: IGPSPoint[];
    startTime: Date | null;
    distance: number;
    duration: number;
  } | null;
}

const InteractiveMap = ({
  userLocation,
  currentRoute,
}: InteractiveMapProps) => {
  const { locations, routes, pois, heatmapData, pinnedPlaces, createPin } =
    useMap();
  const { user } = useAuth();
  const router = useRouter();
  const [showRoutes, setShowRoutes] = useState(true);
  const [showPois, setShowPois] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<MapView>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );

  // Handle pin marker press - navigate to detail page
  const handlePinPress = (pin: IPinnedPlace) => {
    router.push({
      pathname: "/(protected)/(tabs)/home/pin-detail",
      params: { pinId: pin._id },
    });
  };

  // Wrapper function to add userId to pin data from AuthContext
  const handleCreatePin = async (pinData: CreatePinData) => {
    if (!user?._id) {
      Alert.alert("Error", "Please log in to create pins");
      return;
    }
    // Add userId to pin data from AuthContext
    await createPin({ ...pinData, userId: user._id });
  };

  // OpenStreetMap tile server URL via backend proxy
  const osmTileUrl = `${BASE_URL}/map/tiles/{z}/{x}/{y}.png`;

  // Track device heading/compass direction
  useEffect(() => {
    const startHeadingTracking = async () => {
      try {
        // Check if heading is available
        const hasHeading = await Location.hasServicesEnabledAsync();
        if (!hasHeading) {
          console.warn("Heading services not available");
          return;
        }

        // Watch heading updates
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
        // Try to get heading from location updates as fallback
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
  }, []);

  // Also check userLocation for heading as fallback
  useEffect(() => {
    if (
      userLocation?.coords.heading !== undefined &&
      userLocation.coords.heading !== null &&
      heading === null
    ) {
      setHeading(userLocation.coords.heading);
    }
  }, [userLocation?.coords.heading]);

  // Center map on user location when first obtained
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, [userLocation?.coords.latitude, userLocation?.coords.longitude]);

  // Function to center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  // Convert heading degrees to cardinal direction
  const getCardinalDirection = (heading: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  // Determine initial region based on user location or default
  const getInitialRegion = () => {
    if (userLocation) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return {
      latitude: 24.7136,
      longitude: 46.6753,
      latitudeDelta: 15,
      longitudeDelta: 15,
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setSelectedLocation({ latitude, longitude });
          setShowPinModal(true);
        }}
      >
        <UrlTile urlTemplate={osmTileUrl} />

        {/* Display user's current location */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title="My Location"
            pinColor="#4285F4"
            tracksViewChanges={false}
          />
        )}

        {/* Display other users' locations */}
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

        {/* Display currently recording route in real-time */}
        {currentRoute && currentRoute.points.length >= 2 && (
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
        )}

        {/* Display saved routes/paths */}
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

        {/* Display Points of Interest */}
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

        {/* Display Pinned Places */}
        {pinnedPlaces.map((pin) => {
          // Filter: show if public OR if it's the user's own pin
          const shouldShow =
            pin.isPublic || (user && pin.userId._id === user._id);

          if (!shouldShow) return null;

          return (
            <Marker
              key={pin._id}
              coordinate={{
                latitude: pin.location.coordinates[1],
                longitude: pin.location.coordinates[0],
              }}
              title={pin.title}
              description={pin.description}
              pinColor={pin.isPublic ? "#4CAF50" : "#C46F26"}
              onPress={() => handlePinPress(pin)}
            />
          );
        })}

        {/* Display Heatmap Layer */}
        {/* {showHeatmap && heatmapData.length > 0 && (
          <Heatmap
            points={heatmapData.map((p) => ({
              latitude: p.lat,
              longitude: p.lng,
              weight: p.weight,
            }))}
            opacity={0.7}
            radius={50}
          />
        ))} */}
      </MapView>

      {/* Digital Compass */}
      {heading !== null && (
        <View style={styles.compassContainer}>
          <Text style={styles.compassText}>
            {String(Math.round(heading)).padStart(3, "0")}°{" "}
            {getCardinalDirection(heading)}
          </Text>
        </View>
      )}

      {/* My Location Button */}
      {userLocation && (
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={24} color="#4285F4" />
        </TouchableOpacity>
      )}

      {/* Pin Creation Modal */}
      <PinCreationModal
        visible={showPinModal}
        location={selectedLocation}
        onClose={() => {
          setShowPinModal(false);
          setSelectedLocation(null);
        }}
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
    flex: 1,
  },
  compassContainer: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    zIndex: 10,
  },
  compassText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3A1D1A",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3A1D1A",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 100,
    right: 16,
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
  },
});

export default InteractiveMap;
