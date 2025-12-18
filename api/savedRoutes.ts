import api from "./index";
import { ISavedRoute } from "../context/SavedRoutesContext";

export const getSavedRoutes = async (
  folderId?: string
): Promise<ISavedRoute[]> => {
  try {
    const params = folderId ? { folderId } : {};
    const response = await api.get("/saved-routes", { params });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching saved routes:", error);
    throw error;
  }
};

export const saveRoute = async (
  routeId: string,
  folderId: string
): Promise<ISavedRoute> => {
  try {
    const response = await api.post("/saved-routes", { routeId, folderId });
    return response.data.data;
  } catch (error) {
    console.error("Error saving route:", error);
    throw error;
  }
};

export const deleteSavedRoute = async (savedRouteId: string): Promise<void> => {
  try {
    await api.delete(`/saved-routes/${savedRouteId}`);
  } catch (error) {
    console.error("Error deleting saved route:", error);
    throw error;
  }
};

export const toggleFavorite = async (
  savedRouteId: string
): Promise<ISavedRoute> => {
  try {
    const response = await api.post(`/saved-routes/${savedRouteId}/favorite`);
    return response.data.data;
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};
