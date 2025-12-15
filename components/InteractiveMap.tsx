import React, { useState, useRef, useEffect } from "react";
import MapView, {
  Marker,
  Polyline,
  Heatmap,
  UrlTile,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { StyleSheet, View, Button, TouchableOpacity } from "react-native";
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
  const [showRoutes, setShowRoutes] = useState(true);
  const [showPois, setShowPois] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const mapRef = useRef<MapView>(null);

  // OpenStreetMap tile server URL
  const osmTileUrl = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png";

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
        {showRoutes &&
          routes.map((route) => (
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

        {/* Display Heatmap Layer */}
        {showHeatmap && heatmapData.length > 0 && (
          <Heatmap
            points={heatmapData.map((p) => ({
              latitude: p.lat,
              longitude: p.lng,
              weight: p.weight,
            }))}
            opacity={0.7}
            radius={50}
          />
        )}
      </MapView>

      {/* Layer Toggle Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title={showRoutes ? "Hide Routes" : "Show Routes"}
          onPress={() => setShowRoutes(!showRoutes)}
        />
        <Button
          title={showPois ? "Hide POIs" : "Show POIs"}
          onPress={() => setShowPois(!showPois)}
        />
        <Button
          title={showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          onPress={() => setShowHeatmap(!showHeatmap)}
        />
      </View>

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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingVertical: 8,
    width: "100%",
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
