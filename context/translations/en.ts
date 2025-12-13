export const en = {
  // Welcome Screen
  welcome: {
    title: "Welcome to Darbna",
    subtitle: "Your journey starts here",
    chooseLanguage: "Choose your language",
    english: "English",
    arabic: "العربية",
    getStarted: "Get Started",
  },

  // Auth Screens
  auth: {
    // Login
    login: "Login",
    welcomeBack: "Welcome Back",
    signInToContinue: "Sign in to continue",
    emailOrUsername: "Email or Username",
    password: "Password",
    forgotPassword: "Forgot Password?",
    noAccount: "Don't have an account?",
    signUp: "Sign Up",
    or: "or",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",

    // Register
    register: "Register",
    createAccount: "Create Account",
    joinUsToday: "Join us today",
    name: "Name",
    username: "Username",
    email: "Email",
    confirmPassword: "Confirm Password",
    selectCountry: "Select Country",
    searchCountry: "Search country...",
    noCountriesFound: "No countries found",
    haveAccount: "Already have an account?",

    // Forgot Password
    forgotPasswordTitle: "Forgot Password?",
    forgotPasswordSubtitle:
      "Enter your email and we'll send you a link to reset your password",
    sendResetLink: "Send Reset Link",
    backToLogin: "Back to Login",
  },

  // Common
  common: {
    continue: "Continue",
    back: "Back",
    next: "Next",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    error: "Error",
    success: "Success",
  },

  // Tabs
  tabs: {
    home: "Home",
    community: "Community",
    saved: "Saved",
    profile: "Profile",
  },

  // Settings
  settings: {
    title: "Settings",
    language: "Language",
    units: "Units",
    appearance: "Appearance",
    permissions: "Permissions",
    legal: "Legal",
    kilometers: "Kilometers",
    miles: "Miles",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    systemDefault: "System Default",
    location: "Location",
    notifications: "Notifications",
    permissionGranted: "Granted",
    permissionDenied: "Denied",
    permissionNotDetermined: "Not Determined",
    requestPermission: "Request Permission",
    openSettings: "Open Settings",
    locationDescription: "Allow access to your location to find nearby places",
    notificationDescription:
      "Receive notifications about updates and important information",
    permissionRequired: "Permission is required for this feature",
    openSettingsMessage:
      "Permission was denied. Please enable it in device settings.",
    about: "About",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
  },
};

export type TranslationKeys = typeof en;
