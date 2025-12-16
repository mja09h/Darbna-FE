import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useRouteRecording } from "../../../../context/RouteRecordingContext";
import { IGPSPoint } from "../../../../types/route";
import InteractiveMap from "../../../../components/InteractiveMap";
import SaveRouteModal from "../../../../components/SaveRouteModal";

// Darbna Brand Colors
const COLORS = {
  desertOrange: "#C46F26",
  darkSandBrown: "#3A1D1A",
  palmBrown: "#7D482",
  sandBeige: "#E9DCCF",
  offWhiteDesert: "#F4EEE7",
  white: "#FFFFFF",
  text: "#333333",
  lightText: "#666666",
};

const HomePage = () => {
  const router = useRouter();
  const {
    isRecording,
    currentRoute,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    addPoint,
    saveRoute,
  } = useRouteRecording();

  const [routeName, setRouteName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState<string | undefined>();
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const userLocationSubscriptionRef =
    useRef<Location.LocationSubscription | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  // Request location permissions and start tracking user location
  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }

      // Get initial location
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);
      } catch (error) {
        console.error("Error getting initial location:", error);
      }

      // Subscribe to continuous location updates
      try {
        userLocationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Update every 3 seconds
            distanceInterval: 5, // Or every 5 meters
          },
          (location) => {
            setUserLocation(location);
          }
        );
      } catch (error) {
        console.error("Error subscribing to location updates:", error);
      }
    };

    requestLocationPermission();

    return () => {
      if (userLocationSubscriptionRef.current) {
        userLocationSubscriptionRef.current.remove();
      }
    };
  }, []);

  // Subscribe to location updates when recording
  useEffect(() => {
    if (!isRecording) return;

    const subscribeToLocation = async () => {
      try {
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // 5 seconds
            distanceInterval: 10, // 10 meters
          },
          (location) => {
            const point: IGPSPoint = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date(),
              elevation: location.coords.altitude || undefined,
              speed: location.coords.speed || undefined,
            };
            addPoint(point);
          }
        );
      } catch (error) {
        console.error("Error subscribing to location:", error);
      }
    };

    subscribeToLocation();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, [isRecording, addPoint]);

  // Update recording time every second
  useEffect(() => {
    if (!isRecording || !currentRoute?.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - (currentRoute?.startTime?.getTime() || 0)) / 1000
      );
      setRecordingTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, currentRoute?.startTime]);

  const handleStartRecording = () => {
    Alert.prompt(
      "Route Name",
      "Enter a name for this route:",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Start",
          onPress: (name?: string) => {
            if (name && name.trim()) {
              startRecording(name.trim());
              setRouteName(name.trim());
              setRecordingTime(0);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleStopRecording = async () => {
    Alert.alert("Stop Recording", "Do you want to save this route?", [
      {
        text: "Discard",
        onPress: async () => {
          await stopRecording();
          setRouteName("");
          setRecordingTime(0);
          setScreenshotUri(undefined);
        },
        style: "destructive",
      },
      {
        text: "Save",
        onPress: async () => {
          // Capture screenshot of the map if possible
          // Note: For now, we'll skip screenshot capture as it requires react-native-view-shot
          // You can add it later by wrapping the map in a View with a ref
          setScreenshotUri(undefined);
          setShowSaveModal(true);
        },
      },
    ]);
  };

  const handleSaveRoute = async (
    description: string,
    isPublic: boolean,
    routeType: string
  ) => {
    if (!routeName.trim()) {
      Alert.alert("Error", "Please enter a route name");
      return;
    }

    try {
      await saveRoute(
        routeName,
        description,
        isPublic,
        routeType,
        screenshotUri
      );
      Alert.alert("Success", "Route saved successfully!");
      setShowSaveModal(false);
      setRouteName("");
      setRecordingTime(0);
      setScreenshotUri(undefined);

      // Navigate to appropriate page based on privacy setting
      if (isPublic) {
        // Navigate to community page
        router.push("/(protected)/(tabs)/community");
      } else {
        // Navigate to saved page
        router.push("/(protected)/(tabs)/saved");
      }
    } catch (error: any) {
      // Handle network errors gracefully
      if (
        error?.code === "ERR_NETWORK" ||
        error?.message?.includes("Network Error")
      ) {
        Alert.alert(
          "Backend Server Not Available",
          "The backend server is not running or not reachable.\n\n" +
            "To fix this:\n" +
            "1. Start your backend server on port 8000\n" +
            "2. Make sure your device/simulator can reach the server\n" +
            "3. Check the console for the API URL being used\n\n" +
            "Note: The route data is still saved locally and can be synced when the server is available."
        );
      } else {
        Alert.alert("Error", "Failed to save route. Please try again.");
      }
      // Don't log network errors to console
      if (
        __DEV__ &&
        !(
          error?.code === "ERR_NETWORK" ||
          error?.message?.includes("Network Error")
        )
      ) {
        console.warn("Error saving route:", error?.message || error);
      }
      throw error; // Re-throw so modal can handle it
    }
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

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)}m`;
    }
    return `${km.toFixed(2)}km`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header - Styled with Darbna Brand Colors */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Map</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
          >
            <Ionicons
              name={isRecording ? "stop-circle" : "stop"}
              size={28}
              color={isRecording ? COLORS.white : COLORS.desertOrange}
            />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <InteractiveMap
          userLocation={userLocation}
          currentRoute={currentRoute}
        />

        {/* Recording Status Bar */}
        {isRecording && currentRoute && (
          <View style={styles.statusBar}>
            <View style={styles.statusContent}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Recording</Text>
                <Text style={styles.statusValue}>
                  {formatTime(recordingTime)}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Distance</Text>
                <Text style={styles.statusValue}>
                  {formatDistance(currentRoute.distance)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={isRecording ? pauseRecording : resumeRecording}
              >
                <Ionicons
                  name={isRecording ? "pause" : "play"}
                  size={20}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Route Modal */}
        <SaveRouteModal
          visible={showSaveModal}
          routeName={routeName}
          distance={currentRoute?.distance || 0}
          duration={recordingTime}
          screenshotUri={screenshotUri}
          onSave={handleSaveRoute}
          onCancel={() => {
            setShowSaveModal(false);
            setScreenshotUri(undefined);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: COLORS.darkSandBrown,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // Header Styling - Darbna Brand
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.darkSandBrown,
    borderBottomWidth: 0,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  recordButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: COLORS.offWhiteDesert,
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonActive: {
    backgroundColor: COLORS.desertOrange,
  },
  statusBar: {
    position: "absolute",
    top: 70,
    left: 10,
    right: 10,
    backgroundColor: COLORS.desertOrange,
    borderRadius: 12,
    padding: 14,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  statusContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
  },
  statusLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.9,
  },
  statusValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  pauseButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomePage;
