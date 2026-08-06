'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageResponse } from '@/types/chat';
import { CharacterAvatar } from './CharacterAvatar';

interface MessageBubbleProps {
    message: MessageResponse;
    currentUsername: string;
    reaction?: string;
    onReact?: (messageId: string, emoji: string) => void;
}

const REACTION_OPTIONS = ['❤️', '🌸', '😂', '👍', '✨'];

export const MessageBubble = memo(function MessageBubble({
    message,
    currentUsername,
    reaction,
    onReact,
}: MessageBubbleProps) {
    const [localReaction, setLocalReaction] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(`bamzy:reaction:${message.publicId}`);
    });
    const [showReactions, setShowReactions] = useState(false);

    const reactionBoxRef = useRef<HTMLDivElement>(null);

    const activeReaction = reaction || localReaction;

    const isMine =
        Boolean(message.senderUsername) &&
        Boolean(currentUsername) &&
        message.senderUsername.trim().toLowerCase() === currentUsername.trim().toLowerCase();

    const isScripted = message.senderUsername === 'Bamzy' || message.senderUsername === 'BamzyBot';

    // Close reaction popover when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (reactionBoxRef.current && !reactionBoxRef.current.contains(e.target as Node)) {
                setShowReactions(false);
            }
        }
        if (showReactions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showReactions]);

    function handleSelectReaction(emoji: string) {
        const next = activeReaction === emoji ? '' : emoji;
        setLocalReaction(next || null);
        setShowReactions(false);

        if (typeof window !== 'undefined') {
            if (next) {
                localStorage.setItem(`bamzy:reaction:${message.publicId}`, next);
            } else {
                localStorage.removeItem(`bamzy:reaction:${message.publicId}`);
            }
        }

        if (onReact) {
            onReact(message.publicId, next || emoji);
        }
    }

    // Hide dummy legacy reaction messages if any exist
    if (message.content.startsWith('[REACTION:')) {
        return null;
    }

    return (
        <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} w-full my-1 relative group`}>
            {/* Show Character Avatar for received messages */}
            {!isMine && (
                <CharacterAvatar
                    variant={isScripted ? 'warm' : 'sassy'}
                    size="sm"
                />
            )}

            <div className={`flex flex-col gap-0.5 max-w-[85%] sm:max-w-[75%] ${isMine ? 'items-end' : 'items-start'} relative`} ref={reactionBoxRef}>
                {/* Sender Name for Received Messages */}
                {!isMine && (
                    <span className="text-[11px] font-extrabold tracking-wide ml-1 text-rose-500 flex items-center gap-1">
                        {isScripted ? '✨ Bamzy' : message.senderUsername}
                    </span>
                )}

                {/* Floating Reaction Bar Popover */}
                <AnimatePresence>
                    {showReactions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.12 }}
                            className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-8 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/95 backdrop-blur-2xl border border-white/30 shadow-xl`}
                        >
                            {REACTION_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectReaction(emoji);
                                    }}
                                    className="hover:scale-125 active:scale-125 transition-transform text-lg p-1 cursor-pointer"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Container holding Bubble + Reaction trigger icon */}
                <div className="flex items-center gap-1.5 group">
                    {/* Reaction Trigger Icon for Sent Messages */}
                    {isMine && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowReactions((prev) => !prev);
                            }}
                            className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 text-xs text-pink-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"
                            title="Add reaction"
                        >
                            😊
                        </button>
                    )}

                    {/* Message Bubble Body */}
                    <div
                        onClick={() => setShowReactions((prev) => !prev)}
                        className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs relative cursor-pointer ${
                            isMine
                                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white rounded-br-xs shadow-md shadow-pink-300/30'
                                : 'bg-white/95 backdrop-blur-xl text-gray-900 border border-pink-200/70 rounded-bl-xs shadow-sm shadow-pink-100/40'
                        }`}
                    >
                        <span>{message.content}</span>

                        {/* Attached Reaction Badge */}
                        {activeReaction && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowReactions(true);
                                }}
                                className={`absolute -bottom-2 ${isMine ? '-left-2' : '-right-2'} px-1.5 py-0.5 rounded-full bg-rose-950 text-xs border border-white/40 shadow-md cursor-pointer hover:scale-110 transition-transform`}
                            >
                                {activeReaction}
                            </motion.div>
                        )}

                        {/* Timestamp + Double Checkmarks inside bubble bottom right */}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-semibold ${isMine ? 'text-pink-100' : 'text-gray-400'}`}>
                            <span>
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            {isMine && (
                                <svg className="w-3.5 h-3.5 fill-current text-pink-200" viewBox="0 0 24 24">
                                    <path d="M18.71 7.21a1 1 0 0 0-1.42 0l-7.45 7.46-3.13-3.14a1 1 0 1 0-1.42 1.42l3.84 3.84a1 1 0 0 0 1.42 0l8.16-8.16a1 1 0 0 0 0-1.42zm-4.45 0a1 1 0 0 0-1.42 0l-3 3a1 1 0 0 0 1.42 1.42l3-3a1 1 0 0 0 0-1.42z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Reaction Trigger Icon for Received Messages */}
                    {!isMine && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowReactions((prev) => !prev);
                            }}
                            className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 text-xs text-pink-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"
                            title="Add reaction"
                        >
                            😊
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});
