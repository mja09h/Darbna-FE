import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import api from "../api/index";
import {
  IRouteRecordingState,
  IRouteRecordingContext,
  IGPSPoint,
  IRecordedRoute,
} from "../types/route";

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

  // Calculate distance between two GPS points using Haversine formula
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

  // Calculate duration between two timestamps in seconds
  const calculateDuration = useCallback((startTime: Date, endTime: Date) => {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }, []);

  // Start recording a new route
  const startRecording = useCallback(
    (routeName: string, description?: string) => {
      const now = new Date();
      setState((prevState) => ({
        ...prevState,
        isRecording: true,
        currentRoute: {
          name: routeName,
          description: description || "",
          points: [],
          startTime: now,
          distance: 0,
          duration: 0,
        },
      }));
    },
    []
  );

  // Add a GPS point to the current route
  const addPoint = useCallback(
    (point: IGPSPoint) => {
      setState((prevState) => {
        if (!prevState.currentRoute) return prevState;

        const updatedPoints = [...prevState.currentRoute.points, point];
        let totalDistance = prevState.currentRoute.distance;
        let duration = 0;

        // Calculate additional distance if there's a previous point
        if (updatedPoints.length > 1) {
          const previousPoint = updatedPoints[updatedPoints.length - 2];
          totalDistance += calculateDistance(previousPoint, point);
        }

        // Calculate duration
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
          },
        };
      });
    },
    [calculateDistance, calculateDuration]
  );

  // Pause recording (not fully stopping)
  const pauseRecording = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRecording: false,
    }));
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRecording: true,
    }));
  }, []);

  // Save the current route to the backend
  const saveRoute = useCallback(
    async (
      routeName: string,
      description: string,
      isPublic: boolean,
      routeType: string,
      screenshotUri?: string
    ): Promise<IRecordedRoute> => {
      if (!state.currentRoute || state.currentRoute.points.length === 0) {
        throw new Error("No route data to save");
      }

      const coordinates = state.currentRoute.points.map((point) => [
        point.longitude,
        point.latitude,
      ]);

      const routeData = {
        name: routeName,
        description: description,
        path: {
          type: "LineString",
          coordinates,
        },
        startTime: state.currentRoute.startTime,
        endTime: new Date(),
        distance: state.currentRoute.distance,
        duration: state.currentRoute.duration,
        points: state.currentRoute.points,
        isPublic: isPublic,
        routeType: routeType,
      };

      try {
        // Create the route first
        const response = await api.post("/routes", routeData);
        const savedRoute = response.data;

        // Upload screenshot if provided
        if (screenshotUri) {
          try {
            const formData = new FormData();

            // Convert URI to blob/file
            const filename =
              screenshotUri.split("/").pop() || "route-screenshot.png";
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/png`;

            formData.append("screenshot", {
              uri: screenshotUri,
              type: type,
              name: filename,
            } as any);

            await api.post(`/routes/${savedRoute._id}/screenshot`, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
          } catch (error) {
            // Continue even if screenshot upload fails
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
        // Only log non-network errors to avoid console spam when backend is offline
        if (__DEV__) {
          if (
            error?.code === "ERR_NETWORK" ||
            error?.message?.includes("Network Error")
          ) {
            // Network error - backend not available, silently fail
          } else {
            // Other errors should be logged
            console.warn("Error saving route:", error?.message || error);
          }
        }
        throw error;
      }
    },
    [state.currentRoute]
  );

  // Stop recording without saving
  const stopRecording = useCallback(async () => {
    setState((prevState) => ({
      ...prevState,
      isRecording: false,
      currentRoute: null,
    }));
  }, []);

  // Delete a route from the backend
  const deleteRoute = useCallback(async (routeId: string) => {
    try {
      await api.delete(`/routes/${routeId}`);
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
    } catch (error: any) {
      // Only log non-network errors to avoid console spam when backend is offline
      if (__DEV__) {
        if (
          error?.code === "ERR_NETWORK" ||
          error?.message?.includes("Network Error")
        ) {
          // Network error - backend not available, silently fail
        } else {
          // Other errors should be logged
          console.warn("Error deleting route:", error?.message || error);
        }
      }
      throw error;
    }
  }, []);

  // Fetch all routes for the current user
  const fetchUserRoutes = useCallback(async () => {
    try {
      const response = await api.get("/routes");
      setState((prevState) => ({
        ...prevState,
        recordedRoutes: response.data,
      }));
    } catch (error: any) {
      // Only log non-network errors to avoid console spam when backend is offline
      if (__DEV__) {
        if (
          error?.code === "ERR_NETWORK" ||
          error?.message?.includes("Network Error")
        ) {
          // Network error - backend not available, silently fail
        } else {
          // Other errors should be logged
          console.warn("Error fetching routes:", error?.message || error);
        }
      }
      throw error;
    }
  }, []);

  // Select a route to display
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
        deleteRoute,
        fetchUserRoutes,
        selectRoute,
        calculateDistance,
        calculateDuration,
      }}
    >
      {children}
    </RouteRecordingContext.Provider>
  );
};

// Custom hook to use the RouteRecordingContext
export const useRouteRecording = () => {
  const context = useContext(RouteRecordingContext);
  if (context === undefined) {
    throw new Error(
      "useRouteRecording must be used within a RouteRecordingProvider"
    );
  }
  return context;
};
