'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterState } from '@/lib/home/character';
import { Mood, ACCENT_COLOR } from '@/lib/home/mood';
import { DialogueBox } from './DialogueBox';

interface CharacterProps {
    onMoodChange: (mood: Mood) => void;
    onAccept: () => void;
}

const CHARACTER_IMAGE: Record<'warm' | 'sassy', string> = {
    warm: '/assets/Open Peeps - Sitting .png',
    sassy: '/assets/character-sassy.png',
};

export function Character({ onMoodChange, onAccept }: CharacterProps) {
    const [state, setState] = useState<CharacterState>('intro');

    const handleYes = useCallback(() => {
        onMoodChange('transitioning');
        setState('accepted');
        onAccept();
    }, [onMoodChange, onAccept]);

    const handleNo = useCallback(() => {
        onMoodChange('sad');
        setState('rejected');
    }, [onMoodChange]);

    const handleCloseWindow = useCallback(() => {
        setState('closed');
    }, []);

    const handleRetry = useCallback(() => {
        onMoodChange('idle');
        setState('intro');
    }, [onMoodChange]);

    const isWindowOpen = state === 'intro' || state === 'rejected';
    const expression = state === 'rejected' ? 'sassy' : 'warm';

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            {/* Window + character */}
            <AnimatePresence>
                {isWindowOpen && (
                    <motion.div
                        key="window"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                        className="relative w-[170px] sm:w-[220px] h-[170px] sm:h-[220px]"
                    >
                        {/* Window frame */}
                        <img
                            src="/assets/window-frame.svg"
                            alt=""
                            className="absolute inset-0 w-full h-full object-contain"
                        />

                        {/* Character clipped to window */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl flex items-end justify-center">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={expression}
                                    src={CHARACTER_IMAGE[expression]}
                                    alt=""
                                    initial={{ y: '100%' }}
                                    animate={{ y: '15%' }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                                    className="w-[115px] sm:w-[150px] h-auto"
                                />
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dialogue & Buttons */}
            <div className="min-h-[120px] flex items-start justify-center">
                <AnimatePresence mode="wait">
                    {state === 'intro' && (
                        <motion.div
                            key="intro-dialogue"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <DialogueBox lines={['Is that a human?']} typingDelayMs={300}>
                                <div className="flex gap-4 justify-center mt-4">
                                    {/* High contrast YES button */}
                                    <motion.button
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.94 }}
                                        onClick={handleYes}
                                        style={{
                                            background: 'linear-gradient(135deg, #F43F5E, #E11D48)',
                                            color: '#FFFFFF',
                                            border: '1px solid rgba(255, 255, 255, 0.4)',
                                        }}
                                        className="px-8 py-2.5 rounded-full font-extrabold text-sm shadow-lg shadow-rose-900/30 cursor-pointer transition-all"
                                    >
                                        Yes ✨
                                    </motion.button>

                                    {/* High contrast NO button */}
                                    <motion.button
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.94 }}
                                        onClick={handleNo}
                                        style={{
                                            background: '#FFFFFF',
                                            color: '#E11D48',
                                            border: '2px solid #FECDD3',
                                        }}
                                        className="px-8 py-2.5 rounded-full font-extrabold text-sm shadow-md shadow-pink-900/20 cursor-pointer transition-all"
                                    >
                                        No 🤖
                                    </motion.button>
                                </div>
                            </DialogueBox>
                        </motion.div>
                    )}

                    {state === 'rejected' && (
                        <motion.div
                            key="rejected-dialogue"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <DialogueBox
                                lines={["I ain't talking to a robot! 🤖"]}
                                typingDelayMs={300}
                            >
                                <div className="flex gap-3 justify-center mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.94 }}
                                        onClick={handleRetry}
                                        style={{
                                            background: 'linear-gradient(135deg, #F43F5E, #E11D48)',
                                            color: '#FFFFFF',
                                        }}
                                        className="px-5 py-2.5 rounded-full font-extrabold text-xs sm:text-sm shadow-lg cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span>Wait, I&apos;m human! ✨</span>
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.94 }}
                                        onClick={handleCloseWindow}
                                        style={{
                                            background: '#FFFFFF',
                                            color: '#4B5563',
                                            border: '1px solid #D1D5DB',
                                        }}
                                        className="px-4 py-2.5 rounded-full font-extrabold text-xs sm:text-sm shadow-sm cursor-pointer"
                                    >
                                        Bye 👋
                                    </motion.button>
                                </div>
                            </DialogueBox>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Retry button when window closes after clicking Bye */}
            <AnimatePresence>
                {state === 'closed' && (
                    <motion.button
                        key="retry"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRetry}
                        style={{ background: ACCENT_COLOR, color: '#FFFFFF' }}
                        className="px-8 py-3 rounded-full font-extrabold text-sm shadow-lg cursor-pointer"
                    >
                        Hi Bamzy ✨
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}