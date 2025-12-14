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

// Defines the shape of our MapContext state
export interface IMapState {
  locations: ILocation[];
  routes: IRoute[];
  pois: IPOI[];
  heatmapData: { lng: number; lat: number; weight: number }[];
}

// Defines the functions available in our context
export interface IMapContext extends IMapState {
  fetchInitialData: () => void;
  sendLocationUpdate: (location: {
    userId: string;
    longitude: number;
    latitude: number;
  }) => void;
}
