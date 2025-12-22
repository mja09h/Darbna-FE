export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus = "active" | "cancelled";

export interface BillingAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface CardInfo {
    cardNumber: string; // Last 4 digits visible, full number encrypted on backend
    cardHolderName: string;
    expiryMonth: number; // 1-12
    expiryYear: number; // YYYY
    cvv?: string; // Encrypted on backend
    billingAddress: BillingAddress;
    cardType: string; // Visa, Mastercard, Amex, Discover, etc.
}

export interface SubscriptionData {
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    cardInfo?: CardInfo;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
}

export interface UpgradeRequest {
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    billingAddress: BillingAddress;
}

export interface UpdateCardRequest {
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    billingAddress: BillingAddress;
}

export interface SubscriptionStatusResponse {
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    cardInfo?: CardInfo;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
}

