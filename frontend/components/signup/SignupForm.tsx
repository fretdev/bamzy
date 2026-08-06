'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RegisterResponse } from '@/types/auth';
import { ACCENT_COLOR } from '@/lib/home/mood';

interface SignupFormProps {
    onSuccess: () => void;
}

const inputBase =
    'w-full px-3.5 py-2.5 rounded-xl bg-white/85 backdrop-blur-sm border border-pink-100/90 ' +
    'text-gray-800 placeholder-pink-300 font-medium text-xs md:text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent ' +
    'transition-colors duration-150 shadow-xs';

export function SignupForm({ onSuccess }: SignupFormProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    function validate(): string | null {
        if (!username.trim()) return 'Username is required.';
        if (username.trim().length < 3) return 'Username must be at least 3 characters.';
        if (password.length < 8) return 'Password must be at least 8 characters.';
        if (password !== confirm) return 'Passwords do not match.';
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setLoading(true);

        const cleanUsername = username.trim();
        const generatedEmail = `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@bamzy.app`;

        try {
            const result = await api.post<RegisterResponse>('/api/auth/register', {
                username: cleanUsername,
                email: generatedEmail,
                password,
            });
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('bamzy:justSignedUp', 'true');
            }
            login({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                username: result.username,
                userId: result.userId,
            });
            onSuccess();
        } catch (err: unknown) {
            console.error('Registration failed:', err);
            const errStr = err instanceof Error ? err.message : String(err);
            if (errStr.includes('409') || errStr.includes('already taken') || errStr.includes('already registered')) {
                setError(`The username "${cleanUsername}" is already taken. Please choose another.`);
            } else if (errStr.includes('8 characters')) {
                setError('Password must be at least 8 characters long.');
            } else {
                setError('Registration failed. Please check your credentials and try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 w-full">
            {/* Username */}
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                    Username
                </label>
                <input
                    id="signup-username"
                    type="text"
                    autoComplete="username"
                    placeholder="pick a name, human"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputBase}
                    disabled={loading}
                />
            </div>

            {/* Password */}
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                    Password (min 8 chars)
                </label>
                <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputBase}
                    disabled={loading}
                />
            </div>

            {/* Confirm Password */}
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                    Confirm Password
                </label>
                <input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputBase}
                    disabled={loading}
                />
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-center"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="mt-1">
                <button
                    id="signup-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md shadow-pink-300/40 transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}, #FB7185)` }}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Creating account…</span>
                        </>
                    ) : (
                        <span>Sign Up ✨</span>
                    )}
                </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-1">
                Already have an account?{' '}
                <a href="/login" style={{ color: ACCENT_COLOR }} className="font-bold underline hover:opacity-85">
                    Log in
                </a>
            </p>
        </form>
    );
}
