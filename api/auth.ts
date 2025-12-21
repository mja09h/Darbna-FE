import api from ".";
import { removeToken, setToken } from "./storage";
import { User, AuthResponse } from "../types/User";

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
  phone: string
): Promise<AuthResponse> => {
  try {
    if (!name || !username || !email || !password || !phone) {
      throw new Error("All fields are required");
    }

    // Try to get AuthResponse (with token) from registration endpoint
    // The backend may return a token directly, or just the user
    const registerResponse = await api.post<AuthResponse | User>("/users", {
      name,
      username,
      email,
      password,
      phone,
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
  newPassword: string
): Promise<{ message: string }> => {
  try {
    if (!token || !newPassword) {
      throw new Error("Token and password are required");
    }

    const response = await api.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Code-based password reset
const requestPasswordResetCode = async (
  email: string
): Promise<{ message: string }> => {
  try {
    if (!email) {
      throw new Error("Email is required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const response = await api.post("/auth/forgot-password", {
      email: normalizedEmail,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const resetPasswordWithCode = async (
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> => {
  try {
    if (!email || !code || !newPassword) {
      throw new Error("Email, code, and password are required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    const response = await api.post("/auth/reset-password", {
      email: normalizedEmail,
      code: normalizedCode,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const requestVerificationCode = async (
  email: string
): Promise<{ message: string }> => {
  try {
    if (!email) {
      throw new Error("Email is required");
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const response = await api.post("/users/request-verification", {
        email: normalizedEmail,
      });
      return response.data;
    } catch (error: any) {
      // Optional fallback if backend uses a slightly different route name
      if (error?.response?.status === 404) {
        const fallbackResponse = await api.post(
          "/users/request-verification-code",
          { email: normalizedEmail }
        );
        return fallbackResponse.data;
      }
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

const verifyEmailCode = async (
  email: string,
  code: string
): Promise<{ message: string }> => {
  try {
    if (!email || !code) {
      throw new Error("Email and code are required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    const response = await api.post("/users/verify-email", {
      email: normalizedEmail,
      code: normalizedCode,
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
  requestPasswordResetCode,
  resetPasswordWithCode,
  appleAuth,
  requestVerificationCode,
  verifyEmailCode,
};

export type { AppleAuthData };
