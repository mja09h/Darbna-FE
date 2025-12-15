import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import Constants from "expo-constants";
import {
  IMapContext,
  IMapState,
  ILocation,
  IPinnedPlace,
  CreatePinData,
} from "../types/map";
import { getCurrentUser } from "../api/user";
import api from "../api/index";

// Helper to get the correct base URL for development (same as api/index.ts)
const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (localhost) {
    // Running on physical device or emulator via Expo Go
    return `http://${localhost}:8000/api`;
  }

  // Fallback for iOS Simulator or other cases
  return "http://localhost:8000/api";
};

const BASE_URL = getBaseUrl();
const MAP_API_URL = `${BASE_URL}/map`;

const MapContext = createContext<IMapContext | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<{ _id: string } | null>(null);
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
      console.log("🗺️ Fetching map data from:", MAP_API_URL);
      const [routesRes, poisRes, heatmapRes] = await Promise.all([
        axios.get(`${MAP_API_URL}/routes`),
        axios.get(`${MAP_API_URL}/pois`),
        axios.get(`${MAP_API_URL}/heatmap`),
      ]);

      // Fetch pinned places
      let pinnedPlaces: IPinnedPlace[] = [];
      try {
        // Fetch all pins
        const allPinsRes = await axios.get(`${BASE_URL}/pins`);
        const allPins: IPinnedPlace[] = allPinsRes.data || [];

        // Filter public pins (visible to all)
        const publicPins = allPins.filter((pin) => pin.isPublic === true);

        // If user is authenticated, also get their private pins
        if (currentUser?._id) {
          try {
            const userPinsRes = await axios.get(
              `${BASE_URL}/pins/user/${currentUser._id}`
            );
            const userPins: IPinnedPlace[] = userPinsRes.data || [];
            const privatePins = userPins.filter(
              (pin) => pin.isPublic === false
            );

            // Combine public pins and user's private pins, avoiding duplicates
            const pinMap = new Map<string, IPinnedPlace>();
            [...publicPins, ...privatePins].forEach((pin) => {
              pinMap.set(pin._id, pin);
            });
            pinnedPlaces = Array.from(pinMap.values());
          } catch (userPinsError) {
            // If user pins fetch fails, just use public pins
            console.warn("⚠️ Failed to fetch user pins:", userPinsError);
            pinnedPlaces = publicPins;
          }
        } else {
          // No user authenticated, only show public pins
          pinnedPlaces = publicPins;
        }
      } catch (pinsError) {
        console.warn("⚠️ Failed to fetch pinned places:", pinsError);
        // Continue without pins
      }

      setState((prevState) => ({
        ...prevState,
        routes: routesRes.data,
        pois: poisRes.data,
        heatmapData: heatmapRes.data,
        pinnedPlaces,
      }));
      console.log("✅ Map data fetched successfully");
    } catch (error: any) {
      if (error.response) {
        console.warn("⚠️ Map API responded with error:", error.response.status);
      } else if (error.request) {
        console.warn(
          "⚠️ No response from map API. Is the backend server running?",
          MAP_API_URL
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
    // Use userId from pinData if provided (from AuthContext), otherwise try currentUser or fetch
    let userId = pinData.userId || currentUser?._id;

    if (!userId) {
      try {
        console.log("🔄 User not set, fetching user...");
        const user = await getCurrentUser();
        setCurrentUser(user);
        userId = user._id;
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

    const formData = new FormData();
    formData.append("title", pinData.title);
    formData.append("category", pinData.category);
    formData.append("isPublic", pinData.isPublic.toString());
    formData.append("userId", userId);

    // Description is optional
    if (pinData.description) {
      formData.append("description", pinData.description);
    }

    // Location - backend accepts both formats, using separate lat/lng for better compatibility
    formData.append("latitude", pinData.location.latitude.toString());
    formData.append("longitude", pinData.location.longitude.toString());

    // Image is optional - only append if provided
    if (pinData.image) {
      const imageUri = pinData.image.uri;
      const filename = imageUri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);
    }

    try {
      console.log("📌 Creating pin with data:", {
        title: pinData.title,
        category: pinData.category,
        isPublic: pinData.isPublic,
        location: pinData.location,
        hasImage: !!pinData.image,
        userId: userId,
      });

      const response = await api.post("/pins", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        transformRequest: (data) => {
          return data; // Let axios handle FormData
        },
      });

      console.log("✅ Pin created successfully:", response.data);

      // Add new pin to state
      setState((prevState) => ({
        ...prevState,
        pinnedPlaces: [...prevState.pinnedPlaces, response.data],
      }));

      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating pin:", error);
      if (error.response) {
        console.error(
          "❌ Error response data:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("❌ Error status:", error.response.status);
        console.error("❌ Error headers:", error.response.headers);

        // Create a more descriptive error message
        const errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`;
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).response = error.response;
        throw enhancedError;
      } else if (error.request) {
        console.error("❌ No response received:", error.request);
        throw new Error(
          "Network error: No response from server. Please check your connection."
        );
      } else {
        console.error("❌ Error message:", error.message);
        throw error;
      }
    }
  };

  // Fetch current user on mount and periodically
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        console.log("✅ User fetched in MapContext:", user._id);
      } catch (error) {
        // User not authenticated or token invalid
        console.warn("⚠️ Failed to fetch user in MapContext:", error);
        setCurrentUser(null);
      }
    };

    fetchUser();

    // Also try to fetch user periodically in case auth state changes
    const interval = setInterval(fetchUser, 5000);

    return () => clearInterval(interval);
  }, []);

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
  }, [currentUser?._id]); // Re-fetch when user changes

  return (
    <MapContext.Provider
      value={{ ...state, fetchInitialData, sendLocationUpdate, createPin }}
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
