import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios"; // Assuming you use axios
import { IMapContext, IMapState, ILocation } from "../types/map";

 const BACKEND_URL = 'http://localhost:8000';


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
        axios.get(`${BACKEND_URL}/api/map/routes`),
        axios.get(`${BACKEND_URL}/api/map/pois`),
        axios.get(`${BACKEND_URL}/api/map/heatmap`),
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
    const newSocket = io(BACKEND_URL);
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
