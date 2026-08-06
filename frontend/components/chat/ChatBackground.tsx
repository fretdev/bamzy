'use client';

import { motion } from 'framer-motion';
import { CloudLayer } from '@/components/home/Background/CloudLayer';

export type ThemePreset = 'sunset' | 'galaxy' | 'meadow' | 'golden';

interface ChatBackgroundProps {
    theme?: ThemePreset;
}

const THEME_GRADIENTS: Record<ThemePreset, string> = {
    sunset: 'linear-gradient(140deg, #FDA4AF 0%, #F472B6 30%, #E879F9 65%, #C084FC 100%)',
    galaxy: 'linear-gradient(140deg, #1E1B4B 0%, #312E81 30%, #4C1D95 65%, #581C87 100%)',
    meadow: 'linear-gradient(140deg, #A7F3D0 0%, #FBCFE8 35%, #DDD6FE 70%, #C084FC 100%)',
    golden: 'linear-gradient(140deg, #FDE68A 0%, #FCA5A5 40%, #F472B6 75%, #E879F9 100%)',
};

export function ChatBackground({ theme = 'sunset' }: ChatBackgroundProps) {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-all duration-700">
            {/* Dynamic Sky Gradient */}
            <div
                className="absolute inset-0 transition-all duration-700"
                style={{ background: THEME_GRADIENTS[theme] || THEME_GRADIENTS.sunset }}
            />

            {/* Subtle WhatsApp-style doodle texture overlay */}
            <div
                className="absolute inset-0 opacity-15"
                style={{
                    backgroundImage: `radial-gradient(#FFF 1.2px, transparent 1.2px), radial-gradient(#FFF 1.2px, #FDA4AF 1.2px)`,
                    backgroundSize: '36px 36px',
                    backgroundPosition: '0 0, 18px 18px',
                }}
            />

            {/* Drifting Clouds Layers */}
            <CloudLayer mood="idle" depth={1} cloudSrc="/assets/clouds.png" />
            <CloudLayer mood="idle" depth={2} cloudSrc="/assets/cloudy3.png" />
            <CloudLayer mood="idle" depth={3} cloudSrc="/assets/cloudy.png" />

            {/* Vivid glowing ambient light aura spheres */}
            <motion.div
                className="absolute -top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-40 bg-rose-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.5, 0.35], x: [-10, 15, -10] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute top-1/3 -right-20 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-35 bg-purple-400"
                animate={{ scale: [1.15, 0.95, 1.15], opacity: [0.3, 0.45, 0.3], y: [-15, 10, -15] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            <motion.div
                className="absolute -bottom-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-35 bg-pink-400"
                animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.25, 0.4, 0.25] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />

            {/* Floating glowing sparkles & hearts */}
            {[
                { top: '10%', left: '12%', size: 'text-xs', symbol: '✨', delay: 0 },
                { top: '22%', left: '82%', size: 'text-sm', symbol: '💖', delay: 1.2 },
                { top: '42%', left: '8%', size: 'text-xs', symbol: '⭐', delay: 2.4 },
                { top: '62%', left: '90%', size: 'text-sm', symbol: '✨', delay: 0.8 },
                { top: '78%', left: '18%', size: 'text-xs', symbol: '🌸', delay: 1.8 },
                { top: '30%', left: '48%', size: 'text-xs', symbol: '💕', delay: 3.0 },
            ].map((item, idx) => (
                <motion.div
                    key={idx}
                    className={`absolute ${item.size} select-none drop-shadow-md`}
                    style={{ top: item.top, left: item.left }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.25, 0.85], y: [0, -6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
                >
                    {item.symbol}
                </motion.div>
            ))}

            {/* Soft decorative curved glass wave at bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[18%]"
                style={{
                    background: 'linear-gradient(to bottom, rgba(253, 164, 175, 0.4) 0%, rgba(244, 114, 182, 0.5) 100%)',
                    borderRadius: '50% 50% 0 0 / 20% 20% 0 0',
                    backdropFilter: 'blur(6px)',
                }}
            />
        </div>
    );
}
