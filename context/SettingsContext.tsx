import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Units = "km" | "miles";

interface SettingsContextType {
  units: Units;
  setUnits: (units: Units) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const UNITS_KEY = "@app_units";

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [units, setUnitsState] = useState<Units>("km");

  useEffect(() => {
    loadSavedUnits();
  }, []);

  const loadSavedUnits = async () => {
    try {
      const savedUnits = await AsyncStorage.getItem(UNITS_KEY);
      if (savedUnits === "km" || savedUnits === "miles") {
        setUnitsState(savedUnits);
      }
    } catch (error) {
      console.log("Error loading units:", error);
    }
  };

  const setUnits = async (newUnits: Units) => {
    try {
      await AsyncStorage.setItem(UNITS_KEY, newUnits);
      setUnitsState(newUnits);
    } catch (error) {
      console.log("Error saving units:", error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        units,
        setUnits,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
