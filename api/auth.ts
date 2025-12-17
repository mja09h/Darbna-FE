import api from ".";
import { removeToken, setToken } from "./storage";
import { User, AuthResponse } from "../types/User";

// Google OAuth
const googleAuth = async (idToken: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/auth/google", { idToken });
    await setToken(response.data.token);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Apple OAuth
interface AppleAuthData {
  identityToken: string;
  email?: string | null;
  fullName?: {
    givenName: string | null;
    familyName: string | null;
  } | null;
}

const appleAuth = async (data: AppleAuthData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/auth/apple", data);
    await setToken(response.data.token);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Login
const login = async (
  identifier: string,
  password: string
): Promise<AuthResponse> => {
  try {
    if (!identifier || !password) {
      throw new Error("Identifier and password are required");
    }

    // Log the request for debugging (without password)
    if (__DEV__) {
      console.log("🔐 Login attempt:", {
        identifier: identifier,
        identifierLength: identifier.length,
        passwordLength: password.length,
        hasWhitespace: {
          identifier: identifier !== identifier.trim(),
          password: password !== password.trim(),
        },
      });
    }

    const response = await api.post<AuthResponse>("/users/login", {
      identifier: identifier.trim(),
      password: password,
    });

    if (response.data.success === false) {
      throw new Error("Login failed");
    }

    await setToken(response.data.token);
    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    if (__DEV__) {
      console.error("❌ Login error:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
    }
    throw error;
  }
};

// Register a new user
const register = async (
  name: string,
  username: string,
  email: string,
  password: string,
  country: string
): Promise<AuthResponse> => {
  try {
    if (!name || !username || !email || !password || !country) {
      throw new Error("All fields are required");
    }

    // Try to get AuthResponse (with token) from registration endpoint
    // The backend may return a token directly, or just the user
    const registerResponse = await api.post<AuthResponse | User>("/users", {
      name,
      username,
      email,
      password,
      country,
    });

    // Check if the response includes a token (AuthResponse)
    if ("token" in registerResponse.data && registerResponse.data.token) {
      // Backend returned token directly, use it
      const authResponse = registerResponse.data as AuthResponse;
      await setToken(authResponse.token);
      return authResponse;
    } else {
      // Backend only returned user, need to login to get token
      const loginResponse = await api.post<AuthResponse>("/users/login", {
        identifier: email,
        password,
      });
      await setToken(loginResponse.data.token);
      return loginResponse.data;
    }
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

const resetPassword = async (
  token: string,
  password: string
): Promise<{ message: string }> => {
  try {
    if (!token || !password) {
      throw new Error("Token and password are required");
    }

    const response = await api.post("/auth/reset-password", {
      token,
      password,
    });
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
  googleAuth,
  appleAuth,
};

export type { AppleAuthData };
