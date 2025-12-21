import api from ".";
import { User } from "../types/User";
import { getToken } from "./storage";
import { BASE_URL } from "./index";

// Get current authenticated user
const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all users
const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get("/users");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user by username
const getUserByUsername = async (username: string): Promise<User> => {
  try {
    const response = await api.get(`/users/username/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user profile
const getUserProfile = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}/profile`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user profile (name, bio, country, profilePicture)
interface UpdateProfileData {
  name?: string;
  country?: string;
  bio?: string;
  profilePicture?: string | any;
}

const updateUser = async (id: string, data: UpdateProfileData) => {
  try {
    const formData = new FormData();

    if (data.name) formData.append("name", data.name);
    if (data.country) formData.append("country", data.country);
    if (data.bio) formData.append("bio", data.bio);

    // Handle profile picture
    if (data.profilePicture && typeof data.profilePicture === "object") {
      formData.append("profilePicture", {
        uri: data.profilePicture.uri,
        name: data.profilePicture.fileName || "profile.jpg",
        type: "image/jpeg",
      } as any);
    } else if (typeof data.profilePicture === "string") {
      // If it's a string (base64 or url), maybe backend expects it differently?
      // Based on backend code: user.profilePicture = `/uploads/${req.file.filename}`;
      // So it expects a file upload via multer.
      // The generic string handling might be legacy or for base64 if supported.
      // For now, let's keep it if it was working or assume object for new uploads.
    }

    // Use fetch API directly for FormData - React Native's fetch handles FormData correctly
    const token = await getToken();
    const url = `${BASE_URL}/users/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // Don't set Content-Type - fetch will set multipart/form-data with boundary automatically
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error: any) {
    console.error("Error updating profile:", error);
    if (error.message) {
      throw error;
    } else {
      throw new Error("Network error: Failed to update profile. Please check your connection.");
    }
  }
};

const updateEmail = async (id: string, email: string, password?: string) => {
  try {
    const response = await api.put(`/users/${id}/email`, { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updatePhone = async (id: string, phone: string, password?: string) => {
  try {
    const response = await api.put(`/users/${id}/phone`, { phone, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateUsername = async (id: string, username: string, password?: string) => {
  try {
    const response = await api.put(`/users/${id}/username`, { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete user
const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    throw error;
  }
};

interface UpdatePasswordData {
  oldPassword?: string;
  newPassword?: string;
  password?: string; // Legacy support or direct password
}

// Update password
const updatePassword = async (id: string, data: string | UpdatePasswordData): Promise<void> => {
  try {
    const payload = typeof data === 'string' ? { password: data } : data;
    await api.put(`/users/${id}/password`, payload);
  } catch (error) {
    throw error;
  }
};

// Follow user
const followUser = async (
  targetUserId: string,
  currentUserId: string
): Promise<User> => {
  try {
    const response = await api.post(`/users/${targetUserId}/follow`, {
      userId: currentUserId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Unfollow user
const unfollowUser = async (
  targetUserId: string,
  currentUserId: string
): Promise<User> => {
  try {
    const response = await api.post(`/users/${targetUserId}/unfollow`, {
      userId: currentUserId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get followers
const getFollowers = async (id: string): Promise<string[]> => {
  try {
    const response = await api.get(`/users/${id}/followers`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get following
const getFollowing = async (id: string): Promise<string[]> => {
  try {
    const response = await api.get(`/users/${id}/following`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getCurrentUser,
  getUsers,
  getUserById,
  getUserByUsername,
  getUserProfile,
  updateUser,
  updateEmail,
  updatePhone,
  updateUsername,
  updatePassword,
  deleteUser,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
