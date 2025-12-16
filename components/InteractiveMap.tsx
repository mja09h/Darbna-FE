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
import { IGPSPoint } from "../types/route";

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
  const { locations, routes, pois, heatmapData } = useMap();
  const mapRef = useRef<MapView>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );

  // OpenStreetMap tile server URL
  const osmTileUrl = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png";

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
        {pois.map((poi) => (
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
