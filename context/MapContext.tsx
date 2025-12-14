import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import api, { BASE_URL } from "../api/index";
import { IMapContext, IMapState, ILocation } from "../types/map";

// Extract base URL without /api for Socket.IO connection
const getSocketUrl = () => {
  // BASE_URL is like "http://192.168.1.1:8000/api" or "http://localhost:8000/api"
  // Socket.IO needs just "http://192.168.1.1:8000" or "http://localhost:8000"
  return BASE_URL.replace("/api", "");
};

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
      const [routesRes, poisRes, heatmapRes] = await Promise.all([
        api.get("/map/routes"),
        api.get("/map/pois"),
        api.get("/map/heatmap"),
      ]);
      setState((prevState) => ({
        ...prevState,
        routes: routesRes.data,
        pois: poisRes.data,
        heatmapData: heatmapRes.data,
      }));
    } catch (error) {
      console.error("Failed to fetch initial map data:", error);
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
    // Initialize Socket.IO connection
    const socketUrl = getSocketUrl();
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
