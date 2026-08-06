'use client';

import { motion } from 'framer-motion';
import { Mood, CLOUD_DURATION, CLOUD_OPACITY } from '@/lib/home/mood';

interface CloudLayerProps {
    mood: Mood;
    depth: 1 | 2 | 3;
    cloudSrc: string;
}

const DEPTH_CONFIG = {
    1: { width: 120, top: '2%', durationMultiplier: 2.2 },
    2: { width: 170, top: '10%', durationMultiplier: 1.4 },
    3: { width: 220, top: '18%', durationMultiplier: 1 },
} as const;

const COPIES = 6;

export function CloudLayer({ mood, depth, cloudSrc }: CloudLayerProps) {
    const config = DEPTH_CONFIG[depth];
    const duration = CLOUD_DURATION[mood] * config.durationMultiplier;

    return (
        <motion.div
            className="absolute flex items-start"
            style={{ top: config.top, width: '300%', opacity: CLOUD_OPACITY[mood] }}
            animate={{ x: ['0%', '-33.333%'] }}
            transition={{ duration, repeat: Infinity, ease: 'linear' }}
        >
            {Array.from({ length: COPIES }).map((_, i) => (
                <img
                    key={i}
                    src={cloudSrc}
                    alt=""
                    style={{
                        width: config.width,   // explicit size — this is what actually controls layout + visual size now
                        height: 'auto',
                        marginRight: '6vw',
                        flexShrink: 0,          // prevents flexbox from squeezing images to fit
                    }}
                />
            ))}
        </motion.div>
    );
}