import api from ".";
import { User } from "../types/User";

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

// Update user
interface UpdateUserData {
    name?: string;
    country?: string;
    username?: string;
    email?: string;
    password?: string;
    bio?: string;
    profilePicture?: string;
    coverPicture?: string;
    phone?: string;
}

const updateUser = async (id: string, data: UpdateUserData): Promise<User> => {
    try {
        const response = await api.put(`/users/${id}`, data);
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

// Update password
const updatePassword = async (id: string, password: string): Promise<void> => {
    try {
        await api.put(`/users/${id}/password`, { password });
    } catch (error) {
        throw error;
    }
};

// Follow user
const followUser = async (targetUserId: string, currentUserId: string): Promise<User> => {
    try {
        const response = await api.post(`/users/${targetUserId}/follow`, { userId: currentUserId });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Unfollow user
const unfollowUser = async (targetUserId: string, currentUserId: string): Promise<User> => {
    try {
        const response = await api.post(`/users/${targetUserId}/unfollow`, { userId: currentUserId });
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
    updatePassword,
    deleteUser,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
};

