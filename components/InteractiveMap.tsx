import React, { useRef, useState, useEffect } from "react";
import MapView, {
  Marker,
  Polyline,
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
import { useRouter } from "expo-router";
import { ILocation } from "../types/map";
import MapLayerSwitcher from "./MapLayerSwitcher";
import { useAlert } from "../context/AlertContext";

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

  const handlePinPress = (pin: IPinnedPlace) => {
    router.push({
      pathname: "/(protected)/(tabs)/home/pin-detail",
      params: { pinId: pin._id },
    });
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
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setSelectedLocation({ latitude, longitude });
          setShowPinModal(true);
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

        {pinnedPlaces.map((pin) => {
          const isOwner =
            user &&
            pin.userId &&
            typeof pin.userId === "object" &&
            pin.userId._id === user._id;

          const shouldShow = pin.isPublic || isOwner;

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
      </MapView>

      {heading !== null && (
        <View style={styles.compassContainer}>
          <Text style={styles.compassText}>
            {String(Math.round(heading)).padStart(3, "0")}°{" "}
            {getCardinalDirection(heading)}
          </Text>
        </View>
      )}

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
});

export default InteractiveMap;
