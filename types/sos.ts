// types/sos.ts
export interface ISOSAlert {
  _id: string;
  user: { _id: string; username: string };
  location: { type: "Point"; coordinates: [number, number] };
  status: "ACTIVE" | "RESOLVED";
  createdAt: string;
  distance: number; // in meters
  helpers: string[]; // Array of user IDs
}

export interface HelpOfferResponse {
  message: string;
  phoneNumber: string;
}
