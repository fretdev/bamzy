"use client";

import { createContext,useContext,useState,ReactNode} from "react";

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    username: string | null;
    userId: string | null;
}

interface  AuthContextType extends AuthState{
    login: (data: {accessToken: string; refreshToken: string; username: string; userId: string})=> void;
    logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children }: {children: ReactNode}){
    const [auth,setAuth] = useState<AuthState>({
        accessToken: null,
        refreshToken: null,
        username: null,
        userId: null,
    });

    function login(data: {accessToken: string; refreshToken: string; username: string;userId: string}){
        setAuth({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            username: data.username,
            userId: data.userId,
        });
    }

    function logout(){
        setAuth(
            {
                accessToken: null,
                refreshToken: null,
                username: null,
                userId: null,
            }
        );
    }

    return (
        <AuthContext.Provider value={{...auth,login,logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() : AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}