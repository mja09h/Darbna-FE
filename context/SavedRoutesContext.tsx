import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import api from "../api";

export interface IFolder {
  _id: string;
  name: string;
  description?: string;
  color?: string;
}

// EXTENDED INTERFACE with all fields needed for the modal
export interface ISavedRoute {
  _id: string;
  routeId: {
    _id: string;
    name: string;
    distance: number;
    duration: number;
    routeType: string;
    description?: string;
    elevationGain?: number;
    estimatedTime?: string;
    difficulty?: string;
    rating?: number;
    location?: string;
    terrain?: string;
    userId?: string;
    isPublic?: boolean;
    screenshot?: {
      url: string;
      uploadedAt: Date;
    };
    images?: Array<{
      url: string;
      uploadedAt: Date;
    }>;
    path?: {
      type: string;
      coordinates: [number, number][];
    };
    points?: Array<{
      latitude: number;
      longitude: number;
      timestamp: Date;
      elevation?: number;
      speed?: number;
    }>;
    startPoint?: {
      latitude: number;
      longitude: number;
    };
    endPoint?: {
      latitude: number;
      longitude: number;
    };
  };
  folderId: IFolder;
  difficulty?: string;
  terrain?: string;
  notes?: string;
  isFavorite: boolean;
  savedAt: Date;
}

interface SavedRoutesContextType {
  savedRoutes: ISavedRoute[];
  folders: IFolder[];
  loading: boolean;
  selectedFolder: IFolder | null;
  searchQuery: string;

  fetchSavedRoutes: (folderId?: string) => Promise<void>;
  fetchFolders: () => Promise<void>;
  createFolder: (
    name: string,
    description?: string,
    color?: string
  ) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  saveRoute: (routeId: string, folderId: string) => Promise<void>;
  deleteSavedRoute: (savedRouteId: string) => Promise<void>;
  toggleFavorite: (savedRouteId: string) => Promise<void>;
  setSelectedFolder: (folder: IFolder | null) => void;
  setSearchQuery: (query: string) => void;
}

const SavedRoutesContext = createContext<SavedRoutesContextType | undefined>(
  undefined
);

export const SavedRoutesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [savedRoutes, setSavedRoutes] = useState<ISavedRoute[]>([]);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<IFolder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFolders = useCallback(async () => {
    try {
      const response = await api.get("/folders");
      setFolders(response.data.data || []);
    } catch (error: any) {
      setFolders([]);
    }
  }, []);

  const fetchSavedRoutes = useCallback(async (folderId?: string) => {
    setLoading(true);
    try {
      const params = folderId ? { folderId } : {};
      const response = await api.get("/saved-routes", { params });
      setSavedRoutes(response.data.data || []);
    } catch (error: any) {
      setSavedRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(
    async (name: string, description?: string, color?: string) => {
      try {
        const response = await api.post("/folders", {
          name,
          description,
          color,
        });
        setFolders([...folders, response.data.data]);
      } catch (error: any) {
        throw error;
      }
    },
    [folders]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await api.delete(`/folders/${folderId}`);
        setFolders(folders.filter((f) => f._id !== folderId));
      } catch (error: any) {
        throw error;
      }
    },
    [folders]
  );

  const saveRoute = useCallback(
    async (routeId: string, folderId: string) => {
      try {
        const response = await api.post("/saved-routes", { routeId, folderId });
        setSavedRoutes([...savedRoutes, response.data.data]);
      } catch (error: any) {
        throw error;
      }
    },
    [savedRoutes]
  );

  const deleteSavedRoute = useCallback(
    async (savedRouteId: string) => {
      try {
        await api.delete(`/saved-routes/${savedRouteId}`);
        setSavedRoutes(savedRoutes.filter((r) => r._id !== savedRouteId));
      } catch (error: any) {
        throw error;
      }
    },
    [savedRoutes]
  );

  const toggleFavorite = useCallback(
    async (savedRouteId: string) => {
      try {
        const response = await api.post(
          `/saved-routes/${savedRouteId}/favorite`
        );
        setSavedRoutes(
          savedRoutes.map((r) =>
            r._id === savedRouteId ? response.data.data : r
          )
        );
      } catch (error: any) {
        throw error;
      }
    },
    [savedRoutes]
  );

  return (
    <SavedRoutesContext.Provider
      value={{
        savedRoutes,
        folders,
        loading,
        selectedFolder,
        searchQuery,
        fetchSavedRoutes,
        fetchFolders,
        createFolder,
        deleteFolder,
        saveRoute,
        deleteSavedRoute,
        toggleFavorite,
        setSelectedFolder,
        setSearchQuery,
      }}
    >
      {children}
    </SavedRoutesContext.Provider>
  );
};

export const useSavedRoutes = () => {
  const context = useContext(SavedRoutesContext);
  if (!context) {
    throw new Error("useSavedRoutes must be used within SavedRoutesProvider");
  }
  return context;
};
