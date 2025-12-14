import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";


WebBrowser.maybeCompleteAuthSession();


const GOOGLE_CONFIG = {
    // Web Client ID (required for all platforms)
    webClientId: "956480809434-gc2alto3oma2clc1u8svqp0q0ondu3mo.apps.googleusercontent.com",
    // iOS Client ID (required for iOS)
    iosClientId: "956480809434-quih9810ccvcd6lsgb063d66c1hl6isk.apps.googleusercontent.com",
    // Android Client ID (required for Android)
    androidClientId: "956480809434-dju2cvs1u7v329ncbfmb8qo47mr4oqbc.apps.googleusercontent.com",
};

interface UseGoogleAuthOptions {
    onSuccess: (idToken: string, accessToken: string | null) => Promise<void>;
    onError: (error: string) => void;
}

export const useGoogleAuth = ({ onSuccess, onError }: UseGoogleAuthOptions) => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_CONFIG.webClientId,
        iosClientId: GOOGLE_CONFIG.iosClientId,
        androidClientId: GOOGLE_CONFIG.androidClientId,
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

