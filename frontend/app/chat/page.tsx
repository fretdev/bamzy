"use client";

import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { connectStomp, sendChatMessage } from "@/lib/stomp";
import { MessageResponse } from "@/types/chat";

const PARTICIPANTS = ["Fretdev", "Ayobami"];

function getOtherUsername(currentUsername: string): string {
    return PARTICIPANTS.find((u) => u !== currentUsername) ?? "";
}

export default function ChatPage() {
    const { accessToken, username } = useAuth();
    const otherUsername = username ? getOtherUsername(username) : "";

    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [content, setContent] = useState("");
    const [connected, setConnected] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!accessToken || !username || !otherUsername) return;

        let cancelled = false;

        async function setup() {
            const history = await api.get<MessageResponse[]>(
                `/api/messages/history/${otherUsername}`,
                accessToken!
            );

            if (cancelled) return;
            setMessages(history);

            const client = await connectStomp(
                accessToken!,
                (frame) => {
                    if (cancelled) return;
                    const newMessage: MessageResponse = JSON.parse(frame.body);
                    setMessages((prev) => [...prev, newMessage]);
                },
                username!
            );

            if (cancelled) {
                client.deactivate();
                return;
            }

            clientRef.current = client;
            setConnected(true);
        }

        setup();

        return () => {
            cancelled = true;
            clientRef.current?.deactivate();
            clientRef.current = null;
            setConnected(false);
        };
    }, [accessToken, username, otherUsername]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim() || !clientRef.current) return;

        sendChatMessage(clientRef.current, otherUsername, content);
        setContent("");
    }

    if (!accessToken) {
        return <p>You must be logged in to view this page.</p>;
    }

    return (
        <div>
            <p>Status: {connected ? "Connected" : "Connecting..."}</p>

            <div>
                {messages.map((m) => (
                    <div key={m.publicId}>
                        <strong>{m.senderUsername}:</strong> {m.content}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend}>
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}