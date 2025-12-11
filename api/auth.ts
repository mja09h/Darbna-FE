import api from ".";
import { removeToken, setToken } from "./storage";
import { AuthResponse } from "../types/User";

const login = async (identifier: string, password: string): Promise<AuthResponse> => {
    try {
        if (!identifier || !password) {
            throw new Error("Identifier and password are required");
        }

        const response = await api.post<AuthResponse>("/auth/login", { identifier, password });
        await setToken(response.data.token);
        return response.data;

    } catch (error) {
        throw error;
    }
};

const register = async (
    name: string,
    username: string,
    email: string,
    password: string,
    country: string): Promise<AuthResponse> => {
    try {
        if (!name || !username || !email || !password || !country) {
            throw new Error("All fields are required");
        }

        const response = await api.post<AuthResponse>("/auth/register", {
            name,
            username,
            email,
            password,
            country
        });
        await setToken(response.data.token);
        return response.data;

    } catch (error) {
        throw error;
    }
};

const logout = async (): Promise<boolean> => {
    try {
        await removeToken();
        return true;
    } catch (error) {
        throw error;
    }
};

const forgotPassword = async (email: string): Promise<{ message: string }> => {
    try {
        if (!email) {
            throw new Error("Email is required");
        }

        const response = await api.post("/auth/forgot-password", { email });
        return response.data;

    } catch (error) {
        throw error;
    }
};

const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    try {
        if (!token || !password) {
            throw new Error("Token and password are required");
        }

        const response = await api.post("/auth/reset-password", { token, password });
        return response.data;

    } catch (error) {
        throw error;
    }
};

export {
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
};
