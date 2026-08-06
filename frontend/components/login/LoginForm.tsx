'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { LoginResponse } from '@/types/auth';
import { ACCENT_COLOR } from '@/lib/home/mood';

interface LoginFormProps {
    onSuccess: () => void;
}

const inputBase =
    'w-full px-3.5 py-2.5 rounded-xl bg-white/85 backdrop-blur-sm border border-pink-100/90 ' +
    'text-gray-800 placeholder-pink-300 font-medium text-xs md:text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent ' +
    'transition-colors duration-150 shadow-xs';

export function LoginForm({ onSuccess }: LoginFormProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const result = await api.post<LoginResponse>('/api/auth/login', {
                username,
                password,
            });
            login({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                username: result.username,
                userId: result.userId,
            });
            onSuccess();
        } catch (err) {
            console.error('Login failed:', err);
            setError('Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 w-full">
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                    Username
                </label>
                <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    placeholder="who goes there?"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputBase}
                    disabled={loading}
                />
            </div>

            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                    Password
                </label>
                <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="the secret word"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputBase}
                    disabled={loading}
                />
            </div>

            <AnimatePresence>
                {error && (
                    <motion.p
                        key="error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="text-xs text-red-500 font-semibold text-center mt-0.5"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <div className="mt-1">
                <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold text-xs md:text-sm shadow-md shadow-pink-300/40 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Logging in…
                        </span>
                    ) : (
                        'Come in ✨'
                    )}
                </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-0.5">
                New here?{' '}
                <a
                    href="/signup"
                    className="font-bold underline underline-offset-2"
                    style={{ color: ACCENT_COLOR }}
                >
                    Sign up
                </a>
            </p>
        </form>
    );
}
