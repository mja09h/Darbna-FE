import React, { useEffect } from "react";
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSavedRoutes } from "../../context/SavedRoutesContext";
import RouteItem from "./RouteItem";

const RouteListComponent = () => {
  const {
    savedRoutes,
    loading,
    fetchSavedRoutes,
    selectedFolder,
    searchQuery,
  } = useSavedRoutes();

  useEffect(() => {
    fetchSavedRoutes(selectedFolder?._id);
  }, [selectedFolder]);

  const filteredRoutes = savedRoutes.filter((route) =>
    route.routeId.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C46F26" />
      </View>
    );
  }

  if (filteredRoutes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No saved routes</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredRoutes}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <RouteItem route={item} />}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default RouteListComponent;
