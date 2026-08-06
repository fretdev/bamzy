'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@stomp/stompjs';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { connectStomp, sendChatMessage } from '@/lib/stomp';
import { MessageResponse } from '@/types/chat';
import { ChatBackground, ThemePreset } from './ChatBackground';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ScriptedSequence } from './ScriptedSequence';
import { CharacterAvatar } from './CharacterAvatar';
import { ACCENT_COLOR } from '@/lib/home/mood';
import { ADMIN_USERNAME } from '@/lib/config';
import { getBamzyBotReply } from '@/lib/chat/BamzyBot';

function seenIntroKey(userId: string) {
    return `bamzy:seenIntro:${userId}`;
}

const THEME_LABELS: Record<ThemePreset, { label: string; icon: string }> = {
    sunset: { label: 'Sunset Rose', icon: '🌅' },
    galaxy: { label: 'Midnight Galaxy', icon: '🌌' },
    meadow: { label: 'Pastel Meadow', icon: '🌿' },
    golden: { label: 'Golden Hour', icon: '✨' },
};

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

    // Connect to STOMP and fetch conversation history with active partner
    useEffect(() => {
        if (!accessToken || !username || !otherUsername) return;

        let cancelled = false;

        async function setup() {
            try {
                // If chatting with @BamzyBot, load local conversation history
                if (otherUsername.toLowerCase() === 'bamzybot') {
                    setMessages([
                        {
                            publicId: 'bamzy-welcome',
                            senderUsername: 'BamzyBot',
                            receiverUsername: username!,
                            content: `Hello @${username}! ✨ I'm your space companion! Ask me anything, or say hello! 💕`,
                            status: 'DELIVERED',
                            createdAt: new Date().toISOString(),
                        },
                    ]);
                    setConnected(true);
                    return;
                }

                const history = await api.get<MessageResponse[]>(
                    `/api/messages/history/${otherUsername}`,
                    accessToken!
                );
                if (cancelled) return;

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

                // Connect or reuse STOMP client
                if (!clientRef.current) {
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

                            setMessages((prev) => [...prev, newMessage]);

                            // Track incoming senders
                            if (newMessage.senderUsername) {
                                const sender = newMessage.senderUsername;
                                if (sender.trim().toLowerCase() !== username?.trim().toLowerCase()) {
                                    setKnownPartners((prev) => Array.from(new Set([...prev, sender, 'BamzyBot'])));
                                }
                            }
                        },
                        username!
                    );
                    if (cancelled) { client.deactivate(); return; }
                    clientRef.current = client;
                    setConnected(true);
                }
            } catch (err) {
                console.error("Failed to set up chat connection:", err);
            }
        }

        setup();

        return () => {
            cancelled = true;
        };
    }, [accessToken, username, otherUsername]);

    // Cleanup STOMP connection when leaving page
    useEffect(() => {
        return () => {
            clientRef.current?.deactivate();
            clientRef.current = null;
            setConnected(false);
        };
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showingIntro, partnerIsTyping]);

    const handleIntroComplete = useCallback(() => {
        if (userId) {
            localStorage.setItem(seenIntroKey(userId), '1');
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('bamzy:justSignedUp');
            }
        }
        setShowingIntro(false);
    }, [userId]);

    const handleSend = useCallback((content: string) => {
        if (!otherUsername) return;

        // Route to BamzyBot if chatting with @BamzyBot
        if (otherUsername.toLowerCase() === 'bamzybot') {
            const userMsg: MessageResponse = {
                publicId: `user-${Date.now()}`,
                senderUsername: username!,
                receiverUsername: 'BamzyBot',
                content,
                status: 'DELIVERED',
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setPartnerIsTyping(true);

            setTimeout(() => {
                const replyText = getBamzyBotReply(content, username!);
                const botMsg: MessageResponse = {
                    publicId: `bot-${Date.now()}`,
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
        // Broadcast structured reaction payload over WebSockets
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
        <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col">
            <ChatBackground theme={currentTheme} />

            {/* Deep Glass Header */}
            <motion.header
                className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-rose-600/90 via-pink-600/90 to-purple-600/90 text-white backdrop-blur-2xl border-b border-white/20 shadow-lg shadow-rose-900/15"
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

            {/* Main Multi-User Workspace Container */}
            <div className="relative z-10 flex-1 flex overflow-hidden">
                {/* Desktop Conversations Sidebar (Visible for Host) */}
                {isHost && (
                    <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-rose-950/85 via-pink-950/85 to-purple-950/85 backdrop-blur-2xl border-r border-white/15 p-3.5 text-white gap-3 z-20 shrink-0">
                        {/* Sidebar Header & Sleek Refresh Button */}
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-extrabold tracking-wider uppercase text-pink-200 flex items-center gap-1.5">
                                💬 Users ({filteredPartners.length})
                            </span>
                            
                            <button
                                type="button"
                                onClick={refreshUserDirectory}
                                disabled={isRefreshingUsers}
                                className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-[11px] font-bold text-white flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                title="Refresh registered users list"
                            >
                                <span>{isRefreshingUsers ? 'Syncing…' : 'Sync'}</span>
                            </button>
                        </div>

                        {/* Search Pill */}
                        <input
                            type="text"
                            placeholder="Search registered user…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-pink-300/70 text-xs font-medium focus:outline-none focus:border-white/40 transition-colors"
                        />

                        {/* Registered Users List */}
                        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5 no-scrollbar">
                            {filteredPartners.map((partner) => {
                                const isSelected = otherUsername.toLowerCase() === partner.toLowerCase();
                                const isBot = partner.toLowerCase() === 'bamzybot';

                                return (
                                    <button
                                        key={partner}
                                        type="button"
                                        onClick={() => setOtherUsername(partner)}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-pink-500/90 to-rose-500/90 border border-white/40 shadow-md shadow-pink-900/30'
                                                : 'hover:bg-white/10 border border-transparent'
                                        }`}
                                    >
                                        <CharacterAvatar
                                            variant={isBot ? 'warm' : partner.toLowerCase() === 'ayobami' ? 'warm' : 'sassy'}
                                            size="sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-extrabold text-xs text-white truncate flex items-center gap-1">
                                                <span>@{partner}</span>
                                                {isBot && <span className="text-[10px] bg-pink-500/80 px-1.5 py-0.2 rounded-full">BOT</span>}
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

                            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 no-scrollbar">
                                {filteredPartners.map((partner) => {
                                    const isSelected = otherUsername.toLowerCase() === partner.toLowerCase();
                                    return (
                                        <button
                                            key={partner}
                                            type="button"
                                            onClick={() => {
                                                setOtherUsername(partner);
                                                setShowSidebarMobile(false);
                                            }}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
                                                isSelected
                                                    ? 'bg-rose-600 border border-white/40 shadow-md'
                                                    : 'hover:bg-white/10'
                                            }`}
                                        >
                                            <CharacterAvatar
                                                variant={partner.toLowerCase() === 'ayobami' ? 'warm' : 'sassy'}
                                                size="sm"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-extrabold text-xs text-white truncate">
                                                    @{partner}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Message List & Input Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
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
                                    No messages in this thread yet. Send a message or voice note below to begin chatting!
                                </p>
                            </motion.div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Bottom Input Container */}
                    <div className="relative z-10 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-white/15 bg-rose-950/25 backdrop-blur-xl">
                        <MessageInput
                            onSend={handleSend}
                            disabled={showingIntro || !connected}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
