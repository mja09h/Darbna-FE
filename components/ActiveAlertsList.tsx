import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import { getActiveSOSAlerts, offerHelp, cancelHelp } from "../api/sos";
import { ISOSAlert } from "../types/sos";
import socket from "../api/socket";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`;

const ActiveAlertsList = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ISOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({});
      const data = await getActiveSOSAlerts({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setAlerts(data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // FIXED: Added pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
    const handleNew = (newAlert: ISOSAlert) =>
      setAlerts((prev) =>
        // FIXED: Sort by newest first (createdAt descending), then by distance
        [...prev, newAlert].sort((a, b) => {
          const dateCompare =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.distance - b.distance;
        })
      );
    const handleRemove = ({ alertId }: { alertId: string }) =>
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    socket.on("new-sos-alert", handleNew);
    socket.on("sos-alert-resolved", handleRemove);
    socket.on("sos-alert-expired", handleRemove);
    return () => {
      socket.off("new-sos-alert");
      socket.off("sos-alert-resolved");
      socket.off("sos-alert-expired");
    };
  }, [fetchAlerts]);

  const handleHelpPress = async (alert: ISOSAlert) => {
    const isHelping = (alert.helpers || []).includes(user!._id);
    if (isHelping) {
      Alert.alert("Cancel Help", "Are you sure?", [
        { text: "No" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await cancelHelp(alert._id);
              setAlerts((p) =>
                p.map((a) =>
                  a._id === alert._id
                    ? {
                        ...a,
                        helpers: (a.helpers || []).filter(
                          (id) => id !== user!._id
                        ),
                      }
                    : a
                )
              );
            } catch (error) {
              Alert.alert("Error", "Failed to cancel help");
              console.error("Error canceling help:", error);
            }
          },
        },
      ]);
    } else {
      Alert.alert("Offer Help", `Help ${alert.user.username}?`, [
        { text: "Cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const { phoneNumber } = await offerHelp(alert._id);
              setAlerts((p) =>
                p.map((a) =>
                  a._id === alert._id
                    ? { ...a, helpers: [...(a.helpers || []), user!._id] }
                    : a
                )
              );
              Alert.alert("Help Offered!", `Contact at: ${phoneNumber}`, [
                { text: "OK" },
                {
                  text: "Call Now",
                  onPress: () => Linking.openURL(`tel:${phoneNumber}`),
                },
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to offer help");
              console.error("Error offering help:", error);
            }
          },
        },
      ]);
    }
  };

  if (loading && !refreshing) return <ActivityIndicator />;

  return (
    <FlatList
      data={alerts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const isHelping = (item.helpers || []).includes(user!._id);
        return (
          <View style={styles.alertCard}>
            <View style={styles.alertInfo}>
              <Text style={styles.username}>
                {item.user.username} needs help
              </Text>
              <Text style={styles.distance}>
                {formatDistance(item.distance)}
              </Text>
              {/* FIXED: Display time since alert was sent */}
              <Text style={styles.timeAgo}>
                {formatDistanceToNow(new Date(item.createdAt))} ago
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.helpButton, isHelping && styles.helpButtonActive]}
              onPress={() => handleHelpPress(item)}
            >
              <Text style={styles.helpButtonText}>
                {isHelping ? "Cancel" : "Help"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active alerts.</Text>
        </View>
      }
      // FIXED: Added RefreshControl for pull-to-refresh
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

const styles = StyleSheet.create({
  alertCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  // FIXED: Added time ago styling
  timeAgo: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
  },
  helpButton: {
    backgroundColor: "#D9534F",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 12,
  },
  helpButtonActive: {
    backgroundColor: "#666666",
  },
  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
  },
});

export default ActiveAlertsList;
