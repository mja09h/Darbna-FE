import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, useSegments } from "expo-router";
import { User, AuthResponse } from "../types/User";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  googleAuth as apiGoogleAuth,
  appleAuth as apiAppleAuth,
  AppleAuthData,
} from "../api/auth";
import { getToken, removeToken } from "../api/storage";
import { getCurrentUser } from "../api/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    name: string,
    username: string,
    email: string,
    password: string,
    country: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserState: (user: User) => void;
  googleLogin: (idToken: string) => Promise<void>;
  appleLogin: (data: AppleAuthData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = !!user;

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle routing based on auth status
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProtectedGroup = segments[0] === "(protected)";
    const inOnboardingGroup = segments[0] === "(onBoarding)";

    if (isAuthenticated && inAuthGroup) {
      // User is logged in but on auth screen, redirect to protected
      router.replace("/(protected)/(tabs)/home");
    } else if (!isAuthenticated && inProtectedGroup) {
      // User is not logged in but on protected screen, redirect to auth
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, segments, isLoading]);

  const checkAuthStatus = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userData = await getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      // Token is invalid or expired, clear it
      await removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await apiLogin(identifier, password);
      setUser(response.user);
      router.replace("/(protected)/(tabs)/home");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    username: string,
    email: string,
    password: string,
    country: string
  ) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await apiRegister(
        name,
        username,
        email,
        password,
        country
      );
      setUser(response.user);
      router.replace("/(protected)/(tabs)/home");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
      router.replace("/(auth)/login");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await apiGoogleAuth(idToken);
      setUser(response.user);
      router.replace("/(protected)/(tabs)/home");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const appleLogin = async (data: AppleAuthData) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await apiAppleAuth(data);
      setUser(response.user);
      router.replace("/(protected)/(tabs)/home");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUserState,
        googleLogin,
        appleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
