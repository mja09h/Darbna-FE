import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import { getActiveSOSAlerts, offerHelp, cancelHelp } from "../api/sos";
import { ISOSAlert } from "../types/sos";
import socket from "../api/socket";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useAlert } from "../context/AlertContext";
import { formatDistanceToNow } from "date-fns";

const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`;

const ActiveAlertsList = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { alert } = useAlert();
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
    const handleNew = (newAlert: ISOSAlert) =>
      setAlerts((prev) =>
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

  const handleHelpPress = async (alertItem: ISOSAlert) => {
    const isHelping = (alertItem.helpers || []).includes(user!._id);
    if (isHelping) {
      alert("Cancel Help", "Are you sure?", [
        { text: "No" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await cancelHelp(alertItem._id);
              setAlerts((p) =>
                p.map((a) =>
                  a._id === alertItem._id
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
              alert("Error", "Failed to cancel help");
              console.error("Error canceling help:", error);
            }
          },
        },
      ]);
    } else {
      alert("Offer Help", `Help ${alertItem.user.username}?`, [
        { text: "Cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const { phoneNumber } = await offerHelp(alertItem._id);
              setAlerts((p) =>
                p.map((a) =>
                  a._id === alertItem._id
                    ? { ...a, helpers: [...(a.helpers || []), user!._id] }
                    : a
                )
              );
              alert("Help Offered!", `Contact at: ${phoneNumber}`, [
                { text: "OK" },
                {
                  text: "Call Now",
                  onPress: () => Linking.openURL(`tel:${phoneNumber}`),
                },
              ]);
            } catch (error) {
              alert("Error", "Failed to offer help");
              console.error("Error offering help:", error);
            }
          },
        },
      ]);
    }
  };

  // FIXED: Create dynamic styles based on theme
  const dynamicStyles = createDynamicStyles(colors, isDark);

  if (loading && !refreshing)
    return <ActivityIndicator color={colors.primary} />;

  return (
    <FlatList
      data={alerts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const isHelping = (item.helpers || []).includes(user!._id);
        const isOwnAlert = item.user._id === user!._id;

        return (
          <View style={[dynamicStyles.alertCard]}>
            <View style={styles.alertInfo}>
              <Text style={[styles.username, { color: colors.text }]}>
                {item.user.username} needs help
                {isOwnAlert && (
                  <Text style={styles.ownAlertBadge}> (Your SOS)</Text>
                )}
              </Text>
              <Text style={[styles.distance, { color: colors.textSecondary }]}>
                {formatDistance(item.distance)}
              </Text>
              <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
                {formatDistanceToNow(new Date(item.createdAt))} ago
              </Text>
            </View>
            {isOwnAlert ? (
              <View style={dynamicStyles.ownAlertButton}>
                <Text style={dynamicStyles.ownAlertButtonText}>Your Alert</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.helpButton,
                  isHelping && dynamicStyles.helpButtonActive,
                ]}
                onPress={() => handleHelpPress(item)}
              >
                <Text style={styles.helpButtonText}>
                  {isHelping ? "Cancel" : "Help"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No active alerts.
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );
};

// FIXED: Function to create dynamic styles based on theme
const createDynamicStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    alertCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 8,
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    helpButtonActive: {
      backgroundColor: isDark ? colors.surface : "#666666",
    },
    ownAlertButton: {
      backgroundColor: isDark ? colors.surface : "#E0E0E0",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      marginLeft: 12,
    },
    ownAlertButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
  });

const styles = StyleSheet.create({
  alertInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  ownAlertBadge: {
    fontSize: 14,
    fontWeight: "500",
    color: "#C46F26",
    fontStyle: "italic",
  },
  distance: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    fontStyle: "italic",
  },
  helpButton: {
    backgroundColor: "#D9534F",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 12,
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
  },
});

export default ActiveAlertsList;
