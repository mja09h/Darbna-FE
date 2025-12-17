import React, { useState, useEffect } from "react";
import { Text, StyleSheet } from "react-native";

interface CountdownTimerProps {
  expiryTimestamp: number;
  onExpire: () => void;
  label?: string;
  textStyle?: any;
}

const CountdownTimer = ({
  expiryTimestamp,
  onExpire,
  label = "Time remaining",
  textStyle,
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      const newTimeLeft = expiryTimestamp - Date.now();
      if (newTimeLeft <= 0) {
        onExpire();
        clearInterval(interval);
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp, onExpire, timeLeft]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <Text style={[styles.timerText, textStyle]}>
      {label}: {formatTime(timeLeft)}
    </Text>
  );
};

const styles = StyleSheet.create({
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D9534F",
    textAlign: "center",
    marginVertical: 12,
  },
});

export default CountdownTimer;
