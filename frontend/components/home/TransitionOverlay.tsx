'use client';

import { motion } from 'framer-motion';

interface TransitionOverlayProps {
    onComplete: () => void;
}

export function TransitionOverlay({ onComplete }: TransitionOverlayProps) {
    return (
        <motion.div
            className="fixed inset-0 z-50 bg-gradient-to-br from-rose-400 via-pink-300 to-amber-200"
            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ clipPath: 'circle(150% at 50% 50%)' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={onComplete}
        />
    );
}
