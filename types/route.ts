export interface IGPSPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  elevation?: number;
  speed?: number;
}

// Route type enum
export type RouteType = "Running" | "Cycling" | "Walking" | "Hiking" | "Other";

// Image interface for route media
export interface IRouteImage {
  url: string;
  uploadedAt: Date | string;
}

// Represents a recorded route
export interface IRecordedRoute {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  path: {
    type: "LineString";
    coordinates: [number, number][];
  };
  startTime: Date;
  endTime?: Date;
  distance: number;
  duration: number;
  points: IGPSPoint[];
  // NEW FIELDS
  isPublic: boolean;
  routeType: string;
  screenshot?: {
    url: string;
    uploadedAt: Date;
  };
  images?: Array<{
    url: string;
    uploadedAt: Date;
  }>;
  // NEW FIELDS FOR START AND END POINTS
  startPoint?: {
    latitude: number;
    longitude: number;
  };
  endPoint?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
  // User data (populated by backend)
  user?: {
    _id: string;
    username: string;
    name?: string;
  };
}

// Represents the state of route recording
export interface IRouteRecordingState {
  isRecording: boolean;
  currentRoute: {
    name: string;
    description: string;
    points: IGPSPoint[];
    startTime: Date | null;
    distance: number;
    duration: number;
    isPublic?: boolean;
    routeType?: string;
    // NEW FIELDS FOR START AND END POINTS
    startPoint?: {
      latitude: number;
      longitude: number;
    };
    endPoint?: {
      latitude: number;
      longitude: number;
    };
  } | null;
  recordedRoutes: IRecordedRoute[];
  selectedRoute: IRecordedRoute | null;
}

// Represents functions available in route recording context
export interface IRouteRecordingContext extends IRouteRecordingState {
  startRecording: (routeName?: string, description?: string) => void;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  discardRecording: () => void;
  addPoint: (point: IGPSPoint) => void;
  saveRoute: (
    routeName: string,
    description: string,
    isPublic: boolean,
    routeType: string,
    screenshot?: string // Base64 or URI
  ) => Promise<IRecordedRoute>;
  deleteRoute: (routeId: string) => Promise<void>;
  fetchUserRoutes: () => Promise<void>;
  selectRoute: (route: IRecordedRoute | null) => void;
  calculateDistance: (point1: IGPSPoint, point2: IGPSPoint) => number;
  calculateDuration: (startTime: Date, endTime: Date) => number;
}
