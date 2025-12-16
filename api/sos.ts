// api/sos.ts
import api from "./index";
import { ISOSAlert, HelpOfferResponse } from "../types/sos";

export const createSOSAlert = async (location: {
  latitude: number;
  longitude: number;
}) => {
  const response = await api.post<ISOSAlert>("/sos/create", location);
  return response.data;
};

export const getActiveSOSAlerts = async (location: {
  latitude: number;
  longitude: number;
}) => {
  const response = await api.get<ISOSAlert[]>("/sos/active", {
    params: location,
  });
  return response.data;
};

export const offerHelp = async (alertId: string) => {
  const response = await api.post<HelpOfferResponse>(`/sos/${alertId}/help`);
  return response.data;
};

export const cancelHelp = async (alertId: string) => {
  const response = await api.post(`/sos/${alertId}/cancel-help`);
  return response.data;
};

export const resolveSOSAlert = async (alertId: string) => {
  const response = await api.put<ISOSAlert>(`/sos/${alertId}/resolve`);
  return response.data;
};
