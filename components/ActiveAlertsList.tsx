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
} from "react-native";
import * as Location from "expo-location";
import { getActiveSOSAlerts, offerHelp, cancelHelp } from "../api/sos";
import { ISOSAlert } from "../types/sos";
import socket from "../api/socket";
import { useAuth } from "../context/AuthContext";

const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`;

const ActiveAlertsList = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ISOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

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
      /* ... */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const handleNew = (newAlert: ISOSAlert) =>
      setAlerts((prev) =>
        [...prev, newAlert].sort((a, b) => a.distance - b.distance)
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
          },
        },
      ]);
    } else {
      Alert.alert("Offer Help", `Help ${alert.user.username}?`, [
        { text: "Cancel" },
        {
          text: "Yes",
          onPress: async () => {
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
          },
        },
      ]);
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <FlatList
      data={alerts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const isHelping = (item.helpers || []).includes(user!._id);
        return (
          <View style={styles.alertCard}>
            <View>
              <Text>{item.user.username} needs help</Text>
              <Text>{formatDistance(item.distance)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleHelpPress(item)}>
              <Text>{isHelping ? "Cancel" : "Help"}</Text>
            </TouchableOpacity>
          </View>
        );
      }}
      ListEmptyComponent={<Text>No active alerts.</Text>}
    />
  );
};

// ... Add your styles
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
});

export default ActiveAlertsList;
