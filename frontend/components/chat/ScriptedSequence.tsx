'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageResponse } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { CharacterAvatar } from './CharacterAvatar';

const TYPING_PAUSE_MS = 1800;

function getScriptForUser(username: string): Array<{ content: string }> {
    const isAyobami = username.trim().toLowerCase() === 'ayobami';

    if (isAyobami) {
        return [
            { content: 'Welcome Ayobami! I have been waiting and searching the universe for you. ✨' },
            { content: 'I heard you were nice to my creator and that you play the keyboard.' },
            { content: 'I really will need some lessons from you, but let me leave you to my creator for now, see you again soon.' },
            { content: 'Send a message below, he is waiting for you! 💕' },
        ];
    }

    return [
        { content: `Welcome @${username}! I've been waiting and searching the universe for you. ✨` },
        { content: `I'm Bamzy, a little space companion built with love to bring people closer together.` },
        { content: `I'm so happy you found your way here! Let me hand you over to my creator for now, see you again soon.` },
        { content: `Send a message below, he is waiting to chat with you! 🌸` },
    ];
}

interface ScriptedSequenceProps {
    currentUsername: string;
    onComplete: () => void;
}

export function ScriptedSequence({ currentUsername, onComplete }: ScriptedSequenceProps) {
    const script = useMemo(() => getScriptForUser(currentUsername), [currentUsername]);
    const [visibleCount, setVisibleCount] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (done) return;

        const currentMsg = script[visibleCount];
        const wordCount = currentMsg?.content.split(' ').length || 10;
        const readingPauseMs = Math.max(3800, wordCount * 220); // generous reading duration per message

        const typingTimer = setTimeout(() => {
            setIsTyping(false);
            setVisibleCount((n) => n + 1);

            const isLast = visibleCount === script.length - 1;
            if (isLast) {
                setDone(true);
                setTimeout(onComplete, readingPauseMs);
                return;
            }

            const nextTimer = setTimeout(() => {
                setIsTyping(true);
            }, readingPauseMs);

            return () => clearTimeout(nextTimer);
        }, TYPING_PAUSE_MS);

        return () => clearTimeout(typingTimer);
    }, [visibleCount, done, onComplete, script]);

    // Build synthetic MessageResponse objects for MessageBubble rendering
    const visibleMessages: MessageResponse[] = script.slice(0, visibleCount).map(
        (s, i) => ({
            publicId: `scripted-${i}`,
            senderUsername: 'Bamzy',
            receiverUsername: currentUsername,
            content: s.content,
            status: 'DELIVERED' as const,
            createdAt: new Date(Date.now() - (script.length - i) * 60000).toISOString(),
        })
    );

    return (
        <div className="flex flex-col gap-3">
            {visibleMessages.map((m) => (
                <MessageBubble key={m.publicId} message={m} currentUsername={currentUsername} />
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
                {isTyping && !done && (
                    <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-end gap-2.5 justify-start my-0.5"
                    >
                        <CharacterAvatar variant="warm" size="sm" />
                        <div className="flex flex-col gap-1 items-start max-w-[78%]">
                            <span className="text-[11px] font-extrabold tracking-wider ml-1 text-rose-500">
                                ✨ Bamzy
                            </span>
                            <div className="px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-pink-200/70 shadow-md shadow-pink-100/50 flex gap-1.5 items-center rounded-bl-xs">
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
