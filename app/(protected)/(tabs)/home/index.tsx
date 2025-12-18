import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation, useRouter } from "expo-router";
import { useRouteRecording } from "../../../../context/RouteRecordingContext";
import { useSettings } from "../../../../context/SettingsContext";
import { IGPSPoint } from "../../../../types/route";
import InteractiveMap from "../../../../components/InteractiveMap";
import SOSModal from "../../../../components/SOSModal";
import SOSHeaderButton from "../../../../components/SOSHeaderButton";
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
  const { units } = useSettings();

  const navigation = useNavigation();
  const [routeName, setRouteName] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | undefined>(
    undefined
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSOSModalVisible, setSOSModalVisible] = useState(false);
  const [showRouteNameModal, setShowRouteNameModal] = useState(false);
  const [tempRouteName, setTempRouteName] = useState("");
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

  // Update recording time every second (only when actively recording)
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
    setTempRouteName("");
    setShowRouteNameModal(true);
  };

  const handleConfirmRouteName = () => {
    if (tempRouteName && tempRouteName.trim()) {
      startRecording(tempRouteName.trim());
      setRouteName(tempRouteName.trim());
      setRecordingTime(0);
      setShowRouteNameModal(false);
      setTempRouteName("");
    }
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
      setRouteDescription("");
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
    if (units === "miles") {
      // Convert kilometers to miles
      const miles = km * 0.621371;
      if (miles < 1) {
        // Convert to feet (1 mile = 5280 feet)
        const feet = miles * 5280;
        return `${feet.toFixed(0)}ft`;
      }
      return `${miles.toFixed(2)}mi`;
    } else {
      // Default to kilometers
      if (km < 1) {
        return `${(km * 1000).toFixed(0)}m`;
      }
      return `${km.toFixed(2)}km`;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header - Styled with Darbna Brand Colors */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SOSHeaderButton
              onPress={() => {
                console.log("SOSHeaderButton pressed");
                setSOSModalVisible(true);
              }}
            />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Map</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                currentRoute && !isRecording && styles.recordButtonDisabled,
              ]}
              onPress={
                currentRoute ? handleStopRecording : handleStartRecording
              }
            >
              <Ionicons
                name={currentRoute ? "stop-circle" : "play-circle"}
                size={28}
                color={
                  currentRoute && !isRecording
                    ? COLORS.lightText
                    : isRecording
                    ? COLORS.white
                    : COLORS.desertOrange
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <InteractiveMap
          userLocation={userLocation}
          currentRoute={currentRoute}
        />

        {/* Recording Status Bar */}
        {currentRoute &&
          (() => {
            const isPaused = !isRecording;
            return (
              <View style={styles.statusBar}>
                <View style={styles.statusContent}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>
                      {isPaused ? "Paused" : "Recording"}
                    </Text>
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
                    onPress={isPaused ? resumeRecording : pauseRecording}
                  >
                    <Ionicons
                      name={isPaused ? "play" : "pause"}
                      size={20}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

        {/* Route Name Input Modal */}
        <Modal
          visible={showRouteNameModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowRouteNameModal(false);
            setTempRouteName("");
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Route Name</Text>
              <Text style={styles.modalSubtitle}>
                Enter a name for this route:
              </Text>
              <TextInput
                style={styles.input}
                placeholder="My Route"
                value={tempRouteName}
                onChangeText={setTempRouteName}
                placeholderTextColor={COLORS.lightText}
                autoFocus={true}
                onSubmitEditing={handleConfirmRouteName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowRouteNameModal(false);
                    setTempRouteName("");
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    !tempRouteName.trim() && styles.modalButtonDisabled,
                  ]}
                  onPress={handleConfirmRouteName}
                  disabled={!tempRouteName.trim()}
                >
                  <Text style={styles.modalButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Save Route Modal */}
        <SaveRouteModal
          visible={showSaveModal}
          routeName={routeName}
          distance={currentRoute?.distance || 0}
          duration={recordingTime}
          screenshotUri={screenshotUri}
          onSave={handleSaveRoute}
          onCancel={() => setShowSaveModal(false)}
        />
        {/* SOS Modal */}
        <SOSModal
          visible={isSOSModalVisible}
          onClose={() => setSOSModalVisible(false)}
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
    position: "relative",
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    textAlign: "center",
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
  recordButtonDisabled: {
    backgroundColor: COLORS.sandBeige,
    opacity: 0.6,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.sandBeige,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.offWhiteDesert,
    marginBottom: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
  },
  routeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.offWhiteDesert,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    color: COLORS.desertOrange,
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.sandBeige,
  },
  saveButton: {
    backgroundColor: COLORS.desertOrange,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 16,
    textAlign: "center",
  },
});

export default HomePage;
