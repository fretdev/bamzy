'use client';

import { motion } from 'framer-motion';

interface CharacterAvatarProps {
    variant?: 'warm' | 'sassy' | 'peep';
    size?: 'sm' | 'md' | 'lg';
    showStatus?: boolean;
    isOnline?: boolean;
}

const AVATAR_IMAGES = {
    warm: '/assets/character-warm.png',
    sassy: '/assets/character-sassy.png',
    peep: '/assets/Open Peeps - Sitting .png',
};

const SIZE_MAP = {
    sm: { container: 'w-8 h-8', img: 'w-6', status: 'w-2.5 h-2.5' },
    md: { container: 'w-11 h-11', img: 'w-9', status: 'w-3 h-3' },
    lg: { container: 'w-16 h-16', img: 'w-14', status: 'w-4 h-4' },
};

export function CharacterAvatar({
    variant = 'warm',
    size = 'md',
    showStatus = false,
    isOnline = true,
}: CharacterAvatarProps) {
    const sizeConfig = SIZE_MAP[size];
    const imgSrc = AVATAR_IMAGES[variant] || AVATAR_IMAGES.warm;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0">
            {/* Glowing outer halo aura */}
            <motion.div
                className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-white/80 via-pink-300/80 to-purple-300/80 blur-xs opacity-90"
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.95, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Circular character container */}
            <motion.div
                className={`relative ${sizeConfig.container} rounded-full bg-gradient-to-br from-white via-pink-50 to-rose-100 border-2 border-white/95 shadow-md shadow-rose-900/15 overflow-hidden flex items-end justify-center`}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <motion.img
                    src={imgSrc}
                    alt="Character Avatar"
                    className={`${sizeConfig.img} h-auto object-contain translate-y-[10%]`}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                />
            </motion.div>

            {/* Status dot with emerald green glow */}
            {showStatus && (
                <motion.span
                    className={`absolute bottom-0 right-0 ${sizeConfig.status} rounded-full border-2 border-white shadow-sm`}
                    style={{ background: isOnline ? '#10B981' : '#F59E0B' }}
                    animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </div>
    );
}
