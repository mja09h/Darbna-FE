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
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't override Content-Type for FormData
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
}, async (error) => {
    return Promise.reject(error);
});

export default api;
