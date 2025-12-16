import api from ".";
import { BASE_URL } from ".";
import { getToken } from "./storage";
import { IPinnedPlace, CreatePinData } from "../types/map";
import { Platform } from "react-native";

// Get all pins (public and private)
const getAllPins = async (): Promise<IPinnedPlace[]> => {
    try {
        const response = await api.get<IPinnedPlace[]>("/pins");
        return response.data || [];
    } catch (error) {
        console.error("Error fetching all pins:", error);
        throw error;
    }
};

// Get pins by user ID
const getPinsByUserId = async (userId: string): Promise<IPinnedPlace[]> => {
    try {
        const response = await api.get<IPinnedPlace[]>(`/pins/user/${userId}`);
        return response.data || [];
    } catch (error: any) {
        // If endpoint doesn't exist (404), return empty array instead of throwing
        if (error.response?.status === 404) {
            console.warn(`⚠️ User pins endpoint not found (404) for user ${userId}. Returning empty array.`);
            return [];
        }
        console.error("Error fetching user pins:", error);
        throw error;
    }
};

// Get pin by ID
const getPinById = async (pinId: string): Promise<IPinnedPlace> => {
    try {
        const response = await api.get<IPinnedPlace>(`/pins/${pinId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching pin by ID:", error);
        throw error;
    }
};

// Get pins by category
const getPinsByCategory = async (category: string): Promise<IPinnedPlace[]> => {
    try {
        const response = await api.get<IPinnedPlace[]>(`/pins/category/${category}`);
        return response.data || [];
    } catch (error) {
        console.error("Error fetching pins by category:", error);
        throw error;
    }
};

// Get pin categories
const getPinCategories = async (): Promise<string[]> => {
    try {
        const response = await api.get<{ categories: string[] }>("/pins/categories");
        return response.data.categories || [];
    } catch (error) {
        console.error("Error fetching pin categories:", error);
        throw error;
    }
};

// Create a new pin
const createPin = async (
    pinData: CreatePinData,
    userId: string
): Promise<IPinnedPlace> => {

    if (!userId) {
        throw new Error("User not authenticated. Please log in to create pins.");
    }

    // Create FormData - React Native's FormData implementation
    const formData = new FormData();

    // Verify FormData is created correctly
    if (!(formData instanceof FormData)) {
        throw new Error("Failed to create FormData instance");
    }

    formData.append("title", pinData.title);
    formData.append("category", pinData.category);
    formData.append("isPublic", pinData.isPublic.toString());
    formData.append("userId", userId);


    if (pinData.description) {
        formData.append("description", pinData.description);
    }

    formData.append("latitude", pinData.location.latitude.toString());
    formData.append("longitude", pinData.location.longitude.toString());


    // Handle multiple images (max 4)
    if (pinData.images && pinData.images.length > 0) {
        if (pinData.images.length > 4) {
            throw new Error("Maximum 4 images allowed per pin");
        }

        console.log("📸 Preparing to upload images:", pinData.images.length);

        pinData.images.forEach((image, index) => {
            try {
                const imageUri = image.uri;
                if (!imageUri) {
                    console.warn(`⚠️ Image ${index} has no URI, skipping`);
                    return;
                }

                // Ensure URI is properly formatted
                const uri = imageUri.startsWith('file://') || imageUri.startsWith('content://') || imageUri.startsWith('http://') || imageUri.startsWith('https://')
                    ? imageUri
                    : `file://${imageUri}`;

                const filename =
                    image.fileName || imageUri.split("/").pop() || `image_${index}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : "image/jpeg";

                console.log(`📸 Appending image ${index + 1}:`, { filename, type, uri: uri.substring(0, 50) + "..." });

                // For React Native, append each file with the same field name "images"
                // The backend multer with array('images', 4) will receive them as req.files array
                formData.append("images", {
                    uri: uri,
                    name: filename,
                    type: type,
                } as any);
            } catch (error) {
                console.error(`❌ Error processing image ${index}:`, error);
                throw new Error(`Failed to process image ${index + 1}: ${error}`);
            }
        });
    }

    try {
        console.log("📌 Creating pin with data:", {
            title: pinData.title,
            category: pinData.category,
            isPublic: pinData.isPublic,
            location: pinData.location,
            imageCount: pinData.images?.length || 0,
            userId: userId,
        });

        // Use fetch API directly for FormData - React Native's fetch handles FormData correctly
        // axios uses XMLHttpRequest which doesn't detect FormData properly
        const token = await getToken();
        const url = `${BASE_URL}/pins`;

        const response = await fetch(url, {
            method: "POST",
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

        const data = await response.json();
        console.log("✅ Pin created successfully:", data);
        return data;

    } catch (error: any) {
        console.error("❌ Error creating pin:", error);

        // Handle fetch errors
        if (error.message) {
            throw error;
        } else {
            throw new Error(
                "Network error: Failed to create pin. Please check your connection."
            );
        }
    }
};

// Update a pin
const updatePin = async (
    pinId: string,
    pinData: Partial<CreatePinData>
): Promise<IPinnedPlace> => {
    try {
        const formData = new FormData();

        if (pinData.title) formData.append("title", pinData.title);
        if (pinData.category) formData.append("category", pinData.category);
        if (pinData.description !== undefined)
            formData.append("description", pinData.description || "");
        if (pinData.isPublic !== undefined)
            formData.append("isPublic", pinData.isPublic.toString());
        if (pinData.location) {
            formData.append("latitude", pinData.location.latitude.toString());
            formData.append("longitude", pinData.location.longitude.toString());
        }

        // Handle multiple images (max 4)
        if (pinData.images && pinData.images.length > 0) {
            if (pinData.images.length > 4) {
                throw new Error("Maximum 4 images allowed per pin");
            }

            pinData.images.forEach((image, index) => {
                const imageUri = image.uri;
                // Handle both file:// and content:// URIs
                const uri = imageUri.startsWith('file://') || imageUri.startsWith('content://')
                    ? imageUri
                    : `file://${imageUri}`;

                const filename =
                    image.fileName || imageUri.split("/").pop() || `image_${index}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : "image/jpeg";

                // For React Native, we need to append each file with the same field name
                // The backend multer will receive them as an array
                formData.append("images", {
                    uri: uri,
                    name: filename,
                    type: type,
                } as any);
            });
        }

        // Use fetch API directly for FormData - React Native's fetch handles FormData correctly
        const token = await getToken();
        const url = `${BASE_URL}/pins/${pinId}`;

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

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Error updating pin:", error);
        if (error.message) {
            throw error;
        } else {
            throw new Error("Network error: Failed to update pin. Please check your connection.");
        }
    }
};

// Delete a pin
const deletePin = async (pinId: string): Promise<void> => {
    try {
        await api.delete(`/pins/${pinId}`);
    } catch (error) {
        console.error("Error deleting pin:", error);
        throw error;
    }
};

export {
    getAllPins,
    getPinsByUserId,
    getPinById,
    getPinsByCategory,
    getPinCategories,
    createPin,
    updatePin,
    deletePin,
};

