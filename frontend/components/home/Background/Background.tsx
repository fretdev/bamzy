'use client';

import { Mood } from '@/lib/home/mood';
import { Sky } from './Sky';
import { CloudLayer } from './CloudLayer';

interface BackgroundProps {
    mood: Mood;
}

export function Background({ mood }: BackgroundProps) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <Sky mood={mood} />
            <CloudLayer mood={mood} depth={1} cloudSrc="/assets/clouds.png" />
            <CloudLayer mood={mood} depth={2} cloudSrc="/assets/cloudy3.png" />
            <CloudLayer mood={mood} depth={3} cloudSrc="/assets/cloudy.png" />
        </div>
    );
}