import React, { useState } from "react";
import MapView, {
  Marker,
  Polyline,
  Heatmap,
  UrlTile,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { StyleSheet, View, Button } from "react-native";
import { useMap } from "../context/MapContext";

const InteractiveMap = () => {
  const { locations, routes, pois, heatmapData } = useMap();
  const [showRoutes, setShowRoutes] = useState(true);
  const [showPois, setShowPois] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // OpenStreetMap tile server URL
  const osmTileUrl = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT} // Important for custom tiles
        style={styles.map}
        initialRegion={{
          latitude: 24.7136, // Default to a central location, e.g., Riyadh
          longitude: 46.6753,
          latitudeDelta: 15,
          longitudeDelta: 15,
        }}
      >
        <UrlTile urlTemplate={osmTileUrl} />

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

        {/* Display routes/paths */}
        {showRoutes &&
          routes.map((route) => (
            <Polyline
              key={route._id}
              coordinates={route.path.coordinates.map((c) => ({
                latitude: c[1],
                longitude: c[0],
              }))}
              strokeColor="#FF0000" // red
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingVertical: 8,
    width: "100%",
  },
});

export default InteractiveMap;
