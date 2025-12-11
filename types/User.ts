export interface User {
    _id: string;
    name: string;
    username: string;
    email: string;
    country: string;
    bio?: string;
    profilePicture?: string;
    coverPicture?: string;
    phone?: string;
    followers: string[];
    following: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginCredentials {
    identifier: string;
    password: string;
}

export interface RegisterCredentials {
    name: string;
    username: string;
    email: string;
    password: string;
    country: string;
}
