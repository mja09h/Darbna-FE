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
      description?: string
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
        description: description || state.currentRoute.description,
        path: {
          type: "LineString",
          coordinates,
        },
        startTime: state.currentRoute.startTime,
        endTime: new Date(),
        distance: state.currentRoute.distance,
        duration: state.currentRoute.duration,
        points: state.currentRoute.points,
      };

      try {
        const savedRoute = await createRoute(routeData);

        setState((prevState) => ({
          ...prevState,
          recordedRoutes: [...prevState.recordedRoutes, savedRoute],
          currentRoute: null,
          isRecording: false,
        }));

        return savedRoute;
      } catch (error) {
        console.error("Error saving route:", error);
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
    } catch (error) {
      console.error("Error deleting route:", error);
      throw error;
    }
  }, []);

  // Fetch all routes for the current user
  const fetchUserRoutes = useCallback(async () => {
    try {
      const routes = await getUserRoutes();
      setState((prevState) => ({
        ...prevState,
        recordedRoutes: routes,
      }));
    } catch (error) {
      console.error("Error fetching routes:", error);
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
