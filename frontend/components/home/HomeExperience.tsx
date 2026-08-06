'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mood } from '@/lib/home/mood';
import { Background } from './Background/Background';
import { Character } from './Character/Character';
import { TransitionOverlay } from './TransitionOverlay';

export function HomeExperience() {
    const [mood, setMood] = useState<Mood>('idle');
    const [showTransition, setShowTransition] = useState(false);
    const router = useRouter();

    const handleAccept = useCallback(() => {
        setShowTransition(true);
    }, []);

    const handleTransitionComplete = useCallback(() => {
        router.push('/signup');
    }, [router]);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <Background mood={mood} />
            <Character onMoodChange={setMood} onAccept={handleAccept} />
            {showTransition && (
                <TransitionOverlay onComplete={handleTransitionComplete} />
            )}
        </div>
    );
}
