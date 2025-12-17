import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";


WebBrowser.maybeCompleteAuthSession();

// Get Google OAuth Client IDs from environment variables
// These are loaded from .env file via app.config.js and exposed through Constants.expoConfig.extra
const getGoogleConfig = () => {
    const extra = Constants.expoConfig?.extra || {};

    const webClientId = extra.webClientId || "";
    const iosClientId = extra.iosClientId || "";
    const androidClientId = extra.androidClientId || "";

    // Validate that all required client IDs are present
    if (!webClientId) {
        console.error("❌ GOOGLE_OAUTH_ERROR: WebClientID is missing from environment variables");
    }
    if (!iosClientId) {
        console.warn("⚠️ GOOGLE_OAUTH_WARNING: IosClientID is missing from environment variables");
    }
    if (!androidClientId) {
        console.warn("⚠️ GOOGLE_OAUTH_WARNING: AndroidClientID is missing from environment variables");
    }

    return {
        webClientId,
        iosClientId,
        androidClientId,
    };
};

const GOOGLE_CONFIG = getGoogleConfig();

interface UseGoogleAuthOptions {
    onSuccess: (idToken: string, accessToken: string | null) => Promise<void>;
    onError: (error: string) => void;
}

export const useGoogleAuth = ({ onSuccess, onError }: UseGoogleAuthOptions) => {
    // Validate configuration before creating auth request
    if (!GOOGLE_CONFIG.webClientId) {
        console.error("❌ Google OAuth: WebClientID is required but not configured");
    }

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_CONFIG.webClientId,
        iosClientId: GOOGLE_CONFIG.iosClientId || undefined,
        androidClientId: GOOGLE_CONFIG.androidClientId || undefined,
    });

    useEffect(() => {
        handleResponse();
    }, [response]);

    const handleResponse = async () => {
        if (response?.type === "success") {
            const { authentication } = response;
            if (authentication?.idToken) {
                try {
                    await onSuccess(authentication.idToken, authentication.accessToken);
                } catch (error) {
                    onError("Failed to authenticate with Google");
                }
            } else {
                onError("No ID token received from Google");
            }
        } else if (response?.type === "error") {
            onError(response.error?.message || "Google sign-in failed");
        }
    };

    const signInWithGoogle = async () => {
        try {
            await promptAsync();
        } catch (error) {
            onError("Failed to initiate Google sign-in");
        }
    };

    return {
        signInWithGoogle,
        isReady: !!request,
    };
};

