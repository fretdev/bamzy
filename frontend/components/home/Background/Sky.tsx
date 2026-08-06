'use client';

import { motion } from 'framer-motion';
import { Mood, SKY_GRADIENT } from '@/lib/home/mood';

interface SkyProps {
    mood: Mood;
}

export function Sky({ mood }: SkyProps) {
    return (
        <div className="absolute inset-0 pointer-events-none">
            {(Object.keys(SKY_GRADIENT) as Mood[]).map((m) => (
                <motion.div
                    key={m}
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(to bottom, ${SKY_GRADIENT[m].from}, ${SKY_GRADIENT[m].to})`,
                    }}
                    initial={false}
                    animate={{ opacity: mood === m ? 1 : 0 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}
