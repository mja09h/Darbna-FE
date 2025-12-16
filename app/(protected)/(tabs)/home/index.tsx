import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation } from "expo-router";
import { useRouteRecording } from "../../../../context/RouteRecordingContext";
import { useSettings } from "../../../../context/SettingsContext";
import { IGPSPoint } from "../../../../types/route";
import InteractiveMap from "../../../../components/InteractiveMap";
import SOSModal from "../../../../components/SOSModal";
import SOSHeaderButton from "../../../../components/SOSHeaderButton";

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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSOSModalVisible, setSOSModalVisible] = useState(false);
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

  const handleStopRecording = () => {
    Alert.alert("Stop Recording", "Do you want to save this route?", [
      {
        text: "Discard",
        onPress: async () => {
          await stopRecording();
          setRouteName("");
          setRouteDescription("");
          setRecordingTime(0);
        },
        style: "destructive",
      },
      {
        text: "Save",
        onPress: () => {
          setShowSaveModal(true);
        },
      },
    ]);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert("Error", "Please enter a route name");
      return;
    }

    try {
      await saveRoute(routeName, routeDescription);
      Alert.alert("Success", "Route saved successfully!");
      setShowSaveModal(false);
      setRouteName("");
      setRouteDescription("");
      setRecordingTime(0);
    } catch (error) {
      Alert.alert("Error", "Failed to save route");
      console.error("Error saving route:", error);
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
            <SOSHeaderButton onPress={() => setSOSModalVisible(true)} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Map</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              currentRoute && !isRecording && styles.recordButtonDisabled,
            ]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            disabled={currentRoute !== null && !isRecording}
          >
            <Ionicons
              name={isRecording ? "stop-circle" : "stop"}
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

        {/* Save Route Modal */}
        <Modal
          visible={showSaveModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSaveModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Save Route</Text>

              <TextInput
                style={styles.input}
                placeholder="Route Name"
                value={routeName}
                onChangeText={setRouteName}
                placeholderTextColor={COLORS.lightText}
              />

              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Description (optional)"
                value={routeDescription}
                onChangeText={setRouteDescription}
                multiline={true}
                numberOfLines={4}
                placeholderTextColor={COLORS.lightText}
              />

              <View style={styles.routeStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>
                    {formatDistance(currentRoute?.distance || 0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>
                    {formatTime(recordingTime)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Points</Text>
                  <Text style={styles.statValue}>
                    {currentRoute?.points.length || 0}
                  </Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowSaveModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveRoute}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 18,
    color: COLORS.darkSandBrown,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.sandBeige,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.offWhiteDesert,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  routeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.sandBeige,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.palmBrown,
    marginBottom: 4,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkSandBrown,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.sandBeige,
  },
  saveButton: {
    backgroundColor: COLORS.desertOrange,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default HomePage;
