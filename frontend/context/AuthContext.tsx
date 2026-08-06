"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    username: string | null;
    userId: string | null;
}

interface AuthContextType extends AuthState {
    login: (data: { accessToken: string; refreshToken: string; username: string; userId: string }) => void;
    logout: () => void;
}

const AUTH_STORAGE_KEY = "bamzy_auth_state";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthState>(() => {
        if (typeof window === "undefined") {
            return { accessToken: null, refreshToken: null, username: null, userId: null };
        }
        try {
            const saved = localStorage.getItem(AUTH_STORAGE_KEY);
            return saved ? JSON.parse(saved) : { accessToken: null, refreshToken: null, username: null, userId: null };
        } catch {
            return { accessToken: null, refreshToken: null, username: null, userId: null };
        }
    });

    function login(data: { accessToken: string; refreshToken: string; username: string; userId: string }) {
        const newState = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            username: data.username,
            userId: data.userId,
        };
        setAuth(newState);
        if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
        }
    }

    function logout() {
        const emptyState = {
            accessToken: null,
            refreshToken: null,
            username: null,
            userId: null,
        };
        setAuth(emptyState);
        if (typeof window !== "undefined") {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }

    return (
        <AuthContext.Provider value={{ ...auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}