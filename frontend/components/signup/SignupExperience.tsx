'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Background } from '@/components/home/Background/Background';
import { DialogueBox } from '@/components/home/Character/DialogueBox';
import { SignupForm } from './SignupForm';
import { ACCENT_COLOR } from '@/lib/home/mood';

export function SignupExperience() {
    const router = useRouter();

    const handleSignupSuccess = useCallback(() => {
        router.push('/chat');
    }, [router]);

    return (
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
            {/* Dreamy background */}
            <Background mood="idle" />

            {/* Top-left Back to Bamzy Button */}
            <motion.a
                href="/"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed top-4 left-4 z-30 px-3.5 py-1.5 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 text-xs font-extrabold text-gray-700 hover:text-rose-500 shadow-md shadow-pink-200/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
                <span>← Back to Bamzy ✨</span>
            </motion.a>

            {/* Centered animated wrapper — max-w-[365px] keeps it snug and cute */}
            <div className="relative z-10 w-full max-w-[365px] my-auto flex flex-col items-center pt-8 sm:pt-0">
                
                {/* Character window sitting above the card */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: -16, rotate: -6 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
                    className="relative w-[130px] h-[130px] drop-shadow-xl z-20 -mb-5"
                >
                    <img
                        src="/assets/window-frame.svg"
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 overflow-hidden rounded-2xl flex items-end justify-center">
                        <motion.img
                            src="/assets/Open Peeps - Sitting .png"
                            alt="Bamzy"
                            initial={{ y: '100%' }}
                            animate={{ y: '12%' }}
                            transition={{ type: 'spring', stiffness: 190, damping: 18, delay: 0.3 }}
                            className="w-[90px] h-auto"
                        />
                    </div>
                </motion.div>

                {/* Main Card Container with Floating Ambient Glow */}
                <motion.div
                    className="relative w-full"
                    initial={{ opacity: 0, scale: 0.88, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                >
                    {/* Pulsing ambient aura behind card */}
                    <motion.div
                        className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-300 via-purple-300 to-rose-300 blur-xl opacity-60"
                        animate={{ scale: [0.98, 1.03, 0.98], opacity: [0.5, 0.7, 0.5] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Compact Glass Card */}
                    <motion.div
                        className="relative w-full rounded-3xl bg-white/55 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-pink-300/30 p-5 md:p-6 flex flex-col gap-3.5"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {/* Speech bubble */}
                        <div className="flex justify-center pt-1">
                            <DialogueBox
                                lines={['Tell who you are, human. ✨']}
                                typingDelayMs={500}
                            >
                                <div className="flex justify-center mt-0.5">
                                    <span
                                        className="text-[11px] font-extrabold tracking-wider uppercase opacity-85"
                                        style={{ color: ACCENT_COLOR }}
                                    >
                                        🌸 Bamzy
                                    </span>
                                </div>
                            </DialogueBox>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent w-full" />

                        {/* Animated Signup Form */}
                        <SignupForm onSuccess={handleSignupSuccess} />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
