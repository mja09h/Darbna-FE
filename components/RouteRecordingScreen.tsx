import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import * as Location from "expo-location";
import { useRouteRecording } from "../context/RouteRecordingContext";
import { IGPSPoint } from "../types/route";
import InteractiveMap from "./InteractiveMap";

const RouteRecordingScreen = () => {
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
  const [routeDescription, setRouteDescription] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const [recordingTime, setRecordingTime] = useState(0);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  // Request location permissions and start tracking
  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for route recording"
        );
        return;
      }
    };

    requestLocationPermission();
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
    if (!isRecording || !currentRoute?.startTime) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - (currentRoute?.startTime?.getTime() || 0)) / 1000
      );
      setRecordingTime(elapsed);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRecording, currentRoute?.startTime]);

  // Reset timer when recording stops
  useEffect(() => {
    if (!isRecording) {
      setRecordingTime(0);
    }
  }, [isRecording]);

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
      await saveRoute(routeName, routeDescription, false, "Running");

      // Stop recording and reset state/timer
      await stopRecording();
      setRecordingTime(0);
      setShowSaveModal(false);
      setRouteName("");
      setRouteDescription("");

      Alert.alert("Success", "Route saved successfully!");
    } catch (error: any) {
      // Handle network errors gracefully
      if (
        error?.code === "ERR_NETWORK" ||
        error?.message?.includes("Network Error")
      ) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to server. Please check your connection and try again."
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
    <View style={styles.container}>
      <InteractiveMap userLocation={userLocation} currentRoute={currentRoute} />

      {/* Recording Status Bar */}
      {isRecording && currentRoute && (
        <View style={styles.statusBar}>
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Recording</Text>
            <Text style={styles.statusValue}>{formatTime(recordingTime)}</Text>
            <Text style={styles.statusLabel}>Distance</Text>
            <Text style={styles.statusValue}>
              {formatDistance(currentRoute.distance)}
            </Text>
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlContainer}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartRecording}
          >
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={pauseRecording}
            >
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopRecording}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (optional)"
              value={routeDescription}
              onChangeText={setRouteDescription}
              multiline={true}
              numberOfLines={4}
              placeholderTextColor="#999"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    borderRadius: 8,
    padding: 12,
    zIndex: 10,
  },
  statusContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statusLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  controlContainer: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  pauseButton: {
    backgroundColor: "#FF9800",
    flex: 0.5,
  },
  stopButton: {
    backgroundColor: "#f44336",
    flex: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: "#333",
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  routeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});

export default RouteRecordingScreen;
