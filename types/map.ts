// Represents a single point location
export interface ILocation {
  _id: string;
  userId: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  timestamp: string;
}

// Represents a route or path
export interface IRoute {
  _id: string;
  name: string;
  path: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

// Represents a Point of Interest
export interface IPOI {
  _id: string;
  name: string;
  description?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

// Represents a Pinned Place
export interface IPinnedPlace {
  _id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  isPublic: boolean;
  userId: {
    _id: string;
    username: string;
  };
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  updatedAt: string;
}

// Data structure for creating a new pin
export interface CreatePinData {
  title: string;
  description?: string; // Optional
  image?: any; // Optional - ImagePicker asset
  category: string;
  isPublic: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
}

// Defines the shape of our MapContext state
export interface IMapState {
  locations: ILocation[];
  routes: IRoute[];
  pois: IPOI[];
  heatmapData: { lng: number; lat: number; weight: number }[];
  pinnedPlaces: IPinnedPlace[];
}

// Defines the functions available in our context
export interface IMapContext extends IMapState {
  fetchInitialData: () => void;
  sendLocationUpdate: (location: {
    userId: string;
    longitude: number;
    latitude: number;
  }) => void;
  createPin: (pinData: CreatePinData) => Promise<void>;
}
