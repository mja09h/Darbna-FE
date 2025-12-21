import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
} from "react";
import CustomAlert, { AlertButton } from "../components/CustomAlert";

interface AlertContextType {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Global alert function for use in contexts and non-component code
let globalAlertFunction:
  | ((title: string, message?: string, buttons?: AlertButton[]) => void)
  | null = null;

export const setGlobalAlert = (
  alertFn: (title: string, message?: string, buttons?: AlertButton[]) => void
) => {
  globalAlertFunction = alertFn;
};

export const globalAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (globalAlertFunction) {
    globalAlertFunction(title, message, buttons);
  } else {
    // Fallback to console if alert not initialized
    console.warn("Alert not initialized:", title, message);
  }
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider = ({ children }: AlertProviderProps) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<AlertButton[]>([]);
  const [type, setType] = useState<"success" | "error" | "warning" | "info">(
    "info"
  );

  // Auto-detect alert type from title/message
  const detectType = (
    title: string,
    message?: string
  ): "success" | "error" | "warning" | "info" => {
    const text = `${title} ${message || ""}`.toLowerCase();

    if (
      text.includes("error") ||
      text.includes("failed") ||
      text.includes("fail")
    ) {
      return "error";
    }
    if (
      text.includes("success") ||
      text.includes("successfully") ||
      text.includes("saved")
    ) {
      return "success";
    }
    if (
      text.includes("warning") ||
      text.includes("caution") ||
      text.includes("are you sure")
    ) {
      return "warning";
    }
    return "info";
  };

  const alert = (
    alertTitle: string,
    alertMessage?: string,
    alertButtons?: AlertButton[]
  ) => {
    // Auto-detect type
    const detectedType = detectType(alertTitle, alertMessage);

    // If no buttons provided, add default OK button
    const finalButtons: AlertButton[] =
      alertButtons && alertButtons.length > 0
        ? alertButtons
        : [{ text: "OK", style: "default", onPress: () => {} }];

    setTitle(alertTitle);
    setMessage(alertMessage || "");
    setButtons(finalButtons);
    setType(detectedType);
    setVisible(true);
  };

  // Set global alert function for use in contexts
  React.useEffect(() => {
    setGlobalAlert(alert);
    return () => {
      setGlobalAlert(() => {});
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={title}
        message={message}
        buttons={buttons}
        onDismiss={handleDismiss}
        type={type}
      />
    </AlertContext.Provider>
  );
};
