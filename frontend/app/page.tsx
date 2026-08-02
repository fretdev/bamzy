"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
    const { username, accessToken } = useAuth();
    return (
        <div>
            <p>Logged in as: {username ?? "nobody"}</p>
            <p>Token: {accessToken ?? "none"}</p>
            <Link href="/login">Go to login</Link>
        </div>
    );
}