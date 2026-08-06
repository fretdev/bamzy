export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    userId: string;
    username: string;
}

// Register returns the same token payload as login — the user is immediately signed in.
export type RegisterResponse = LoginResponse;