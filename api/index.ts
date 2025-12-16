import { getToken } from "./storage";
import axios from "axios";
import Constants from "expo-constants";

// Helper to get the correct base URL for development
const getBaseUrl = () => {
    // For local development
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];

    if (localhost) {
        // Running on physical device or emulator via Expo Go
        return `http://${localhost}:8000/api`;
    }

    // Fallback for iOS Simulator or other cases
    return "http://localhost:8000/api";
};

export const BASE_URL = getBaseUrl();
console.log("🔌 API Base URL configured to:", BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    // Don't set default Content-Type - set it per request type
    // This prevents interference with FormData detection
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Set Content-Type based on data type
    if (config.data instanceof FormData) {
        // For FormData, don't set Content-Type - React Native will detect FormData
        // and automatically set multipart/form-data with boundary
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
    } else if (!config.headers["Content-Type"] && !config.headers["content-type"]) {
        // For non-FormData requests, set JSON Content-Type if not already set
        config.headers["Content-Type"] = "application/json";
    }

    return config;
}, async (error) => {
    return Promise.reject(error);
});

export default api;
