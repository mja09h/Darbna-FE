import api from ".";
import { IRecordedRoute } from "../types/route";

// Create a new route
const createRoute = async (routeData: {
  name: string;
  description?: string;
  path: {
    type: string;
    coordinates: number[][];
  };
  startTime: Date;
  endTime: Date;
  distance: number;
  duration: number;
  points: any[];
}): Promise<IRecordedRoute> => {
  try {
    const response = await api.post<IRecordedRoute>("/routes", routeData);
    return response.data;
  } catch (error) {
    console.error("Error creating route:", error);
    throw error;
  }
};

// Get all routes for the current user
const getUserRoutes = async (): Promise<IRecordedRoute[]> => {
  try {
    const response = await api.get<IRecordedRoute[]>("/routes");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching user routes:", error);
    throw error;
  }
};

// Get route by ID
const getRouteById = async (routeId: string): Promise<IRecordedRoute> => {
  try {
    const response = await api.get<IRecordedRoute>(`/routes/${routeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching route by ID:", error);
    throw error;
  }
};

// Update a route
const updateRoute = async (
  routeId: string,
  routeData: Partial<IRecordedRoute>
): Promise<IRecordedRoute> => {
  try {
    const response = await api.put<IRecordedRoute>(
      `/routes/${routeId}`,
      routeData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating route:", error);
    throw error;
  }
};

// Delete a route
const deleteRoute = async (routeId: string): Promise<void> => {
  try {
    await api.delete(`/routes/${routeId}`);
  } catch (error) {
    console.error("Error deleting route:", error);
    throw error;
  }
};

// Get directions to a route
const getRouteDirections = async (
  routeId: string,
  userLat: number,
  userLng: number
): Promise<any> => {
  try {
    const response = await api.get(`/routes/${routeId}/directions`, {
      params: { userLat, userLng },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting directions:", error);
    throw error;
  }
};

export {
  createRoute,
  getUserRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getRouteDirections,
};
