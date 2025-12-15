// Represents a single GPS point in a route
export interface IGPSPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  elevation?: number;
  speed?: number;
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
  createdAt: Date;
  updatedAt: Date;
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
  } | null;
  recordedRoutes: IRecordedRoute[];
  selectedRoute: IRecordedRoute | null;
}

// Represents functions available in route recording context
export interface IRouteRecordingContext extends IRouteRecordingState {
  startRecording: (routeName: string, description?: string) => void;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  addPoint: (point: IGPSPoint) => void;
  saveRoute: (
    routeName: string,
    description?: string
  ) => Promise<IRecordedRoute>;
  deleteRoute: (routeId: string) => Promise<void>;
  fetchUserRoutes: () => Promise<void>;
  selectRoute: (route: IRecordedRoute | null) => void;
  calculateDistance: (point1: IGPSPoint, point2: IGPSPoint) => number;
  calculateDuration: (startTime: Date, endTime: Date) => number;
}
