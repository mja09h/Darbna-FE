import api from ".";
import { BASE_URL } from ".";
import { IRoute, IPOI } from "../types/map";

// Fetch all map routes
const getMapRoutes = async (): Promise<IRoute[]> => {
  try {
    const response = await api.get<IRoute[]>("/map/routes");
    return response.data || [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(
        "⚠️ Map routes endpoint not found (404). Returning empty array."
      );
      return [];
    }
    console.error("Error fetching map routes:", error);
    throw error;
  }
};

// Fetch all POIs
const getPOIs = async (): Promise<IPOI[]> => {
  try {
    const response = await api.get<IPOI[]>("/map/pois");
    return response.data || [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn("⚠️ POIs endpoint not found (404). Returning empty array.");
      return [];
    }
    console.error("Error fetching POIs:", error);
    throw error;
  }
};

// Fetch all map data at once (heatmap removed)
const getAllMapData = async (): Promise<{
  routes: IRoute[];
  pois: IPOI[];
}> => {
  try {
    const [routesRes, poisRes] = await Promise.allSettled([
      getMapRoutes(),
      getPOIs(),
    ]);

    return {
      routes: routesRes.status === "fulfilled" ? routesRes.value : [],
      pois: poisRes.status === "fulfilled" ? poisRes.value : [],
    };
  } catch (error) {
    console.error("Error fetching all map data:", error);
    return {
      routes: [],
      pois: [],
    };
  }
};

export { getMapRoutes, getPOIs, getAllMapData };
