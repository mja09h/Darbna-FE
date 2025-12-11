import { TranslationKeys } from "./en";

export const ar: TranslationKeys = {
  // Welcome Screen
  welcome: {
    title: "أهلاً بك في دربنا",
    subtitle: "رحلتك تبدأ هنا",
    chooseLanguage: "اختر لغتك",
    english: "English",
    arabic: "العربية",
    getStarted: "ابدأ الآن",
  },


    // Auth Screens
    auth: {
        // Login
        login: "تسجيل الدخول",
        welcomeBack: "مرحباً بعودتك",
        signInToContinue: "سجّل دخولك للمتابعة",
        emailOrUsername: "البريد الإلكتروني أو اسم المستخدم",
        password: "كلمة المرور",
        forgotPassword: "نسيت كلمة المرور؟",
        noAccount: "ليس لديك حساب؟",
        signUp: "إنشاء حساب",
        or: "أو",
        continueWithGoogle: "المتابعة مع جوجل",
        continueWithApple: "المتابعة مع أبل",
        loggingIn: "جاري تسجيل الدخول...",

        // Register
        register: "إنشاء حساب",
        createAccount: "إنشاء حساب",
        joinUsToday: "انضم إلينا اليوم",
        name: "الاسم الكامل",
        username: "اسم المستخدم",
        email: "البريد الإلكتروني",
        confirmPassword: "تأكيد كلمة المرور",
        selectCountry: "اختر الدولة",
        searchCountry: "ابحث عن دولة...",
        noCountriesFound: "لم يتم العثور على دول",
        haveAccount: "لديك حساب بالفعل؟",
        creatingAccount: "جاري إنشاء الحساب...",

        // Forgot Password
        forgotPasswordTitle: "نسيت كلمة المرور؟",
        forgotPasswordSubtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور",
        sendResetLink: "إرسال رابط إعادة التعيين",
        backToLogin: "العودة لتسجيل الدخول",

        // Validation errors
        emailRequired: "البريد الإلكتروني أو اسم المستخدم مطلوب",
        passwordRequired: "كلمة المرور مطلوبة",
        nameRequired: "الاسم الكامل مطلوب",
        nameTooShort: "يجب أن يكون الاسم حرفين على الأقل",
        nameInvalid: "الاسم يمكن أن يحتوي على حروف ومسافات فقط",
        usernameRequired: "اسم المستخدم مطلوب",
        usernameTooShort: "يجب أن يكون اسم المستخدم 3 أحرف على الأقل",
        usernameTooLong: "يجب أن يكون اسم المستخدم أقل من 20 حرفاً",
        usernameInvalid: "اسم المستخدم يمكن أن يحتوي على حروف وأرقام وشرطات سفلية فقط",
        usernameNoSpaces: "اسم المستخدم لا يمكن أن يحتوي على مسافات",
        emailInvalid: "يرجى إدخال بريد إلكتروني صحيح",
        passwordTooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        passwordWeak: "يجب أن تحتوي كلمة المرور على حرف ورقم واحد على الأقل",
        passwordsDoNotMatch: "كلمات المرور غير متطابقة",
        countryRequired: "يرجى اختيار الدولة",
        allFieldsRequired: "جميع الحقول مطلوبة",

        // Error messages
        invalidCredentials: "البريد الإلكتروني/اسم المستخدم أو كلمة المرور غير صحيحة",
        userExists: "يوجد مستخدم بهذا البريد الإلكتروني أو اسم المستخدم",
        loginFailed: "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        registerFailed: "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.",
        networkError: "خطأ في الشبكة. يرجى التحقق من اتصالك.",
    },


  // Common
  common: {
    continue: "متابعة",
    back: "رجوع",
    next: "التالي",
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجاح",
  },

  // Tabs
  tabs: {
    home: "الرئيسية",
    community: "المجتمع",
    saved: "المحفوظات",
    profile: "الملف الشخصي",
  },

  // Settings
  settings: {
    title: "الإعدادات",
    language: "اللغة",
    units: "الوحدات",
    appearance: "المظهر",
    permissions: "الأذونات",
    legal: "قانوني",
    kilometers: "كيلومتر",
    miles: "ميل",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    systemDefault: "افتراضي النظام",
    location: "الموقع",
    notifications: "الإشعارات",
    permissionGranted: "مسموح",
    permissionDenied: "مرفوض",
    permissionNotDetermined: "غير محدد",
    requestPermission: "طلب الإذن",
    about: "حول",
    termsOfService: "شروط الخدمة",
    privacyPolicy: "سياسة الخصوصية",
  },
};
