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

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const MapProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [state, setState] = useState<IMapState>({
    locations: [],
    routes: [],
    pois: [],
    pinnedPlaces: [],
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchInitialData = async () => {
    try {
      console.log("🗺️ Fetching map data...");

      const mapData = await getAllMapData();

      let pinnedPlaces: IPinnedPlace[] = [];
      try {
        const allPins = await getAllPins();
        console.log("📌 Fetched all pins:", allPins.length);

        const publicPins = allPins.filter((pin) => pin.isPublic === true);
        console.log("📌 Public pins:", publicPins.length);

        if (user?._id) {
          console.log(
            "👤 User authenticated, fetching private pins for:",
            user._id
          );

          if (isValidObjectId(user._id)) {
            try {
              const userPins = await getPinsByUserId(user._id);
              console.log("📌 User pins fetched:", userPins.length);

              const privatePins = userPins.filter(
                (pin) => pin.isPublic === false
              );
              console.log("📌 Private pins from API:", privatePins.length);

              const privatePinsFromAll = allPins.filter(
                (pin) => pin.isPublic === false && pin.userId?._id === user._id
              );
              console.log(
                "📌 Private pins from allPins:",
                privatePinsFromAll.length
              );

              const allPrivatePins = [...privatePins, ...privatePinsFromAll];
              const privatePinMap = new Map();
              allPrivatePins.forEach((pin) => {
                privatePinMap.set(pin._id, pin);
              });
              const uniquePrivatePins = Array.from(privatePinMap.values());

              const pinMap = new Map();
              [...publicPins, ...uniquePrivatePins].forEach((pin) => {
                pinMap.set(pin._id, pin);
              });
              pinnedPlaces = Array.from(pinMap.values());
              console.log("📌 Total pins to display:", pinnedPlaces.length);
            } catch (userPinsError: any) {
              console.warn(
                "⚠️ Failed to fetch user pins via API:",
                userPinsError
              );

              const privatePinsFromAll = allPins.filter(
                (pin) => pin.isPublic === false && pin.userId?._id === user._id
              );
              console.log(
                "📌 Private pins from allPins (fallback):",
                privatePinsFromAll.length
              );

              const pinMap = new Map();
              [...publicPins, ...privatePinsFromAll].forEach((pin) => {
                pinMap.set(pin._id, pin);
              });
              pinnedPlaces = Array.from(pinMap.values());
              console.log("📌 Total pins (fallback):", pinnedPlaces.length);
            }
          } else {
            console.log(
              "⚠️ User ID is not a valid MongoDB ObjectId, skipping API call"
            );
            console.log(
              "📌 Using fallback: filtering private pins from allPins"
            );

            const privatePinsFromAll = allPins.filter(
              (pin) => pin.isPublic === false && pin.userId?._id === user._id
            );
            console.log(
              "📌 Private pins from allPins:",
              privatePinsFromAll.length
            );

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
          console.log("👤 No user authenticated, showing only public pins");
          pinnedPlaces = publicPins;
        }
      } catch (pinsError) {
        console.warn("⚠️ Failed to fetch pinned places:", pinsError);
      }

      setState((prevState) => ({
        ...prevState,
        routes: mapData.routes,
        pois: mapData.pois,
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
    }
  };

  const sendLocationUpdate = (location: {
    userId: string;
    longitude: number;
    latitude: number;
  }) => {
    socket?.emit("update-location", location);
  };

  const createPin = async (pinData: CreatePinData) => {
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

    if (!isValidObjectId(userId)) {
      console.error("❌ Invalid user ID format:", userId);
      throw new Error(
        "Invalid user ID format. Cannot create pin with test/mock user. Please log in with a real account."
      );
    }

    try {
      const newPin = await createPinAPI(pinData, userId);

      setState((prevState) => ({
        ...prevState,
        pinnedPlaces: [...prevState.pinnedPlaces, newPin],
      }));

      return newPin;
    } catch (error) {
      throw error;
    }
  };

  const updatePin = async (
    pinId: string,
    pinData: Partial<CreatePinData>
  ): Promise<IPinnedPlace> => {
    try {
      const updatedPin = await updatePinAPI(pinId, pinData);

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

  const deletePin = async (pinId: string): Promise<void> => {
    try {
      await deletePinAPI(pinId);

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
    const socketUrl = BASE_URL.replace("/api", "");
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    fetchInitialData();

    newSocket.on("new-location", (newLocation: ILocation) => {
      setState((prevState) => ({
        ...prevState,
        locations: [...prevState.locations, newLocation],
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

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

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
};
