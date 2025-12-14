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
import { IMapContext, IMapState, ILocation } from "../types/map";

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
  const [state, setState] = useState<IMapState>({
    locations: [],
    routes: [],
    pois: [],
    heatmapData: [],
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
      setState((prevState) => ({
        ...prevState,
        routes: routesRes.data,
        pois: poisRes.data,
        heatmapData: heatmapRes.data,
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

  useEffect(() => {
    // Initialize Socket.IO connection (use base URL without /api)
    const socketUrl = BASE_URL.replace("/api", "");
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Fetch initial data when the component mounts
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
  }, []);

  return (
    <MapContext.Provider
      value={{ ...state, fetchInitialData, sendLocationUpdate }}
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
