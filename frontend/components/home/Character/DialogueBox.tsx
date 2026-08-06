'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACCENT_COLOR } from '@/lib/home/mood';

interface DialogueBoxProps {
    lines: string[];
    typingDelayMs?: number;  // pause before a line appears — simulates "typing"
    lineDisplayMs?: number;  // how long a line sits before advancing to the next
    onComplete?: () => void; // fires once the final line has appeared
    children?: React.ReactNode; // rendered only after the last line completes
}

// Reusable: used here for the character's two lines, and later for the
// picnic-scene preloaded chat messages — same staggered-reveal + typing-pause
// mechanic, just fed a different lines array.
export function DialogueBox({
                                lines,
                                typingDelayMs = 900,
                                lineDisplayMs = 1800,
                                onComplete,
                                children,
                            }: DialogueBoxProps) {
    const [lineIndex, setLineIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [isComplete, setIsComplete] = useState(false);

    // Reset whenever a new set of lines is handed in (e.g. Character swaps
    // from the intro line to the rejection line)
    useEffect(() => {
        setLineIndex(0);
        setIsTyping(true);
        setIsComplete(false);
    }, [lines]);

    useEffect(() => {
        if (isComplete) return;

        const typingTimer = setTimeout(() => {
            setIsTyping(false);
            const isLastLine = lineIndex === lines.length - 1;

            if (isLastLine) {
                setIsComplete(true);
                onComplete?.();
                return;
            }

            const advanceTimer = setTimeout(() => {
                setLineIndex((i) => i + 1);
                setIsTyping(true);
            }, lineDisplayMs);

            return () => clearTimeout(advanceTimer);
        }, typingDelayMs);

        return () => clearTimeout(typingTimer);
    }, [lineIndex, isComplete, lines, typingDelayMs, lineDisplayMs, onComplete]);

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="relative px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-white font-semibold text-xs sm:text-sm max-w-[280px] sm:max-w-xs text-center shadow-lg shadow-pink-400/20"
                style={{ background: ACCENT_COLOR }}
            >
                <AnimatePresence mode="wait">
                    {isTyping ? (
                        <motion.div
                            key="typing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-1 justify-center py-1"
                        >
                            <span className="w-2 h-2 rounded-full bg-white/80 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 rounded-full bg-white/80 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 rounded-full bg-white/80 animate-bounce" />
                        </motion.div>
                    ) : (
                        <motion.p
                            key={lineIndex}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3 }}
                        >
                            {lines[lineIndex]}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isComplete && children && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}