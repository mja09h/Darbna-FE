const { config } = require("dotenv");

// Load environment variables from .env file
config();

module.exports = {
  expo: {
    name: "Darbna-FE",
    slug: "Darbna-FE",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/darbna-logo-i.png",
    scheme: "darbna",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.darbna.app.v2",
      usesAppleSignIn: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/darbna-logo-i.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.darbna.app.v2",
    },
    web: {
      favicon: "./assets/darbna-logo-i.png",
    },
    plugins: [
      "expo-router",
      "expo-web-browser",
      "expo-apple-authentication",
      "expo-location",
    ],
    extra: {
      // Google OAuth Client IDs from environment variables
      webClientId: process.env.WebClientID || "",
      iosClientId: process.env.IosClientID || "",
      androidClientId: process.env.AndroidClientID || "",
    },
  },
  permissions: ["locationAlwaysAndWhenInUsePermission"],
};
