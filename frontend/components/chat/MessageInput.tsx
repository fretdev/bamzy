'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
    onSend: (content: string) => void;
    onTyping?: (isTyping: boolean) => void;
    disabled?: boolean;
}

const EMOJI_CATEGORIES = [
    {
        name: 'popular',
        label: '❤️ Popular',
        emojis: ['😊', '😂', '❤️', '💕', '😍', '🥰', '😭', '🥺', '👍', '🙏', '✨', '🔥', '🎉', '🌸', '🌹', '💖', '😎'],
    },
    {
        name: 'smiles',
        label: '😀 Smileys',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '🥹', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳'],
    },
    {
        name: 'gestures',
        label: '👍 Gestures',
        emojis: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '🫀', '🧠', '👀', '👁️', '👅', '👄'],
    },
    {
        name: 'hearts',
        label: '💕 Hearts & Magic',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '🌟', '⭐', '💥', '🔥', '🎉', '🎊'],
    },
    {
        name: 'vibes',
        label: '🎵 Music & Vibes',
        emojis: ['🎹', '🎸', '🎷', '🎺', '🎻', '🪕', '🥁', '🎤', '🎧', '🎼', '🎵', '🎶', '☕', '🍰', '🧁', '🍦', '🍩', '🍪'],
    },
];

export function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps) {
    const [content, setContent] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Close emoji picker when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
        }
        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setContent(val);

        if (onTyping) {
            onTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 2500);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim() || disabled) return;
        onSend(content.trim());
        setContent('');
        setShowEmojiPicker(false);
        if (onTyping) onTyping(false);
    }

    function handleAddEmoji(emoji: string) {
        setContent((prev) => prev + emoji);
        inputRef.current?.focus();
    }

    const canSend = content.trim() && !disabled;

    return (
        <div className="relative max-w-4xl mx-auto" ref={pickerRef}>
            {/* Deep Glass Emoji Picker Popover */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 left-0 sm:left-4 z-50 w-full sm:w-80 bg-gradient-to-br from-rose-950/90 via-pink-950/90 to-purple-950/90 backdrop-blur-2xl border border-white/25 shadow-2xl shadow-black/50 rounded-3xl p-3.5 flex flex-col gap-2.5 overflow-hidden text-white"
                    >
                        {/* Header category tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 border-b border-white/15 no-scrollbar">
                            {EMOJI_CATEGORIES.map((cat, idx) => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => setActiveCategory(idx)}
                                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full whitespace-nowrap transition-all ${
                                        activeCategory === idx
                                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs'
                                            : 'text-pink-200/80 hover:bg-white/15 hover:text-white'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Emoji Grid */}
                        <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto p-1 text-xl">
                            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAddEmoji(emoji)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/20 hover:scale-125 transition-all cursor-pointer"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Translucent Deep Rose Glass Input Box */}
            <motion.form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2.5 rounded-full bg-gradient-to-r from-rose-900/60 via-pink-900/60 to-purple-900/60 backdrop-blur-2xl border border-white/30 text-white shadow-xl shadow-rose-950/30 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-pink-400/40 transition-all"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Emoji Trigger Button */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="text-pink-300 hover:text-white hover:scale-110 text-lg sm:text-xl transition-all cursor-pointer disabled:opacity-50 shrink-0 drop-shadow-xs"
                    title="Choose emoji"
                >
                    😊
                </button>

                <input
                    ref={inputRef}
                    id="chat-input"
                    type="text"
                    value={content}
                    onChange={handleInputChange}
                    disabled={disabled}
                    placeholder={disabled ? 'Bamzy is speaking… ✨' : 'Type a message… 🌸'}
                    className="flex-1 bg-transparent text-white placeholder-pink-200/70 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-60 transition-opacity"
                />

                {/* Glowing Send Button */}
                <motion.button
                    id="chat-send"
                    type="submit"
                    disabled={!canSend}
                    whileHover={canSend ? { scale: 1.08 } : {}}
                    whileTap={canSend ? { scale: 0.92 } : {}}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 cursor-pointer shrink-0 ${
                        canSend
                            ? 'bg-gradient-to-r from-pink-400 via-rose-500 to-purple-500 shadow-pink-500/50 hover:shadow-pink-400/70'
                            : 'bg-white/10 text-pink-200/40 cursor-not-allowed'
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 translate-x-0.5 -translate-y-0.5 rotate-45"
                    >
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </motion.button>
            </motion.form>
        </div>
    );
}
