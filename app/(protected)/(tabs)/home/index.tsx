import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import InteractiveMap from "../../../../components/InteractiveMap";
import * as Location from "expo-location";
import { useMap } from "../../../../context/MapContext";

const HomePage = () => {
  const { sendLocationUpdate } = useMap();

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      // Subscribe to location updates
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          // This is your device's current location
          const { longitude, latitude } = location.coords;

          // Send your location to the backend
          // Replace 'YOUR_USER_ID' with the actual logged-in user's ID
          sendLocationUpdate({ userId: "YOUR_USER_ID", longitude, latitude });
        }
      );
    };

    startLocationTracking();

    // Clean up the subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [sendLocationUpdate]);

  return (
    <View style={styles.container}>
      <InteractiveMap />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomePage;
