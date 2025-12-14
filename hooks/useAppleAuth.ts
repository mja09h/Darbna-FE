import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { useEffect, useState } from "react";

interface UseAppleAuthOptions {
    onSuccess: (identityToken: string, user: AppleUser | null) => Promise<void>;
    onError: (error: string) => void;
}

export interface AppleUser {
    email: string | null;
    fullName: {
        givenName: string | null;
        familyName: string | null;
    } | null;
}

export const useAppleAuth = ({ onSuccess, onError }: UseAppleAuthOptions) => {
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        checkAvailability();
    }, []);

    const checkAvailability = async () => {
        if (Platform.OS === "ios") {
            const available = await AppleAuthentication.isAvailableAsync();
            setIsAvailable(available);
        }
    };

    const signInWithApple = async () => {
        if (Platform.OS !== "ios") {
            onError("Apple Sign In is only available on iOS");
            return;
        }

        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const user: AppleUser | null = credential.email
                    ? {
                        email: credential.email,
                        fullName: credential.fullName
                            ? {
                                givenName: credential.fullName.givenName,
                                familyName: credential.fullName.familyName,
                            }
                            : null,
                    }
                    : null;

                await onSuccess(credential.identityToken, user);
            } else {
                onError("No identity token received from Apple");
            }
        } catch (error: any) {
            if (error.code === "ERR_REQUEST_CANCELED") {
                // User cancelled, don't show error
                return;
            }
            onError(error.message || "Apple sign-in failed");
        }
    };

    return {
        signInWithApple,
        isAvailable,
    };
};

