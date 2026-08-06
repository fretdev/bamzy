'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import { useAuth } from '@/context/AuthContext';
import { MessageResponse } from '@/types/chat';
import { api } from '@/lib/api';
import { connectStomp, sendChatMessage } from '@/lib/stomp';
import { CharacterAvatar } from './CharacterAvatar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ScriptedSequence } from './ScriptedSequence';
import { ChatBackground } from './ChatBackground';
import { ADMIN_USERNAME } from '@/lib/config';
import { ACCENT_COLOR } from '@/lib/home/mood';

type ThemePreset = 'sunset' | 'galaxy' | 'meadow' | 'golden';

const THEME_LABELS: Record<ThemePreset, { label: string; icon: string }> = {
    sunset: { label: 'Sunset Rose', icon: '🌅' },
    galaxy: { label: 'Midnight Galaxy', icon: '🌌' },
    meadow: { label: 'Pastel Meadow', icon: '🌿' },
    golden: { label: 'Golden Hour', icon: '✨' },
};

function seenIntroKey(uid: string | number) {
    return `bamzy:seenIntro:${uid}`;
}

export function ChatExperience() {
    const { accessToken, username, userId, logout } = useAuth();
    const router = useRouter();

    const isHost = Boolean(username) && username!.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase();

    // Atmosphere Theme State
    const [currentTheme, setCurrentTheme] = useState<ThemePreset>('sunset');
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    // Synchronized Reactions Map (messageId -> emoji)
    const [reactionsMap, setReactionsMap] = useState<Record<string, string>>({});

    // List of all registered partners discovered from DB, persisted in localStorage
    const [knownPartners, setKnownPartners] = useState<string[]>(() => {
        if (typeof window === 'undefined') return ['BamzyBot'];
        const cached = localStorage.getItem('bamzy:known_partners');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const cleaned = parsed.filter((p: string) => p && p.toLowerCase() !== 'ayobami');
                    if (cleaned.length > 0) return Array.from(new Set([...cleaned, 'BamzyBot']));
                }
            } catch {}
        }
        return ['BamzyBot'];
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebarMobile, setShowSidebarMobile] = useState(false);
    const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
    const [isSyncingHistory, setIsSyncingHistory] = useState(false);
    const [syncError, setSyncError] = useState(false);

    // Active chat partner
    const [otherUsername, setOtherUsername] = useState<string>(() => {
        if (!username) return ADMIN_USERNAME;
        const lower = username.trim().toLowerCase();
        if (lower === ADMIN_USERNAME.toLowerCase()) return 'BamzyBot';
        return ADMIN_USERNAME;
    });

    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [connected, setConnected] = useState(false);
    const [partnerIsTyping, setPartnerIsTyping] = useState(false);

    const [showingIntro, setShowingIntro] = useState(() => {
        if (typeof window === 'undefined' || !userId) return false;
        const justSignedUp = sessionStorage.getItem('bamzy:justSignedUp') === 'true';
        const hasSeenIntro = Boolean(localStorage.getItem(seenIntroKey(userId)));
        return justSignedUp && !hasSeenIntro;
    });

    const bottomRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<Client | null>(null);

    // Fetch user directory from database
    const refreshUserDirectory = useCallback(async () => {
        if (!accessToken) return;
        setIsRefreshingUsers(true);
        try {
            const registeredUsers = await api.get<{ username: string }[]>('/api/users', accessToken);
            if (Array.isArray(registeredUsers)) {
                const names = registeredUsers
                    .map((u) => u.username)
                    .filter((n) => n && n.trim().toLowerCase() !== username?.trim().toLowerCase());

                const updatedList = Array.from(new Set([...names, 'BamzyBot']));
                setKnownPartners(updatedList);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('bamzy:known_partners', JSON.stringify(updatedList));
                }
            }
        } catch (e) {
            console.warn('Could not fetch user directory from database:', e);
        } finally {
            setIsRefreshingUsers(false);
        }
    }, [accessToken, username]);

    // Poll user directory periodically
    useEffect(() => {
        refreshUserDirectory();
        const interval = setInterval(refreshUserDirectory, 10000);
        return () => clearInterval(interval);
    }, [refreshUserDirectory]);

    // Sync Conversation History Function with Automatic Retry
    const syncConversation = useCallback(async (targetPartner: string) => {
        if (!accessToken || !username || !targetPartner) return;

        // If chatting with @BamzyBot, load local conversation history
        if (targetPartner.toLowerCase() === 'bamzybot') {
            setMessages([
                {
                    publicId: 'bamzy-welcome',
                    senderUsername: 'BamzyBot',
                    receiverUsername: username,
                    content: `Hello @${username}! ✨ I'm your space companion! Ask me anything, or say hello! 💕`,
                    status: 'DELIVERED',
                    createdAt: new Date().toISOString(),
                },
            ]);
            setConnected(true);
            setSyncError(false);
            return;
        }

        setIsSyncingHistory(true);
        setSyncError(false);

        try {
            const history = await api.get<MessageResponse[]>(
                `/api/messages/history/${targetPartner}`,
                accessToken
            );

            // Process history messages & extract any saved reaction payloads
            const cleanHistory: MessageResponse[] = [];
            if (Array.isArray(history)) {
                history.forEach((m) => {
                    if (m.content.startsWith('[REACTION:')) {
                        const match = m.content.match(/^\[REACTION:(.+?):(.+?)\]$/);
                        if (match) {
                            const targetId = match[1];
                            const emoji = match[2];
                            setReactionsMap((prev) => ({ ...prev, [targetId]: emoji }));
                        }
                    } else {
                        cleanHistory.push(m);
                        const partner = m.senderUsername === username ? m.receiverUsername : m.senderUsername;
                        if (partner && partner.trim().toLowerCase() !== username?.trim().toLowerCase()) {
                            setKnownPartners((prev) => Array.from(new Set([...prev, partner, 'BamzyBot'])));
                        }
                    }
                });
            }

            setMessages(cleanHistory);
            setSyncError(false);
        } catch (err) {
            console.warn('Failed to sync conversation history:', err);
            setSyncError(true);
        } finally {
            setIsSyncingHistory(false);
        }
    }, [accessToken, username]);

    // Connect to STOMP and fetch conversation history with active partner
    useEffect(() => {
        if (!accessToken || !username || !otherUsername) return;

        let cancelled = false;

        async function setup() {
            await syncConversation(otherUsername);
            if (cancelled) return;

            // Connect or reuse STOMP client
            if (!clientRef.current || !clientRef.current.connected) {
                try {
                    const client = await connectStomp(
                        accessToken!,
                        (frame) => {
                            if (cancelled) return;
                            const newMessage: MessageResponse = JSON.parse(frame.body);

                            // Intercept real-time reaction STOMP events
                            if (newMessage.content.startsWith('[REACTION:')) {
                                const match = newMessage.content.match(/^\[REACTION:(.+?):(.+?)\]$/);
                                if (match) {
                                    const targetId = match[1];
                                    const emoji = match[2];
                                    setReactionsMap((prev) => ({ ...prev, [targetId]: emoji }));
                                }
                                return;
                            }

                            setMessages((prev) => {
                                if (prev.some((m) => m.publicId === newMessage.publicId)) {
                                    return prev;
                                }
                                return [...prev, newMessage];
                            });

                            setKnownPartners((prev) => {
                                const partner = newMessage.senderUsername === username ? newMessage.receiverUsername : newMessage.senderUsername;
                                if (partner && partner.trim().toLowerCase() !== username?.trim().toLowerCase()) {
                                    return Array.from(new Set([...prev, partner, 'BamzyBot']));
                                }
                                return prev;
                            });
                        },
                        username!
                    );

                    if (!cancelled) {
                        clientRef.current = client;
                        setConnected(true);
                    }
                } catch (err) {
                    console.error('WebSocket connection failed:', err);
                    if (!cancelled) setConnected(false);
                }
            }
        }

        setup();

        return () => {
            cancelled = true;
        };
    }, [accessToken, username, otherUsername, syncConversation]);

    // Network Reconnect & Online Window Focus Listener
    useEffect(() => {
        function handleOnline() {
            if (otherUsername) {
                syncConversation(otherUsername);
                refreshUserDirectory();
            }
        }
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [otherUsername, syncConversation, refreshUserDirectory]);

    // Auto-scroll to bottom whenever messages update
    useEffect(() => {
        if (!showingIntro) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, showingIntro, partnerIsTyping]);

    const handleIntroComplete = useCallback(() => {
        if (userId) {
            localStorage.setItem(seenIntroKey(userId), 'true');
        }
        sessionStorage.removeItem('bamzy:justSignedUp');
        setShowingIntro(false);
    }, [userId]);

    const handleSend = useCallback((content: string) => {
        if (!otherUsername) return;

        // If chatting with @BamzyBot mascot AI engine
        if (otherUsername.toLowerCase() === 'bamzybot') {
            const userMsg: MessageResponse = {
                publicId: `user-bot-${Date.now()}`,
                senderUsername: username!,
                receiverUsername: 'BamzyBot',
                content,
                status: 'DELIVERED',
                createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, userMsg]);
            setPartnerIsTyping(true);

            setTimeout(async () => {
                const { getBamzyBotReply } = await import('@/lib/chat/BamzyBot');
                const replyText = getBamzyBotReply(content, username!);

                const botMsg: MessageResponse = {
                    publicId: `bot-reply-${Date.now()}`,
                    senderUsername: 'BamzyBot',
                    receiverUsername: username!,
                    content: replyText,
                    status: 'DELIVERED',
                    createdAt: new Date().toISOString(),
                };

                setPartnerIsTyping(false);
                setMessages((prev) => [...prev, botMsg]);
            }, 1200);

            return;
        }

        if (!clientRef.current) return;
        sendChatMessage(clientRef.current, otherUsername, content);
    }, [otherUsername, username]);

    // Real-Time Synchronized Reaction Handler
    const handleReact = useCallback((messageId: string, emoji: string) => {
        setReactionsMap((prev) => ({ ...prev, [messageId]: emoji }));

        if (!clientRef.current || !otherUsername || otherUsername.toLowerCase() === 'bamzybot') return;
        sendChatMessage(clientRef.current, otherUsername, `[REACTION:${messageId}:${emoji}]`);
    }, [otherUsername]);

    const handleLeaveChat = useCallback(async () => {
        try {
            if (accessToken) {
                await api.post('/api/auth/logout', undefined, accessToken);
            }
        } catch (err) {
            console.warn('Logout API notice:', err);
        } finally {
            clientRef.current?.deactivate();
            clientRef.current = null;
            logout();
            router.push('/login');
        }
    }, [accessToken, logout, router]);

    const filteredPartners = knownPartners.filter((p) =>
        p.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (!accessToken) {
        return (
            <div className="w-full h-screen flex items-center justify-center p-4">
                <p className="text-gray-600 font-medium">
                    You need to be logged in.{' '}
                    <a href="/login" style={{ color: ACCENT_COLOR }} className="underline font-bold">Log in</a>
                </p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full chat-viewport overflow-hidden">
            <ChatBackground theme={currentTheme} />

            {/* Deep Glass Header */}
            <motion.header
                className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-rose-600/90 via-pink-600/90 to-purple-600/90 text-white backdrop-blur-2xl border-b border-white/20 shadow-lg shadow-rose-900/15 shrink-0"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Mobile Sidebar Toggle Button */}
                    {isHost && (
                        <button
                            type="button"
                            onClick={() => setShowSidebarMobile((prev) => !prev)}
                            className="md:hidden p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                            title="Toggle Conversations"
                        >
                            <span>💬</span>
                        </button>
                    )}

                    {/* Animated Character Avatar */}
                    <CharacterAvatar
                        variant={otherUsername.toLowerCase() === 'ayobami' ? 'warm' : 'sassy'}
                        size="md"
                        showStatus={true}
                        isOnline={connected}
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-extrabold text-white text-xs sm:text-base leading-tight flex items-center gap-1.5 drop-shadow-sm">
                                {otherUsername}
                                <span className="text-xs">💕</span>
                            </p>

                            {/* Non-host quick toggle pill for BamzyBot */}
                            {!isHost && (
                                <button
                                    type="button"
                                    onClick={() => setOtherUsername((prev) => (prev === 'BamzyBot' ? ADMIN_USERNAME : 'BamzyBot'))}
                                    className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-[10px] font-extrabold text-white transition-all cursor-pointer whitespace-nowrap"
                                >
                                    {otherUsername === 'BamzyBot' ? (
                                        <>
                                            <span className="hidden sm:inline">💬 Chat with {ADMIN_USERNAME}</span>
                                            <span className="sm:hidden">💬 {ADMIN_USERNAME}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="hidden sm:inline">🤖 Chat with Bamzy Bot</span>
                                            <span className="sm:hidden">🤖 Bamzy Bot</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Connection indicator + Live Typing Status */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {partnerIsTyping ? (
                                <span className="text-[11px] text-pink-200 font-extrabold tracking-wide animate-pulse">
                                    @{otherUsername} is typing… ✨
                                </span>
                            ) : syncError ? (
                                <button
                                    type="button"
                                    onClick={() => syncConversation(otherUsername)}
                                    className="text-[11px] text-rose-200 hover:text-white font-extrabold underline flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Sync failed (Tap to retry 🔄)</span>
                                </button>
                            ) : isSyncingHistory ? (
                                <span className="text-[11px] text-pink-200 font-semibold animate-pulse">
                                    Syncing messages… 🌸
                                </span>
                            ) : (
                                <span className="text-[11px] text-pink-100 font-semibold tracking-wide">
                                    {connected ? 'online' : 'connecting…'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Header Actions & Labeled Theme Menu */}
                <div className="flex items-center gap-1.5 sm:gap-2 relative">
                    {/* Clear Labeled Theme Selector Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowThemeMenu((prev) => !prev)}
                            className="px-2 sm:px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-[11px] sm:text-xs font-extrabold text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                            title="Change Atmosphere Theme"
                        >
                            <span className="hidden sm:inline">🎨 Theme: {THEME_LABELS[currentTheme].label}</span>
                            <span className="sm:hidden">🎨 {THEME_LABELS[currentTheme].label}</span>
                            <span className="text-[9px] sm:text-[10px]">▾</span>
                        </button>

                        <AnimatePresence>
                            {showThemeMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    className="absolute right-0 mt-2 z-50 w-44 rounded-2xl bg-gradient-to-b from-rose-950/95 to-purple-950/95 backdrop-blur-2xl border border-white/30 shadow-2xl p-1.5 flex flex-col gap-1 text-white"
                                >
                                    {(Object.keys(THEME_LABELS) as ThemePreset[]).map((tKey) => (
                                        <button
                                            key={tKey}
                                            type="button"
                                            onClick={() => {
                                                setCurrentTheme(tKey);
                                                setShowThemeMenu(false);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-left ${
                                                currentTheme === tKey
                                                    ? 'bg-rose-500 text-white shadow-xs'
                                                    : 'hover:bg-white/15 text-pink-100'
                                            }`}
                                        >
                                            <span>{THEME_LABELS[tKey].icon}</span>
                                            <span>{THEME_LABELS[tKey].label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="hidden md:flex flex-col items-end mr-1 text-right">
                        <span className="text-[10px] font-bold text-pink-200 uppercase tracking-wider">Logged in as</span>
                        <span className="text-xs font-extrabold text-white drop-shadow-xs">{username}</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLeaveChat}
                        className="text-[11px] sm:text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/30 shadow-sm flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                        title="Leave chat & log out"
                    >
                        <span>Leave</span>
                    </motion.button>
                </div>
            </motion.header>

            {/* Central Workspace Container */}
            <div className="relative z-10 flex-1 flex overflow-hidden">
                {/* Desktop Host Conversations Sidebar */}
                {isHost && (
                    <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-rose-950/40 via-pink-950/40 to-purple-950/40 backdrop-blur-2xl border-r border-white/15 p-3.5 gap-3 text-white shrink-0">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-extrabold tracking-wider uppercase text-pink-200 flex items-center gap-1">
                                💬 Conversations
                            </span>
                            <button
                                type="button"
                                onClick={refreshUserDirectory}
                                className={`text-xs font-bold text-pink-200 hover:text-white flex items-center gap-1 cursor-pointer ${
                                    isRefreshingUsers ? 'animate-spin' : ''
                                }`}
                                title="Sync Registered Users"
                            >
                                🔄
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Search registered user…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-pink-300/70 text-xs font-medium focus:outline-none focus:border-white/50 transition-colors"
                        />

                        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
                            {filteredPartners.map((partnerName) => {
                                const isSelected = partnerName.toLowerCase() === otherUsername.toLowerCase();
                                const isBot = partnerName.toLowerCase() === 'bamzybot';

                                return (
                                    <button
                                        key={partnerName}
                                        type="button"
                                        onClick={() => setOtherUsername(partnerName)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all cursor-pointer text-left ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-rose-500/90 to-pink-500/90 text-white shadow-md border border-white/30'
                                                : 'bg-white/5 hover:bg-white/15 text-pink-100 border border-white/10'
                                        }`}
                                    >
                                        <CharacterAvatar
                                            variant={isBot ? 'warm' : 'sassy'}
                                            size="sm"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-extrabold text-xs truncate">
                                                {isBot ? '🤖 Bamzy Bot' : `@${partnerName}`}
                                            </p>
                                            <span className="text-[10px] text-pink-200/90 font-semibold block mt-0.5">
                                                {isSelected ? 'Active Conversation ✨' : isBot ? 'Space AI Companion 🤖' : 'Click to open chat'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>
                )}

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {isHost && showSidebarMobile && (
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                            className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-rose-950/95 via-pink-950/95 to-purple-950/95 backdrop-blur-2xl border-r border-white/20 shadow-2xl p-4 flex flex-col gap-3 text-white"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold tracking-wider uppercase text-pink-200">
                                    💬 Registered Users
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowSidebarMobile(false)}
                                    className="text-xs font-bold text-pink-200 hover:text-white"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Search user…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-pink-300/70 text-xs font-medium focus:outline-none"
                            />

                            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
                                {filteredPartners.map((partnerName) => {
                                    const isSelected = partnerName.toLowerCase() === otherUsername.toLowerCase();
                                    const isBot = partnerName.toLowerCase() === 'bamzybot';

                                    return (
                                        <button
                                            key={partnerName}
                                            type="button"
                                            onClick={() => {
                                                setOtherUsername(partnerName);
                                                setShowSidebarMobile(false);
                                            }}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left ${
                                                isSelected
                                                    ? 'bg-rose-500 text-white shadow-md border border-white/30'
                                                    : 'bg-white/10 hover:bg-white/20 text-pink-100'
                                            }`}
                                        >
                                            <CharacterAvatar variant={isBot ? 'warm' : 'sassy'} size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-extrabold text-xs truncate">
                                                    {isBot ? '🤖 Bamzy Bot' : `@${partnerName}`}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Active Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Scrollable Messages Container */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-1.5 scroll-smooth overscroll-contain">
                        {/* Scripted intro — plays once on first visit */}
                        <AnimatePresence>
                            {showingIntro && username && (
                                <ScriptedSequence
                                    currentUsername={username}
                                    onComplete={handleIntroComplete}
                                />
                            )}
                        </AnimatePresence>

                        {/* Real messages from history + live STOMP */}
                        {!showingIntro && messages.length > 0 && messages.map((m) => (
                            <MessageBubble
                                key={m.publicId}
                                message={m}
                                currentUsername={username ?? ''}
                                reaction={reactionsMap[m.publicId]}
                                onReact={handleReact}
                            />
                        ))}

                        {/* Partner Typing Bubble */}
                        {partnerIsTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-end gap-2 justify-start my-1"
                            >
                                <CharacterAvatar variant="warm" size="sm" />
                                <div className="px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-pink-200/70 shadow-md flex gap-1.5 items-center rounded-bl-xs">
                                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
                                </div>
                            </motion.div>
                        )}

                        {/* Animated Empty Conversation State */}
                        {!showingIntro && messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto"
                            >
                                <CharacterAvatar
                                    variant={otherUsername.toLowerCase() === 'ayobami' ? 'warm' : 'sassy'}
                                    size="lg"
                                />
                                <h3 className="text-white font-extrabold text-sm sm:text-base mt-3 drop-shadow-sm">
                                    Start a conversation with @{otherUsername} 💕
                                </h3>
                                <p className="text-pink-100/80 text-xs mt-1 max-w-xs font-medium leading-relaxed">
                                    No messages in this thread yet. Send a message below to begin chatting!
                                </p>
                            </motion.div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Bottom Fixed Message Input */}
                    <div className="px-3 sm:px-4 pb-3 pt-1 shrink-0">
                        <MessageInput onSend={handleSend} disabled={showingIntro} />
                    </div>
                </div>
            </div>
        </div>
    );
}
