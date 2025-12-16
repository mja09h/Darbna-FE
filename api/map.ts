import api from ".";
import { BASE_URL } from ".";
import { IRoute, IPOI } from "../types/map";

// Map data types
export interface HeatmapPoint {
    location: {
        type: string;
        coordinates: number[];
    };
    intensity: number;
    [key: string]: any;
}

// Fetch all map routes
const getMapRoutes = async (): Promise<IRoute[]> => {
    try {
        const response = await api.get<IRoute[]>("/map/routes");
        return response.data || [];
    } catch (error: any) {
        // If endpoint doesn't exist (404), return empty array instead of throwing
        if (error.response?.status === 404) {
            console.warn("⚠️ Map routes endpoint not found (404). Returning empty array.");
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
        // If endpoint doesn't exist (404), return empty array instead of throwing
        if (error.response?.status === 404) {
            console.warn("⚠️ POIs endpoint not found (404). Returning empty array.");
            return [];
        }
        console.error("Error fetching POIs:", error);
        throw error;
    }
};

// Fetch heatmap data
const getHeatmapData = async (): Promise<HeatmapPoint[]> => {
    try {
        const response = await api.get<HeatmapPoint[]>("/map/heatmap");
        return response.data || [];
    } catch (error: any) {
        // If endpoint doesn't exist (404), return empty array instead of throwing
        if (error.response?.status === 404) {
            console.warn("⚠️ Heatmap endpoint not found (404). Returning empty array.");
            return [];
        }
        console.error("Error fetching heatmap data:", error);
        throw error;
    }
};

// Fetch all map data at once
const getAllMapData = async (): Promise<{
    routes: IRoute[];
    pois: IPOI[];
    heatmapData: HeatmapPoint[];
}> => {
    try {
        // Use Promise.allSettled to handle individual failures gracefully
        const [routesRes, poisRes, heatmapRes] = await Promise.allSettled([
            getMapRoutes(),
            getPOIs(),
            getHeatmapData(),
        ]);

        return {
            routes: routesRes.status === "fulfilled" ? routesRes.value : [],
            pois: poisRes.status === "fulfilled" ? poisRes.value : [],
            heatmapData: heatmapRes.status === "fulfilled" ? heatmapRes.value : [],
        };
    } catch (error) {
        console.error("Error fetching all map data:", error);
        // Return empty data instead of throwing to allow app to continue
        return {
            routes: [],
            pois: [],
            heatmapData: [],
        };
    }
};

export { getMapRoutes, getPOIs, getHeatmapData, getAllMapData };

