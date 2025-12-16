import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import {
  IMapContext,
  IMapState,
  ILocation,
  IPinnedPlace,
  CreatePinData,
} from "../types/map";
import { getCurrentUser } from "../api/user";
import { BASE_URL } from "../api/index";
import { getAllMapData } from "../api/map";
import {
  getAllPins,
  getPinsByUserId,
  createPin as createPinAPI,
  updatePin as updatePinAPI,
  deletePin as deletePinAPI,
} from "../api/pins";
import { useAuth } from "./AuthContext";

const MapContext = createContext<IMapContext | undefined>(undefined);

// Helper function to validate MongoDB ObjectId format
// MongoDB ObjectIds are 24-character hexadecimal strings
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const MapProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use user from AuthContext instead of maintaining separate state
  const { user } = useAuth();
  const [state, setState] = useState<IMapState>({
    locations: [],
    routes: [],
    pois: [],
    heatmapData: [],
    pinnedPlaces: [],
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  // Function to fetch initial data from the backend
  const fetchInitialData = async () => {
    try {
      console.log("🗺️ Fetching map data...");

      // Fetch map data (routes, pois, heatmap)
      const mapData = await getAllMapData();

      // Fetch pinned places
      let pinnedPlaces: IPinnedPlace[] = [];
      try {
        // Fetch all pins
        const allPins = await getAllPins();
        console.log("📌 Fetched all pins:", allPins.length);

        // Filter public pins (visible to all)
        const publicPins = allPins.filter((pin) => pin.isPublic === true);
        console.log("📌 Public pins:", publicPins.length);

        // If user is authenticated, also get their private pins
        if (user?._id) {
          console.log(
            "👤 User authenticated, fetching private pins for:",
            user._id
          );

          // Only call API if user ID is a valid MongoDB ObjectId
          // Skip API call for mock/test users with invalid ObjectIds
          if (isValidObjectId(user._id)) {
            try {
              const userPins = await getPinsByUserId(user._id);
              console.log("📌 User pins fetched:", userPins.length);

              const privatePins = userPins.filter(
                (pin) => pin.isPublic === false
              );
              console.log("📌 Private pins from API:", privatePins.length);

              // Also check allPins for any private pins that belong to this user (fallback)
              const privatePinsFromAll = allPins.filter(
                (pin) => pin.isPublic === false && pin.userId?._id === user._id
              );
              console.log(
                "📌 Private pins from allPins:",
                privatePinsFromAll.length
              );

              // Combine all private pins (from API and allPins), avoiding duplicates
              const allPrivatePins = [...privatePins, ...privatePinsFromAll];
              const privatePinMap = new Map();
              allPrivatePins.forEach((pin) => {
                privatePinMap.set(pin._id, pin);
              });
              const uniquePrivatePins = Array.from(privatePinMap.values());

              // Combine public pins and user's private pins, avoiding duplicates
              const pinMap = new Map();
              [...publicPins, ...uniquePrivatePins].forEach((pin) => {
                pinMap.set(pin._id, pin);
              });
              pinnedPlaces = Array.from(pinMap.values());
              console.log("📌 Total pins to display:", pinnedPlaces.length);
            } catch (userPinsError: any) {
              // If user pins fetch fails with an error (not 404), try fallback
              console.warn(
                "⚠️ Failed to fetch user pins via API:",
                userPinsError
              );

              // Fallback: filter private pins from allPins if they belong to the user
              const privatePinsFromAll = allPins.filter(
                (pin) => pin.isPublic === false && pin.userId?._id === user._id
              );
              console.log(
                "📌 Private pins from allPins (fallback):",
                privatePinsFromAll.length
              );

              // Combine public pins and user's private pins
              const pinMap = new Map();
              [...publicPins, ...privatePinsFromAll].forEach((pin) => {
                pinMap.set(pin._id, pin);
              });
              pinnedPlaces = Array.from(pinMap.values());
              console.log("📌 Total pins (fallback):", pinnedPlaces.length);
            }
          } else {
            // User ID is not a valid MongoDB ObjectId (e.g., mock/test user)
            console.log(
              "⚠️ User ID is not a valid MongoDB ObjectId, skipping API call"
            );
            console.log(
              "📌 Using fallback: filtering private pins from allPins"
            );

            // Fallback: filter private pins from allPins if they belong to the user
            const privatePinsFromAll = allPins.filter(
              (pin) => pin.isPublic === false && pin.userId?._id === user._id
            );
            console.log(
              "📌 Private pins from allPins:",
              privatePinsFromAll.length
            );

            // Combine public pins and user's private pins
            const pinMap = new Map();
            [...publicPins, ...privatePinsFromAll].forEach((pin) => {
              pinMap.set(pin._id, pin);
            });
            pinnedPlaces = Array.from(pinMap.values());
            console.log(
              "📌 Total pins (using allPins only):",
              pinnedPlaces.length
            );
          }
        } else {
          // No user authenticated, only show public pins
          console.log("👤 No user authenticated, showing only public pins");
          pinnedPlaces = publicPins;
        }
      } catch (pinsError) {
        console.warn("⚠️ Failed to fetch pinned places:", pinsError);
        // Continue without pins
      }

      // Transform heatmap data to match IMapState format
      const heatmapData = mapData.heatmapData.map((point) => ({
        lng: point.location.coordinates[0],
        lat: point.location.coordinates[1],
        weight: point.intensity || 1,
      }));

      setState((prevState) => ({
        ...prevState,
        routes: mapData.routes,
        pois: mapData.pois,
        heatmapData,
        pinnedPlaces,
      }));
      console.log("✅ Map data fetched successfully");
    } catch (error: any) {
      if (error.response) {
        console.warn("⚠️ Map API responded with error:", error.response.status);
      } else if (error.request) {
        console.warn(
          "⚠️ No response from map API. Is the backend server running?"
        );
      } else {
        console.error("❌ Error setting up map data request:", error.message);
      }
      // Silently fail - app can still work without map data
    }
  };

  // Function to send a user's location to the backend
  const sendLocationUpdate = (location: {
    userId: string;
    longitude: number;
    latitude: number;
  }) => {
    socket?.emit("update-location", location);
  };

  // Function to create a new pin
  const createPin = async (pinData: CreatePinData) => {
    // Use userId from pinData if provided (from AuthContext), otherwise use user from AuthContext
    let userId = pinData.userId || user?._id;

    if (!userId) {
      try {
        console.log("🔄 User not set, fetching user...");
        const fetchedUser = await getCurrentUser();
        userId = fetchedUser._id;
        if (!userId) {
          throw new Error("User not authenticated");
        }
      } catch (error) {
        console.error("❌ Cannot create pin - user not authenticated:", error);
        throw new Error(
          "User not authenticated. Please log in to create pins."
        );
      }
    }

    // Validate that userId is a valid MongoDB ObjectId
    if (!isValidObjectId(userId)) {
      console.error("❌ Invalid user ID format:", userId);
      throw new Error(
        "Invalid user ID format. Cannot create pin with test/mock user. Please log in with a real account."
      );
    }

    try {
      // Use the API function from api/pins.ts
      const newPin = await createPinAPI(pinData, userId);

      // Add new pin to state
      setState((prevState) => ({
        ...prevState,
        pinnedPlaces: [...prevState.pinnedPlaces, newPin],
      }));

      return newPin;
    } catch (error) {
      // Error is already logged in the API function
      throw error;
    }
  };

  // Function to update a pin
  const updatePin = async (
    pinId: string,
    pinData: Partial<CreatePinData>
  ): Promise<IPinnedPlace> => {
    try {
      const updatedPin = await updatePinAPI(pinId, pinData);

      // Update pin in state
      setState((prevState) => ({
        ...prevState,
        pinnedPlaces: prevState.pinnedPlaces.map((pin) =>
          pin._id === pinId ? updatedPin : pin
        ),
      }));

      return updatedPin;
    } catch (error) {
      console.error("Error updating pin:", error);
      throw error;
    }
  };

  // Function to delete a pin
  const deletePin = async (pinId: string): Promise<void> => {
    try {
      await deletePinAPI(pinId);

      // Remove pin from state
      setState((prevState) => ({
        ...prevState,
        pinnedPlaces: prevState.pinnedPlaces.filter((pin) => pin._id !== pinId),
      }));
    } catch (error) {
      console.error("Error deleting pin:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Initialize Socket.IO connection (use base URL without /api)
    const socketUrl = BASE_URL.replace("/api", "");
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Fetch initial data when the component mounts or user changes
    fetchInitialData();

    // Listen for real-time location updates from the server
    newSocket.on("new-location", (newLocation: ILocation) => {
      setState((prevState) => ({
        ...prevState,
        locations: [...prevState.locations, newLocation],
      }));
    });

    // Clean up the socket connection on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]); // Re-fetch when user changes

  return (
    <MapContext.Provider
      value={{
        ...state,
        fetchInitialData,
        sendLocationUpdate,
        createPin,
        updatePin,
        deletePin,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

// Custom hook to use the MapContext
export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
};
