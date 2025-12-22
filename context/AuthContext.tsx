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
} from "../api/auth";
import { getToken, removeToken } from "../api/storage";
import { getCurrentUser } from "../api/user";
import socket from "../api/socket";
import {
  registerForPushNotificationsAsync,
  savePushToken,
} from "../api/notification";

// Development flag to bypass authentication for testing
// Set to false to re-enable authentication
const BYPASS_AUTH = false;

// Mock user for testing when authentication is bypassed
const MOCK_USER: User = {
  _id: "test-user-id",
  name: "Test User",
  username: "testuser",
  email: "test@example.com",
  country: "Saudi Arabia",
  bio: "Testing the app without authentication",
  profilePicture: undefined,
  coverPicture: undefined,
  phone: undefined,
  followers: [],
  following: [],
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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
    phone: string
  ) => Promise<User>;
  logout: () => Promise<void>;
  updateUserState: (user: User) => void;
  refreshSubscriptionStatus: () => Promise<void>;
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

    // Skip redirects when authentication is bypassed
    if (BYPASS_AUTH) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "(auth)";
    const inProtectedGroup = firstSegment === "(protected)";
    const inOnboardingGroup = firstSegment === "(onBoarding)";
    const isIndex = !firstSegment || firstSegment === "index";

    if (isAuthenticated) {
      // User is authenticated - redirect away from auth/onboarding/index screens
      if (inAuthGroup || inOnboardingGroup || isIndex) {
        router.replace("/(protected)/(tabs)/home");
      }
    } else {
      // User is not authenticated - redirect away from protected screens
      if (inProtectedGroup) {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, segments, isLoading, router]);

  // Manage socket connection based on authentication status
  useEffect(() => {
    const manageSocketConnection = async () => {
      // Skip socket authentication when BYPASS_AUTH is enabled
      if (BYPASS_AUTH) {
        if (!socket.connected) {
          // TEMPORARY FIX: Provide dummy token to satisfy backend auth requirement
          // TODO: Remove this when re-enabling authentication
          socket.auth = { token: "bypass-auth-token" };
          socket.connect();
        }
        return;
      }

      // ORIGINAL CODE - Commented out for temporary auth bypass
      // Uncomment this when re-enabling authentication:
      /*
      if (BYPASS_AUTH) {
        if (!socket.connected) {
          socket.connect();
        }
        return;
      }
      */

      if (isAuthenticated && !socket.connected) {
        const token = await getToken();
        socket.auth = { token };
        socket.connect();
      } else if (!isAuthenticated && socket.connected) {
        socket.disconnect();
      }
    };
    manageSocketConnection();
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    // Bypass authentication for testing
    if (BYPASS_AUTH) {
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }

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

      // Register and save push notification token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await savePushToken(token);
      }

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
    phone: string
  ) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await apiRegister(
        name,
        username,
        email,
        password,
        phone
      );
      // We don't set user here to allow the register component to show the verification modal
      // setUser(response.user);

      // Register and save push notification token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await savePushToken(token);
      }

      // router.replace("/(protected)/(tabs)/home");
      return response.user;
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
      socket.disconnect();
      router.replace("/(auth)/login");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const refreshSubscriptionStatus = async () => {
    if (!user?._id) return;

    try {
      const subscriptionData = await getSubscriptionStatus();
      if (user) {
        updateUserState({
          ...user,
          subscriptionPlan: subscriptionData.subscriptionPlan,
          subscriptionStatus: subscriptionData.subscriptionStatus,
          cardInfo: subscriptionData.cardInfo,
          subscriptionStartDate: subscriptionData.subscriptionStartDate,
          subscriptionEndDate: subscriptionData.subscriptionEndDate,
        });
      }
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
    }
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
        refreshSubscriptionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
