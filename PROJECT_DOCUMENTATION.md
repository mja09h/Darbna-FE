# Darbna Frontend - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Configuration Files](#configuration-files)
4. [Source Code](#source-code)
   - [App Routes](#app-routes)
   - [Components](#components)
   - [Contexts](#contexts)
   - [API](#api)
   - [Hooks](#hooks)
   - [Types](#types)
   - [Data](#data)

---

## Project Overview

**Darbna** is a React Native mobile application built with Expo Router for navigation and route recording. The app features:

- User authentication (email/password, Google, Apple)
- Route recording and tracking
- Interactive maps with real-time location
- Multi-language support (English/Arabic)
- Theme support (Light/Dark/System)
- User profiles and settings

**Tech Stack:**

- React Native with Expo
- TypeScript
- Expo Router for file-based routing
- React Context API for state management
- Axios for API calls
- Socket.io for real-time updates

---

## File Structure

```
Darbna-FE/
├── api/                    # API service functions
│   ├── auth.ts            # Authentication endpoints
│   ├── index.ts           # Axios instance configuration
│   ├── storage.ts         # AsyncStorage token management
│   └── user.ts            # User-related API calls
├── app/                   # Expo Router app directory
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Entry point
│   ├── (auth)/            # Authentication routes
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgotPassoword.tsx
│   ├── (onBoarding)/      # Onboarding flow
│   │   ├── _layout.tsx
│   │   └── welcome.tsx
│   └── (protected)/       # Protected routes
│       ├── _layout.tsx
│       └── (tabs)/        # Tab navigation
│           ├── _layout.tsx
│           ├── home/
│           ├── community/
│           ├── saved/
│           └── profile/
│               ├── (account)/
│               └── (settings)/
├── assets/                 # Images and static assets
├── components/            # Reusable UI components
│   ├── AuthButton.tsx
│   ├── AuthInput.tsx
│   ├── CustomAlert.tsx
│   ├── InteractiveMap.tsx
│   ├── RouteRecordingScreen.tsx
│   ├── SocialButton.tsx
│   └── Toast.tsx
├── context/               # React Context providers
│   ├── AuthContext.tsx
│   ├── LanguageContext.tsx
│   ├── MapContext.tsx
│   ├── RouteRecordingContext.tsx
│   ├── SettingsContext.tsx
│   ├── ThemeContext.tsx
│   └── translations/
│       ├── en.ts
│       ├── ar.ts
│       └── index.ts
├── data/                  # Static data
│   └── Countries.ts
├── hooks/                 # Custom React hooks
│   ├── useAppleAuth.ts
│   └── useGoogleAuth.ts
├── types/                 # TypeScript type definitions
│   ├── map.ts
│   ├── route.ts
│   └── User.ts
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md
```

---

## Configuration Files

### package.json

```json
{
  "name": "darbna-fe",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scheme": "darbna",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "axios": "^1.13.2",
    "expo": "~54.0.27",
    "expo-apple-authentication": "~8.0.8",
    "expo-auth-session": "~7.0.10",
    "expo-constants": "~18.0.11",
    "expo-crypto": "~15.0.8",
    "expo-image-picker": "~17.0.10",
    "expo-linking": "~8.0.10",
    "expo-location": "~18.0.7",
    "expo-notifications": "~0.29.9",
    "expo-router": "~6.0.17",
    "expo-status-bar": "~3.0.9",
    "expo-web-browser": "~15.0.10",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-maps": "1.20.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  },
  "private": true
}
```

### app.json

```json
{
  "expo": {
    "name": "Darbna-FE",
    "slug": "Darbna-FE",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/darbna-logo-i.png",
    "scheme": "darbna",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.darbna.app",
      "usesAppleSignIn": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/darbna-logo-i.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.darbna.app"
    },
    "web": {
      "favicon": "./assets/darbna-logo-i.png"
    },
    "plugins": [
      "expo-router",
      "expo-web-browser",
      "expo-apple-authentication",
      "expo-location"
    ]
  },
  "permissions": ["locationAlwaysAndWhenInUsePermission"]
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-native",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true,
    "target": "esnext",
    "lib": ["esnext"],
    "module": "esnext"
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"],
  "extends": "expo/tsconfig.base"
}
```

---

## Source Code

### App Routes

#### app/\_layout.tsx

```tsx
import { Stack } from "expo-router";
import React from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SettingsProvider } from "../context/SettingsContext";
import { MapProvider } from "../context/MapContext";
import { RouteRecordingProvider } from "../context/RouteRecordingContext";
const _layout = () => {
  return (
    <MapProvider>
      <RouteRecordingProvider>
        <LanguageProvider>
          <ThemeProvider>
            <SettingsProvider>
              <AuthProvider>
                <Stack initialRouteName="(onBoarding)">
                  <Stack.Screen
                    name="(onBoarding)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(protected)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                </Stack>
              </AuthProvider>
            </SettingsProvider>
          </ThemeProvider>
        </LanguageProvider>
      </RouteRecordingProvider>
    </MapProvider>
  );
};

export default _layout;
```

#### app/index.tsx

```tsx
import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Redirect } from "expo-router";

const index = () => {
  return Redirect({
    href: "/(protected)/(tabs)/profile/(settings)",
  });
};

export default index;

const styles = StyleSheet.create({});
```

#### app/(auth)/\_layout.tsx

```tsx
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const _layout = () => {
  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#2c120c" },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgotPassoword" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default _layout;
```

#### app/(auth)/login.tsx

[See full file in repository - 443 lines]

- Email/username and password login
- Google and Apple OAuth integration
- Form validation
- Error handling with Toast notifications

#### app/(auth)/register.tsx

[See full file in repository - 791 lines]

- User registration form
- Country selection modal
- Form validation
- Google and Apple OAuth integration

#### app/(auth)/forgotPassoword.tsx

[See full file in repository - 155 lines]

- Password reset form
- Email input
- Back to login navigation

#### app/(onBoarding)/\_layout.tsx

```tsx
import React from "react";
import { Stack } from "expo-router";

const _layout = () => {
  return (
    <Stack initialRouteName="welcome">
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
```

#### app/(onBoarding)/welcome.tsx

[See full file in repository - 151 lines]

- Welcome screen with logo
- Language selection (English/Arabic)
- Get Started button

#### app/(protected)/\_layout.tsx

```tsx
import React from "react";
import { Stack } from "expo-router";

const ProtectedLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};

export default ProtectedLayout;
```

#### app/(protected)/(tabs)/\_layout.tsx

[See full file in repository - 79 lines]

- Tab navigation configuration
- Home, Community, Saved, Profile tabs
- Tab icons and labels

#### app/(protected)/(tabs)/home/index.tsx

[See full file in repository - 531 lines]

- Interactive map display
- Route recording functionality
- Start/Stop/Pause recording
- Save route modal
- Real-time location tracking

#### app/(protected)/(tabs)/profile/index.tsx

[See full file in repository - 381 lines]

- User profile display
- Profile picture and stats
- Bio and contact information
- Navigation to edit profile and settings

#### app/(protected)/(tabs)/profile/edit.tsx

[See full file in repository - 517 lines]

- Edit profile form
- Profile picture upload
- Name, bio, phone, country editing
- Image picker integration

#### app/(protected)/(tabs)/profile/(account)/index.tsx

[See full file in repository - 466 lines]

- Account information screen
- Username, email, phone editing
- Social account connections
- Delete account functionality

#### app/(protected)/(tabs)/profile/(settings)/index.tsx

[See full file in repository - 768 lines]

- Settings screen
- Language selection
- Units selection (km/miles)
- Theme selection (light/dark/system)
- Permissions management
- Legal links (About, Terms, Privacy)

### Components

#### components/AuthButton.tsx

[See full file in repository - 73 lines]

- Reusable button component for authentication
- Loading state support
- Customizable title and loading title

#### components/AuthInput.tsx

[See full file in repository - 102 lines]

- Text input component with error display
- Password visibility toggle
- Loading state support

#### components/CustomAlert.tsx

[See full file in repository - 301 lines]

- Custom alert modal component
- Success, error, warning, info types
- Animated appearance
- Customizable buttons

#### components/InteractiveMap.tsx

[See full file in repository - 245 lines]

- Map component using react-native-maps
- User location display
- Route polylines
- POI markers
- Heatmap layer
- Layer toggle buttons

#### components/Toast.tsx

[See full file in repository - 183 lines]

- Toast notification component
- Slide-in animation
- Multiple types (error, success, warning, info)
- Auto-dismiss functionality

#### components/SocialButton.tsx

[See full file in repository - 64 lines]

- Social login button component
- Icon support
- Loading state

### Contexts

#### context/AuthContext.tsx

[See full file in repository - 232 lines]

- Authentication state management
- Login, register, logout functions
- Google and Apple OAuth
- User state management
- Protected route handling

#### context/LanguageContext.tsx

[See full file in repository - 81 lines]

- Language state (English/Arabic)
- RTL support
- Translation management
- AsyncStorage persistence

#### context/MapContext.tsx

[See full file in repository - 123 lines]

- Map data state (locations, routes, POIs, heatmap)
- Socket.io real-time updates
- API integration for map data

#### context/RouteRecordingContext.tsx

[See full file in repository - 259 lines]

- Route recording state
- GPS point tracking
- Distance and duration calculation
- Save/delete route functionality

#### context/SettingsContext.tsx

[See full file in repository - 65 lines]

- Units preference (km/miles)
- AsyncStorage persistence

#### context/ThemeContext.tsx

[See full file in repository - 123 lines]

- Theme state (light/dark/system)
- Color scheme management
- System theme detection

#### context/translations/en.ts

[See full file in repository - 168 lines]

- English translations for all app strings

#### context/translations/ar.ts

[See full file in repository - 166 lines]

- Arabic translations for all app strings

### API

#### api/index.ts

[See full file in repository - 41 lines]

- Axios instance configuration
- Base URL setup for development
- Token interceptor for authenticated requests

#### api/auth.ts

[See full file in repository - 140 lines]

- Login function
- Register function
- Google OAuth
- Apple OAuth
- Logout function
- Forgot/Reset password functions

#### api/user.ts

[See full file in repository - 168 lines]

- Get current user
- Get user by ID/username
- Update user (with image upload support)
- Delete user
- Follow/unfollow users
- Get followers/following

#### api/storage.ts

[See full file in repository - 20 lines]

- Token storage functions
- AsyncStorage wrapper for token management

### Hooks

#### hooks/useGoogleAuth.ts

[See full file in repository - 66 lines]

- Google OAuth integration
- Expo AuthSession setup
- ID token extraction

#### hooks/useAppleAuth.ts

[See full file in repository - 78 lines]

- Apple Sign In integration
- iOS-only availability check
- Identity token extraction

### Types

#### types/User.ts

[See full file in repository - 35 lines]

- User interface
- AuthResponse interface
- Login/Register credentials interfaces

#### types/map.ts

[See full file in repository - 50 lines]

- Location interface
- Route interface
- POI interface
- Map state and context interfaces

#### types/route.ts

[See full file in repository - 61 lines]

- GPS point interface
- Recorded route interface
- Route recording state interface
- Route recording context interface

### Data

#### data/Countries.ts

[See full file in repository - 161 lines]

- List of countries in English
- List of countries in Arabic
- Helper function to get countries by language

---

## Key Features

### Authentication

- Email/Password login and registration
- Google OAuth integration
- Apple Sign In (iOS only)
- Token-based authentication
- Protected routes

### Route Recording

- Real-time GPS tracking
- Start/Stop/Pause recording
- Distance and duration calculation
- Save routes to backend
- Display routes on map

### Maps

- Interactive map with OpenStreetMap tiles
- Real-time user location
- Route polylines
- Points of Interest markers
- Heatmap layer
- Socket.io real-time location updates

### Internationalization

- English and Arabic support
- RTL layout for Arabic
- Language persistence
- Complete translation coverage

### Theming

- Light and Dark themes
- System theme detection
- Theme persistence
- Consistent color scheme

### User Profile

- Profile picture upload
- Bio and contact information
- Account settings
- Social account connections
- Subscription management

### Settings

- Language selection
- Units preference (km/miles)
- Theme selection
- Permissions management
- Legal information

---

## Development Notes

### Authentication Bypass

The app includes a development flag `BYPASS_AUTH` in `AuthContext.tsx` that can be set to `true` to bypass authentication for testing purposes.

### API Base URL

The API base URL is dynamically configured based on the Expo development environment. It defaults to `http://localhost:8000/api` for local development.

### Dependencies

- React 19.1.0
- React Native 0.81.5
- Expo SDK ~54.0.27
- Expo Router ~6.0.17
- TypeScript 5.9.2

### Known Issues

- React peer dependency conflict (React 19.1.0 vs 19.2.3) - resolved with `--legacy-peer-deps` flag

---

## Getting Started

1. Install dependencies:

```bash
npm install --legacy-peer-deps
```

2. Start the development server:

```bash
npm start
```

3. Run on iOS:

```bash
npm run ios
```

4. Run on Android:

```bash
npm run android
```

---

## Project Status

This is a complete React Native application with:

- ✅ Authentication system
- ✅ Route recording functionality
- ✅ Interactive maps
- ✅ User profiles
- ✅ Settings and preferences
- ✅ Multi-language support
- ✅ Theme support
- ⚠️ Community and Saved tabs are placeholder screens

---

_Last Updated: December 2024_
