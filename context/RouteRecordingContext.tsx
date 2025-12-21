import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  IRouteRecordingState,
  IRouteRecordingContext,
  IGPSPoint,
  IRecordedRoute,
} from "../types/route";
import {
  createRoute,
  getUserRoutes,
  deleteRoute as deleteRouteAPI,
} from "../api/routes";
import { Alert } from "react-native";
import api from "../api";

const RouteRecordingContext = createContext<IRouteRecordingContext | undefined>(
  undefined
);

export const RouteRecordingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<IRouteRecordingState>({
    isRecording: false,
    currentRoute: null,
    recordedRoutes: [],
    selectedRoute: null,
  });

  const calculateDistance = useCallback(
    (point1: IGPSPoint, point2: IGPSPoint) => {
      const R = 6371; // Earth's radius in km
      const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
      const dLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.latitude * Math.PI) / 180) *
          Math.cos((point2.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    },
    []
  );

  const calculateDuration = useCallback((startTime: Date, endTime: Date) => {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }, []);

  const startRecording = useCallback(() => {
    const now = new Date();
    setState((prevState) => ({
      ...prevState,
      isRecording: true,
      currentRoute: {
        name: "",
        description: "",
        points: [],
        startTime: now,
        distance: 0,
        duration: 0,
        startPoint: undefined,
        endPoint: undefined,
      },
    }));
  }, []);

  const addPoint = useCallback(
    (point: IGPSPoint) => {
      setState((prevState) => {
        if (!prevState.currentRoute) return prevState;

        const updatedPoints = [...prevState.currentRoute.points, point];
        let totalDistance = prevState.currentRoute.distance;
        let duration = 0;

        // NEW: Set start point on first GPS point
        const startPoint = prevState.currentRoute.startPoint || {
          latitude: point.latitude,
          longitude: point.longitude,
        };

        // NEW: Update end point with current point
        const endPoint = {
          latitude: point.latitude,
          longitude: point.longitude,
        };

        if (updatedPoints.length > 1) {
          const previousPoint = updatedPoints[updatedPoints.length - 2];
          totalDistance += calculateDistance(previousPoint, point);
        }

        if (prevState.currentRoute.startTime) {
          duration = calculateDuration(
            prevState.currentRoute.startTime,
            point.timestamp
          );
        }

        return {
          ...prevState,
          currentRoute: {
            ...prevState.currentRoute,
            points: updatedPoints,
            distance: totalDistance,
            duration,
            startPoint,
            endPoint,
          },
        };
      });
    },
    [calculateDistance, calculateDuration]
  );

  const pauseRecording = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRecording: false,
    }));
  }, []);

  const resumeRecording = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRecording: true,
    }));
  }, []);

  const saveRoute = useCallback(
    async (
      routeName: string,
      description: string,
      isPublic: boolean,
      routeType: string,
      screenshotUri?: string
    ): Promise<IRecordedRoute> => {
      try {
        if (!routeName || !routeName.trim()) {
          Alert.alert("Error", "Route name is required");
          throw new Error("Route name is required.");
        }

        if (!state.currentRoute || state.currentRoute.points.length < 10) {
          Alert.alert(
            "Route Too Short",
            `Your route must have at least 10 GPS points. Currently you have ${
              state.currentRoute?.points.length || 0
            } points. Please record a longer path.`
          );
          throw new Error("Route must have at least 10 points.");
        }

        if (state.currentRoute.duration < 60) {
          const minutes = Math.floor(state.currentRoute.duration / 60);
          const seconds = state.currentRoute.duration % 60;
          Alert.alert(
            "Route Too Short",
            `Your route must be at least 1 minute long. Currently your route is ${minutes}m ${seconds}s. Please record for a longer duration.`
          );
          throw new Error("Route must be at least 1 minute long.");
        }

        const routeData = {
          name: routeName,
          description: description,
          path: {
            type: "LineString",
            coordinates: state.currentRoute.points.map((point) => [
              point.longitude,
              point.latitude,
            ]),
          },
          startTime: (state.currentRoute.startTime || new Date()).toISOString(),
          distance: state.currentRoute.distance,
          duration: state.currentRoute.duration,
          points: state.currentRoute.points.map((point) => ({
            ...point,
            timestamp: point.timestamp.toISOString(),
          })),
          isPublic: isPublic,
          routeType: routeType,
          startPoint: state.currentRoute.startPoint,
          endPoint: state.currentRoute.endPoint,
        };

        const savedRoute = await createRoute(routeData as any);

        if (screenshotUri) {
          try {
            const formData = new FormData();

            const filename =
              screenshotUri.split("/").pop() || "route-screenshot.png";
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/png`;

            formData.append("screenshot", {
              uri: screenshotUri,
              type: type,
              name: filename,
            } as any);

            await api.post<any>(
              `/routes/${savedRoute._id}/screenshot`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
          } catch (error) {
            if (__DEV__) {
              console.warn("Error uploading screenshot:", error);
            }
          }
        }

        setState((prevState) => ({
          ...prevState,
          recordedRoutes: [...prevState.recordedRoutes, savedRoute],
          currentRoute: null,
          isRecording: false,
        }));

        return savedRoute;
      } catch (error: any) {
        if (__DEV__) {
          if (
            error?.code === "ERR_NETWORK" ||
            error?.message?.includes("Network Error")
          ) {
          } else if (
            !error?.message?.includes("Route must have") &&
            !error?.message?.includes("at least") &&
            !error?.message?.includes("Route name is required")
          ) {
            console.warn("Error saving route:", error?.message || error);
          }
        }
        throw error;
      }
    },
    [state.currentRoute]
  );

  const stopRecording = useCallback(async () => {
    setState((prevState) => ({
      ...prevState,
      isRecording: false,
    }));
  }, []);

  const discardRecording = useCallback(async () => {
    setState((prevState) => ({
      ...prevState,
      isRecording: false,
      currentRoute: null,
    }));
  }, []);

  const deleteRoute = useCallback(async (routeId: string) => {
    try {
      await deleteRouteAPI(routeId);

      setState((prevState) => ({
        ...prevState,
        recordedRoutes: prevState.recordedRoutes.filter(
          (route) => route._id !== routeId
        ),
        selectedRoute:
          prevState.selectedRoute?._id === routeId
            ? null
            : prevState.selectedRoute,
      }));

      return true;
    } catch (error: any) {
      console.error("Error deleting route:", error);
      throw error;
    }
  }, []);

  const fetchUserRoutes = useCallback(async () => {
    try {
      const routes = await getUserRoutes();

      const privateRoutes = routes.filter((route) => route.isPublic === false);

      setState((prevState) => ({
        ...prevState,
        recordedRoutes: privateRoutes,
      }));
    } catch (error: any) {
      if (__DEV__) {
        if (
          !(
            error?.code === "ERR_NETWORK" ||
            error?.message?.includes("Network Error")
          )
        ) {
          console.warn("Error fetching user routes:", error?.message || error);
        }
      }
      throw error;
    }
  }, []);

  const selectRoute = useCallback((route: IRecordedRoute | null) => {
    setState((prevState) => ({
      ...prevState,
      selectedRoute: route,
    }));
  }, []);

  return (
    <RouteRecordingContext.Provider
      value={{
        ...state,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        addPoint,
        saveRoute,
        deleteRoute: deleteRouteAPI,
        fetchUserRoutes,
        selectRoute,
        calculateDistance,
        calculateDuration,
        discardRecording,
      }}
    >
      {children}
    </RouteRecordingContext.Provider>
  );
};

export const useRouteRecording = () => {
  const context = useContext(RouteRecordingContext);
  if (context === undefined) {
    throw new Error(
      "useRouteRecording must be used within a RouteRecordingProvider"
    );
  }
  return context;
};
