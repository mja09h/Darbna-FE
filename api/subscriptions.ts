import api from ".";
import {
    SubscriptionStatusResponse,
    UpgradeRequest,
    UpdateCardRequest,
} from "../types/subscription";

/**
 * Get current user's subscription status
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatusResponse> => {
    try {
        const response = await api.get("/subscriptions/status");
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Upgrade user to Premium plan
 */
export const upgradeToPremium = async (
    cardData: UpgradeRequest
): Promise<SubscriptionStatusResponse> => {
    try {
        const response = await api.post("/subscriptions/upgrade", cardData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Downgrade user to Free plan
 */
export const downgradeToFree = async (): Promise<SubscriptionStatusResponse> => {
    try {
        const response = await api.post("/subscriptions/downgrade");
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Update card information for Premium users
 */
export const updateCardInfo = async (
    cardData: UpdateCardRequest
): Promise<SubscriptionStatusResponse> => {
    try {
        const response = await api.put("/subscriptions/card", cardData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete card information
 */
export const deleteCardInfo = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.delete("/subscriptions/card");
        return response.data;
    } catch (error) {
        throw error;
    }
};

