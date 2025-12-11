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
        loggingIn: "Logging in...",

        // Register
        register: "Register",
        createAccount: "Create Account",
        joinUsToday: "Join us today",
        name: "Full Name",
        username: "Username",
        email: "Email",
        confirmPassword: "Confirm Password",
        selectCountry: "Select Country",
        searchCountry: "Search country...",
        noCountriesFound: "No countries found",
        haveAccount: "Already have an account?",
        creatingAccount: "Creating account...",

        // Forgot Password
        forgotPasswordTitle: "Forgot Password?",
        forgotPasswordSubtitle: "Enter your email and we'll send you a link to reset your password",
        sendResetLink: "Send Reset Link",
        backToLogin: "Back to Login",

        // Validation errors
        emailRequired: "Email or username is required",
        passwordRequired: "Password is required",
        nameRequired: "Full name is required",
        nameTooShort: "Name must be at least 2 characters",
        nameInvalid: "Name can only contain letters and spaces",
        usernameRequired: "Username is required",
        usernameTooShort: "Username must be at least 3 characters",
        usernameTooLong: "Username must be less than 20 characters",
        usernameInvalid: "Username can only contain letters, numbers, and underscores",
        usernameNoSpaces: "Username cannot contain spaces",
        emailInvalid: "Please enter a valid email address",
        passwordTooShort: "Password must be at least 6 characters",
        passwordWeak: "Password must contain at least one letter and one number",
        passwordsDoNotMatch: "Passwords do not match",
        countryRequired: "Please select a country",
        allFieldsRequired: "All fields are required",

        // Error messages
        invalidCredentials: "Invalid email/username or password",
        userExists: "User with this email or username already exists",
        loginFailed: "Login failed. Please try again.",
        registerFailed: "Registration failed. Please try again.",
        networkError: "Network error. Please check your connection.",
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
        tryAgain: "Try Again",
    },

    // Tabs
    tabs: {
        home: "Home",
        community: "Community",
        saved: "Saved",
        profile: "Profile",
    },
};

export type TranslationKeys = typeof en;
