import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { useRouteRecording } from "../../../../context/RouteRecordingContext";
import { useSettings } from "../../../../context/SettingsContext";
import { useAlert } from "../../../../context/AlertContext";
import { useTheme } from "../../../../context/ThemeContext";
import CustomAlert from "../../../../components/CustomAlert";
import { IGPSPoint } from "../../../../types/route";
import InteractiveMap from "../../../../components/InteractiveMap";
import SOSModal from "../../../../components/SOSModal";
import SOSHeaderButton from "../../../../components/SOSHeaderButton";
import SaveRouteModal from "../../../../components/SaveRouteModal";
import COLORS from "../../../../data/colors";

const HomePage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    isRecording,
    currentRoute,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    addPoint,
    saveRoute,
    discardRecording, // Import discardRecording
  } = useRouteRecording();
  const { units } = useSettings();
  const { alert } = useAlert();
  const { colors } = useTheme();

  const navigation = useNavigation();
  const [screenshotUri, setScreenshotUri] = useState<string | undefined>(
    undefined
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSOSModalVisible, setSOSModalVisible] = useState(false);
  const [showStopRecordingAlert, setShowStopRecordingAlert] = useState(false);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const userLocationSubscriptionRef =
    useRef<Location.LocationSubscription | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [displayedRoute, setDisplayedRoute] = useState(null);

  // Parse route from navigation params
  useEffect(() => {
    if (params.route) {
      try {
        setDisplayedRoute(JSON.parse(params.route as string));
      } catch (error) {
        console.error("Error parsing route from params:", error);
      }
    }
  }, [params.route]);

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
    alert("Start Recording", "Do you want to start recording your route?", [
      {
        text: "No",
        onPress: () => {
          // Do nothing
        },
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: () => {
          startRecording();
          setRecordingTime(0);
        },
      },
    ]);
  };

  const handleStopRecording = async () => {
    await stopRecording(); // Pause the recording first
    setShowStopRecordingAlert(true);
  };

  const handleCancelStopRecording = async () => {
    setShowStopRecordingAlert(false);
    await resumeRecording(); // Resume recording when canceling
  };

  const handleDiscardRoute = async () => {
    setShowStopRecordingAlert(false);
    await discardRecording(); // Use discardRecording to clear the route
    setRecordingTime(0);
    setScreenshotUri(undefined);
  };

  const handleSaveRouteFromAlert = () => {
    setShowStopRecordingAlert(false);
    setScreenshotUri(undefined);
    setShowSaveModal(true);
  };

  const handleSaveRoute = async (
    name: string,
    description: string,
    isPublic: boolean,
    routeType: string
  ) => {
    try {
      await saveRoute(name, description, isPublic, routeType, screenshotUri);
      alert("Success", "Route saved successfully!");
      setShowSaveModal(false);
      setRecordingTime(0);
      setScreenshotUri(undefined);

      if (isPublic) {
        router.push("/(protected)/(tabs)/community");
      } else {
        router.push("/(protected)/(tabs)/saved");
      }
    } catch (error: any) {
      if (
        error?.message?.includes("Route must have") ||
        error?.message?.includes("at least") ||
        error?.message?.includes("Route name is required")
      ) {
        return;
      }

      if (
        error?.code === "ERR_NETWORK" ||
        error?.message?.includes("Network Error")
      ) {
        alert(
          "Backend Server Not Available",
          "The backend server is not running or not reachable.\n\n" +
            "To fix this:\n" +
            "1. Start your backend server on port 8000\n" +
            "2. Make sure your device/simulator can reach the server\n" +
            "3. Check the console for the API URL being used\n\n" +
            "Note: The route data is still saved locally and can be synced when the server is available."
        );
      } else {
        alert("Error", "Failed to save route. Please try again.");
      }
      if (
        __DEV__ &&
        !(
          error?.code === "ERR_NETWORK" ||
          error?.message?.includes("Network Error")
        )
      ) {
        console.warn("Error saving route:", error?.message || error);
      }
      throw error;
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
      const miles = km * 0.621371;
      if (miles < 1) {
        const feet = miles * 5280;
        return `${feet.toFixed(0)}ft`;
      }
      return `${miles.toFixed(2)}mi`;
    } else {
      if (km < 1) {
        return `${(km * 1000).toFixed(0)}m`;
      }
      return `${km.toFixed(2)}km`;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
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
            <Image
              source={require("../../../../assets/darbna-iconV3-2.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
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
              activeOpacity={0.7}
            >
              {isRecording ? (
                <View style={styles.recordDot} />
              ) : currentRoute ? (
                <View style={styles.stopSquare} />
              ) : (
                <View style={styles.recordCircle} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <InteractiveMap
          userLocation={userLocation}
          currentRoute={displayedRoute || currentRoute}
          onCloseRoute={() => setDisplayedRoute(null)}
        />

        {/* Recording Status Bar */}
        {currentRoute &&
          (() => {
            const isPaused = !isRecording;
            return (
              <View
                style={[styles.statusBar, isPaused && styles.statusBarPaused]}
              >
                <View style={styles.statusContent}>
                  <View style={styles.statusItem}>
                    <View style={styles.statusItemHeader}>
                      {!isPaused && <View style={styles.recordingIndicator} />}
                      <Text style={styles.statusLabel}>
                        {isPaused ? "Paused" : "Recording"}
                      </Text>
                    </View>
                    <Text style={styles.statusValue}>
                      {formatTime(recordingTime)}
                    </Text>
                  </View>
                  <View style={styles.statusDivider} />
                  <View style={styles.statusItem}>
                    <View style={styles.statusItemHeader}>
                      <Ionicons
                        name="resize-outline"
                        size={14}
                        color={COLORS.white}
                        style={styles.statusIcon}
                      />
                      <Text style={styles.statusLabel}>Distance</Text>
                    </View>
                    <Text style={styles.statusValue}>
                      {formatDistance(currentRoute.distance)}
                    </Text>
                  </View>
                  <View style={styles.statusDivider} />
                  <TouchableOpacity
                    style={[
                      styles.pauseButton,
                      isPaused && styles.pauseButtonPaused,
                    ]}
                    onPress={isPaused ? resumeRecording : pauseRecording}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isPaused ? "play" : "pause"}
                      size={22}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

        {/* Save Route Modal */}
        <SaveRouteModal
          visible={showSaveModal}
          distance={currentRoute?.distance || 0}
          duration={recordingTime}
          screenshotUri={screenshotUri}
          onSave={handleSaveRoute}
          onCancel={() => {
            setShowSaveModal(false);
            // If user cancels save, discard the route
            discardRecording();
          }}
        />

        {/* SOS Modal */}
        <SOSModal
          visible={isSOSModalVisible}
          onClose={() => setSOSModalVisible(false)}
          userLocation={userLocation}
        />

        {/* Stop Recording Alert */}
        <CustomAlert
          visible={showStopRecordingAlert}
          title="Stop Recording"
          message="Do you want to save this route?"
          buttons={[
            {
              text: "Discard",
              style: "destructive",
              onPress: handleDiscardRoute,
            },
            {
              text: "Save",
              style: "default",
              onPress: handleSaveRouteFromAlert,
            },
          ]}
          onDismiss={handleCancelStopRecording}
          type="warning"
          showCloseButton={true}
          onClose={handleCancelStopRecording}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 25,
    backgroundColor: COLORS.darkSandBrown,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
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
  headerLogo: {
    width: 150,
    height: 100,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.desertOrange,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: COLORS.white,
    borderColor: "#FF0000", // Bright red for recording
    shadowColor: "#FF0000",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    borderWidth: 4,
  },
  recordButtonDisabled: {
    backgroundColor: COLORS.sandBeige,
    opacity: 0.6,
    borderColor: COLORS.lightText,
    elevation: 2,
  },
  recordDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF0000", // Bright red
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  recordCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.desertOrange,
    borderWidth: 2,
    borderColor: COLORS.desertOrange,
  },
  stopSquare: {
    width: 18,
    height: 18,
    backgroundColor: COLORS.lightText,
    borderRadius: 2,
  },
  statusBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.desertOrange,
    borderRadius: 20,
    padding: 18,
    zIndex: 10,
    elevation: 8,
    shadowColor: COLORS.desertOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statusBarPaused: {
    backgroundColor: "#a89080",
    shadowColor: "#a89080",
    shadowOpacity: 0.3,
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
  statusItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    marginRight: 6,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    marginRight: 4,
    opacity: 0.9,
  },
  statusLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.95,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  statusValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginHorizontal: 8,
  },
  pauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pauseButtonPaused: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
});

export default HomePage;
