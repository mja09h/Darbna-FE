// api/notifications.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import api from "./index";
import { globalAlert } from "../context/AlertContext";

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    globalAlert(
      "Permission Required",
      "Push notifications are needed for emergency alerts."
    );
    return null;
  }
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    return null;
  }
}

export const savePushToken = async (token: string) => {
  try {
    await api.put("/users/me/push-token", { pushToken: token });
  } catch (error) {
    console.error("Failed to save push token", error);
  }
};
