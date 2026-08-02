"use client";

import { useState} from "react";
import {api} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";
import {LoginResponse} from "@/types/auth";
import {useRouter} from "next/navigation";


export default function LoginPage(){
    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");
    const [error,setError] = useState<string | null>(null);

    const {login} = useAuth();
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent){
        e.preventDefault();
        setError(null);

        try{
            const result = await api.post<LoginResponse>("/api/auth/login",{
                username,
                password,
            });
            login({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                username: result.username,
                userId: result.userId,
            })
             router.push("/chat");
        } catch (err){
            console.error("Login failed:",err);
            setError("Login failed. Check your credentials.");
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
                />
            <br/>
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                />
            <button type="submit">Log in</button>
            {error && <p>{error}</p>}
        </form>
    )
}